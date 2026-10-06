import {useCallback, useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {PageContainer} from '@/components/ui/page-container';
import {Avatar} from '@/components/ui/avatar';
import Stepper, {type StepperStep} from '@/components/ui/Stepper';
import Uploader from '@/components/Uploader/Uploader';
import NotificationPreferencesSection from '../Notifications/NotificationPreferencesSection';
import TicketLayoutPreferenceSection from '../TicketLayout/TicketLayoutPreferenceSection';
import ChangePasswordSection from './ChangePasswordSection';
import AccessTokensSection from './AccessTokensSection';
import {useSetModuleTitle} from '../ModuleTitle';
import {useSetBreadcrumb} from '../Breadcrumb';
import JwtManager from '@/lib/Jwt/JwtManager';
import useListUsersHook from '@/lib/User/useListUsersHook';
import useUploadUserAvatarHook from '@/lib/User/useUploadUserAvatarHook';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import type {UserSummary} from '@/lib/User/Type/types';

type ProfileStepId = 'profile' | 'notifications' | 'ticket-layout' | 'change-password' | 'access-tokens';

const STEPS: StepperStep[] = [
  {id: 'profile', label: 'Profile'},
  {id: 'notifications', label: 'Notifications'},
  {id: 'ticket-layout', label: 'Ticket layout'},
  {id: 'change-password', label: 'Change password'},
  {id: 'access-tokens', label: 'Personal access tokens'},
];

const stepIdFromParam = (value: string | null): ProfileStepId =>
  value === 'notifications' || value === 'ticket-layout' || value === 'change-password' || value === 'access-tokens'
    ? value
    : 'profile';

// There's no GET /api/user/me - "which UserSummary is mine" is found by
// matching the JWT's email against the user directory, same email
// JwtManager.getEmail() already surfaces in UserBadge's header.
// undefined = still loading, null = no matching entry found.
const ProfilePage = () => {
  const {listUsers} = useListUsersHook();
  const {uploadUserAvatar} = useUploadUserAvatarHook();
  const [me, setMe] = useState<UserSummary | null | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeStep = useMemo(() => stepIdFromParam(searchParams.get('step')), [searchParams]);

  useSetModuleTitle('My profile');
  // Not in the PrismMenu tree (reached via UserBadge's dropdown, not the
  // sidebar) - useBreadcrumb's default has nothing to walk for this route.
  useSetBreadcrumb([{label: 'My profile', link: null}]);

  const handleStepSelect = useCallback(
    (id: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('step', id);
          return next;
        },
        {replace: true},
      );
    },
    [setSearchParams],
  );

  const refetchMe = useCallback(() => {
    const email = JwtManager.getInstance().getEmail();

    listUsers().then((result) => {
      if (result.success) {
        setMe(result.users.find((user) => user.email === email) ?? null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listUsers is a thin useRequestHook wrapper recreated every render
  }, []);

  useEffect(() => {
    refetchMe();
  }, [refetchMe]);

  if (me === undefined) {
    return <p className="p-8 text-sm text-muted-foreground">Loading profile…</p>;
  }

  if (me === null) {
    return <p className="p-8 text-sm text-muted-foreground">Couldn't find your account in the user directory.</p>;
  }

  return (
    <PageContainer className="min-h-0">
      <p className="text-sm font-semibold text-foreground">My profile</p>

      <Stepper steps={STEPS} activeId={activeStep} onSelect={handleStepSelect} />

      {/* PageContainer's own h-full is fixed to WorkPlace's dashed-border
          box, not to content (see its comment) - the ticket-layout editor
          in particular can grow much taller than the viewport (many
          stacked widget tiles), so without this wrapper it silently
          overflowed PAST that box instead of scrolling inside it, leaving
          the box's own dashed bottom border visible mid-page. Only this
          region scrolls - the title/Stepper above stay pinned. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeStep === 'profile' && (
          <div className="flex max-w-md flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar name={getUserDisplayName(me)} src={me.avatarUrl} className="h-16 w-16 text-xl" />
              <div>
                <p className="font-medium text-foreground">{getUserDisplayName(me)}</p>
                <p className="text-sm text-muted-foreground">{me.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-4">
              <label className="text-sm font-medium text-foreground">Avatar</label>
              <Uploader
                accept="image/*"
                triggerLabel="Upload new avatar"
                onUpload={(file, onProgress, id) => uploadUserAvatar(id, file, onProgress)}
                onSettled={refetchMe}
              />
            </div>
          </div>
        )}

        {activeStep === 'notifications' && <NotificationPreferencesSection />}

        {activeStep === 'ticket-layout' && <TicketLayoutPreferenceSection />}

        {activeStep === 'change-password' && <ChangePasswordSection />}

        {activeStep === 'access-tokens' && <AccessTokensSection />}
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
