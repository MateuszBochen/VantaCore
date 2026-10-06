import {useEffect, useRef, useState} from 'react';
import {Cpu} from 'lucide-react';
import {eventBus} from '../../../lib/EventBus/EventBus';
import {RequestStartedEvent} from '../../../lib/Request/Event/RequestStartedEvent';
import {RequestFinishedEvent} from '../../../lib/Request/Event/RequestFinishedEvent';
import {WebSocketMessageReceivedEvent} from '../../../lib/WebSocket/Event/WebSocketMessageReceivedEvent';

// How long the reflection stays visible after a single websocket message -
// there's no "finished" event for it the way HTTP requests have (a WS
// message is instantaneous, not a span), so this is a timed pulse instead of
// a start/stop pair. Rapid successive messages just keep re-extending it.
const WS_PULSE_MS = 700;

// Sidebar's header: the icon badge (with its "vinyl" light-sweep, active
// while an HTTP request is in flight OR briefly after a websocket message
// arrives - see the two sources below) + the "VantaCore" wordmark. Self-
// contained - owns its own activity tracking via the event bus rather than
// Sidebar passing it down, since nothing else in Sidebar needs this state.
const SidebarLogo = () => {
  const [isApiActive, setIsApiActive] = useState(false);
  const [isWsActive, setIsWsActive] = useState(false);
  const activeRequestCount = useRef(0);
  const wsPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Counts in-flight API requests via the event bus so the logo keeps
  // "spinning" for as long as any request is pending, regardless of how many
  // overlap - only dropping to 0 stops the animation.
  useEffect(() => {
    const handleRequestStarted = () => {
      activeRequestCount.current += 1;
      setIsApiActive(true);
    };

    const handleRequestFinished = () => {
      activeRequestCount.current = Math.max(0, activeRequestCount.current - 1);
      setIsApiActive(activeRequestCount.current > 0);
    };

    eventBus.subscribe<RequestStartedEvent>(RequestStartedEvent.name, handleRequestStarted);
    eventBus.subscribe<RequestFinishedEvent>(RequestFinishedEvent.name, handleRequestFinished);

    return () => {
      eventBus.unsubscribe<RequestStartedEvent>(RequestStartedEvent.name, handleRequestStarted);
      eventBus.unsubscribe<RequestFinishedEvent>(RequestFinishedEvent.name, handleRequestFinished);
    };
  }, []);

  // Websocket "input" activity - output doesn't exist yet (WebSocketService
  // never calls socket.send() anywhere in the app right now), so this only
  // ever fires on incoming messages. Reuse the same event if/when outbound
  // messages are added.
  useEffect(() => {
    const handleMessageReceived = () => {
      setIsWsActive(true);

      if (wsPulseTimer.current) {
        clearTimeout(wsPulseTimer.current);
      }

      wsPulseTimer.current = setTimeout(() => setIsWsActive(false), WS_PULSE_MS);
    };

    eventBus.subscribe<WebSocketMessageReceivedEvent>(WebSocketMessageReceivedEvent.name, handleMessageReceived);

    return () => {
      eventBus.unsubscribe<WebSocketMessageReceivedEvent>(WebSocketMessageReceivedEvent.name, handleMessageReceived);

      if (wsPulseTimer.current) {
        clearTimeout(wsPulseTimer.current);
      }
    };
  }, []);

  const isActive = isApiActive || isWsActive;

  return (
    <div className="flex h-18 items-center gap-3 border-b border-border px-4">
      {/* Fixed cyan/fuchsia, NOT theme-driven (unlike the rest of chrome) -
          the logo is brand identity and stays the same regardless of which
          of the 3 themes is active, same reasoning as a company logo never
          reskinning itself for dark mode. */}
      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black">
        <Cpu className="h-5 w-5" />
        {/* Vinyl-style light reflection: spins continuously, only its opacity
            toggles with activity (HTTP requests in flight, or a brief pulse
            per websocket message - see isActive above), so overlapping
            activity never restarts the animation - it just stays visible for
            longer. mix-blend-mode:screen (not plain alpha) is what actually
            makes the sweep read as a "shine" against the cyan/fuchsia
            gradient behind it - a flat white overlay at the same opacity
            barely registered against a background that's already this
            bright. */}
        <div
          aria-hidden="true"
          style={{animationDuration: '2.2s', mixBlendMode: 'screen'}}
          className={`pointer-events-none absolute inset-0 animate-spin rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.95)_25deg,transparent_70deg)] transition-opacity duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-widest text-cyan-300">VantaCore</p>
      </div>
    </div>
  );
};

export default SidebarLogo;
