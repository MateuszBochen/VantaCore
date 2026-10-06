import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {registerToastEventSubscribers} from './lib/Toast/ToastEventSubscriber'
import {jwtRefreshScheduler} from './lib/Jwt/JwtRefreshScheduler'
import {webSocketService} from './lib/WebSocket/WebSocketService'

registerToastEventSubscribers();
jwtRefreshScheduler.start();
webSocketService.start();

createRoot(document.getElementById('root')!).render(
  //
    <App />
  // </StrictMode>,
)
