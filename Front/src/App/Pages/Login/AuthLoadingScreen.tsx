import {Loader2} from 'lucide-react';
import Background from '../../../components/layout/Background.tsx';
import AuthCard from './AuthCard.tsx';
import AuthHeader from './AuthHeader.tsx';

// App.tsx's "logged in, waiting for GET /api/app-settings" screen - the same
// Background + AuthCard the login/SSO screens use, so signing in reads as one
// card that stays put until the panel is ready instead of card → blank →
// panel. No entry animation: it replaces a card that's already on screen
// (Login's/SsoCallback's success state), so popping in again would flicker.
const AuthLoadingScreen = () => (
  <Background>
    <div className="relative z-10 flex h-full w-full items-center justify-center">
      <AuthCard state="success" animateIn={false}>
        <AuthHeader subtitle="SECURE SESSION" />

        <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          ACCESS GRANTED – INITIALIZING VantaCore…
        </div>
      </AuthCard>
    </div>
  </Background>
);

export default AuthLoadingScreen;
