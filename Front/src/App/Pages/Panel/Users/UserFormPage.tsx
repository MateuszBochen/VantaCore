import {useCallback, useEffect, useState} from 'react';
import {Check} from 'lucide-react';
import {PageContainer} from '@/components/ui/page-container';
import {useNavigate, useParams} from 'react-router-dom';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import Stepper, {type StepperStep} from '@/components/ui/Stepper';
import {useSetModuleTitle} from '../ModuleTitle';
import {useSetBreadcrumb} from '../Breadcrumb';
import {eventBus} from '@/lib/EventBus/EventBus';
import useCreateUserHook from '@/lib/User/useCreateUserHook';
import useGetUserHook from '@/lib/User/useGetUserHook';
import useUpdateUserHook from '@/lib/User/useUpdateUserHook';
import useAssignUserRolesHook from '@/lib/User/useAssignUserRolesHook';
import {UserCreationFailedEvent} from '@/lib/User/Event/UserCreationFailedEvent';
import UserRolePicker from './UserRolePicker';
import type {UserDetail} from '@/lib/User/Type/types';

const STEPS: StepperStep[] = [
  {id: 'basics', label: 'Basics'},
  {id: 'roles', label: 'Roles'},
];

// Same 422 field-error mapping convention as Register.tsx/useCreateAdminHook
// - only relevant to isNew (POST /api/user); PUT /api/user/{userId} doesn't
// document a matching error shape, so edit mode just falls back to
// useUpdateUserHook's generic toast on failure.
const FORM_FIELD_NAMES = new Set(['email', 'password', 'firstName', 'lastName']);

type UserDraft = {
  email: string;
  firstName: string;
  lastName: string;
  // Only meaningful/shown for isNew - PUT /api/user/{userId} doesn't accept
  // a password, there's no "change password" flow here.
  password: string;
  roleIds: string[];
};

const createDraftUser = (): UserDraft => ({email: '', firstName: '', lastName: '', password: '', roleIds: []});

const draftFromUser = (user: UserDetail): UserDraft => ({
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  password: '',
  roleIds: user.roles.map((role) => role.id),
});

type UserFormPageProps = {
  isNew?: boolean;
};

// A fetch result tagged with the id it was fetched for, same convention as
// BoardSettingsPage.
type FetchState = {
  id: string;
  user: UserDetail | null;
};

const UserFormPage = ({isNew = false}: UserFormPageProps) => {
  const {userId} = useParams<{userId: string}>();
  const navigate = useNavigate();
  const {createUser} = useCreateUserHook();
  const {getUser} = useGetUserHook();
  const {updateUser} = useUpdateUserHook();
  const {assignUserRoles} = useAssignUserRolesHook();
  const [fetched, setFetched] = useState<FetchState | null>(null);
  const [draft, setDraft] = useState<UserDraft | null>(null);
  const [draftForId, setDraftForId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string>(STEPS[0].id);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const pageTitle = isNew ? 'New user' : (draft ? `${draft.firstName} ${draft.lastName}`.trim() || 'Edit user' : 'Edit user');

  useSetModuleTitle(pageTitle);
  // Not in the PrismMenu tree (reached via UserBadge's dropdown, not the
  // sidebar) - useBreadcrumb's default has nothing to walk for this route.
  useSetBreadcrumb([{label: 'Users', link: '/users'}, {label: pageTitle, link: null}]);

  useEffect(() => {
    if (isNew || !userId) {
      return;
    }

    let cancelled = false;

    getUser(userId).then((result) => {
      if (!cancelled) {
        setFetched({id: userId, user: result.success ? result.user : null});
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getUser is a thin useRequestHook wrapper recreated every render
  }, [isNew, userId]);

  // Derived-during-render reset (not an effect) - same pattern as
  // BoardSettingsPage: isNew starts a fresh local draft, an existing user's
  // draft is replaced wholesale when the fetched user is actually a
  // different one, local edits otherwise survive re-renders.
  if (isNew && draftForId !== 'new') {
    setDraftForId('new');
    setDraft(createDraftUser());
  }

  if (!isNew && fetched?.user && fetched.id !== draftForId) {
    setDraftForId(fetched.id);
    setDraft(draftFromUser(fetched.user));
  }

  const handleSubmit = useCallback(async () => {
    if (!draft) {
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      if (isNew) {
        const result = await createUser({
          email: draft.email,
          password: draft.password,
          firstName: draft.firstName,
          lastName: draft.lastName,
          roleIds: draft.roleIds,
        });

        if (result.success) {
          navigate('/users', {replace: true});
          return;
        }

        const nextFieldErrors: Record<string, string> = {};

        result.errors.forEach((error) => {
          const field = error.resource.code.split('.').slice(1).join('.');

          if (FORM_FIELD_NAMES.has(field)) {
            nextFieldErrors[field] = error.resource.message;
            return;
          }

          eventBus.dispatch(new UserCreationFailedEvent(error.resource.message));
        });

        setFieldErrors(nextFieldErrors);
        return;
      }

      if (!userId) {
        return;
      }

      const [updateResult, rolesResult] = await Promise.all([
        updateUser(userId, {email: draft.email, firstName: draft.firstName, lastName: draft.lastName}),
        assignUserRoles(userId, draft.roleIds),
      ]);

      if (updateResult.success && rolesResult.success) {
        navigate('/users', {replace: true});
      }
    } catch (error) {
      console.error('Failed to save user', error);
      eventBus.dispatch(new UserCreationFailedEvent("Couldn't save the user — please try again."));
    } finally {
      setSaving(false);
    }
  }, [draft, isNew, userId, createUser, updateUser, assignUserRoles, navigate]);

  if (!isNew && fetched?.id === userId && !fetched?.user) {
    return <p className="p-8 text-sm text-muted-foreground">User not found.</p>;
  }

  if (!draft) {
    return <p className="p-8 text-sm text-muted-foreground">Loading user…</p>;
  }

  const canSubmit = isNew
    ? draft.email.trim() && draft.password.trim() && draft.firstName.trim() && draft.lastName.trim()
    : draft.email.trim() && draft.firstName.trim() && draft.lastName.trim();

  return (
    <PageContainer>
      <p className="text-sm font-semibold text-foreground">
        {isNew ? 'New user' : `${draft.firstName} ${draft.lastName}`.trim() || 'Edit user'}
      </p>

      <Stepper steps={STEPS} activeId={activeStep} onSelect={setActiveStep} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeStep === 'basics' && (
          <div className="flex max-w-md flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">First name</label>
                <Input
                  value={draft.firstName}
                  onChange={(e) => setDraft({...draft, firstName: e.target.value})}
                  aria-invalid={Boolean(fieldErrors.firstName)}
                  placeholder="e.g. Ada"
                />
                {fieldErrors.firstName && <p className="text-xs text-red-400">{fieldErrors.firstName}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Last name</label>
                <Input
                  value={draft.lastName}
                  onChange={(e) => setDraft({...draft, lastName: e.target.value})}
                  aria-invalid={Boolean(fieldErrors.lastName)}
                  placeholder="e.g. Lovelace"
                />
                {fieldErrors.lastName && <p className="text-xs text-red-400">{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({...draft, email: e.target.value})}
                aria-invalid={Boolean(fieldErrors.email)}
                placeholder="e.g. ada@example.com"
              />
              {fieldErrors.email && <p className="text-xs text-red-400">{fieldErrors.email}</p>}
            </div>

            {isNew && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  value={draft.password}
                  onChange={(e) => setDraft({...draft, password: e.target.value})}
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                {fieldErrors.password && <p className="text-xs text-red-400">{fieldErrors.password}</p>}
              </div>
            )}
          </div>
        )}

        {activeStep === 'roles' && <UserRolePicker roleIds={draft.roleIds} onChange={(roleIds) => setDraft({...draft, roleIds})} />}
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button leftIcon={<Check className="h-4 w-4" />} onClick={handleSubmit} loading={saving} disabled={!canSubmit}>
          Submit
        </Button>
      </div>
    </PageContainer>
  );
};

export default UserFormPage;
