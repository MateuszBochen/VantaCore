import {useCallback, useRef, useState} from 'react';
import {Check} from 'lucide-react';
import {PageContainer} from '@/components/ui/page-container';
import Stepper, {type StepperStep} from '@/components/ui/Stepper';
import {Button} from '@/components/ui/button';
import {toastService} from '@/lib/Toast/ToastService';
import {useSetBreadcrumb} from '../Breadcrumb';
import useSaveSettingsHook from '@/lib/ApplicationSettings/useSaveSettingsHook';
import AiAgentForm from '../../../Form/AiAgentForm/AiAgentForm';
import type {AiAgentFormData, AiAgentFormRef} from '../../../Form/AiAgentForm/types';
import {AI_AGENT_OPTIONS} from './aiAgentOptions';
import SsoSettingsTab, {type SsoSettingsTabHandle} from './SsoSettingsTab';

const STEPS: StepperStep[] = [
  {id: 'ai-agent', label: 'AI Agent'},
  {id: 'sso', label: 'SSO'},
];

const DEFAULT_SETTINGS: AiAgentFormData = {
  agentId: AI_AGENT_OPTIONS[0].id,
  endpoint: '',
  connectionString: '',
};

const ApplicationSettingsPage = () => {
  const aiAgentFormRef = useRef<AiAgentFormRef>(null);
  const [activeStep, setActiveStep] = useState(STEPS[0].id);
  const ssoTabRef = useRef<SsoSettingsTabHandle>(null);
  const [ssoSaving, setSsoSaving] = useState(false);
  const {saveSettings} = useSaveSettingsHook();

  // Not in the PrismMenu tree (reached via UserBadge's dropdown, not the
  // sidebar) - useBreadcrumb's default has nothing to walk for this route.
  // No useSetModuleTitle call here - the header title already falls back to
  // ModuleTitle/rules.ts's static "Application settings" rule for this path.
  useSetBreadcrumb([{label: 'Application settings', link: null}]);

  const handleAiAgentSubmit = useCallback(
    (data: AiAgentFormData) => {
      saveSettings({
        aiAgent: {
          agent: data.agentId,
          apiEndpoint: data.endpoint,
          connectionString: data.connectionString,
        },
      }).then((result) => {
        if (!result.success) {
          toastService.push('error', "Couldn't save changes — please try again.");
          return;
        }

        toastService.push('success', 'AI agent settings saved.');
      });
    },
    [saveSettings],
  );

  // One Save for the whole page, like before - it submits whichever tab is
  // open (for SSO: the provider in its active sub-tab).
  const handleSubmit = useCallback(() => {
    if (activeStep === 'sso') {
      ssoTabRef.current?.submit();
      return;
    }

    aiAgentFormRef.current?.submit();
  }, [activeStep]);

  return (
    <PageContainer>
      <Stepper steps={STEPS} activeId={activeStep} onSelect={setActiveStep} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeStep === 'sso' ? (
          <SsoSettingsTab ref={ssoTabRef} onSavingChange={setSsoSaving} />
        ) : (
          <div className="max-w-md">
            <AiAgentForm ref={aiAgentFormRef} initialValues={DEFAULT_SETTINGS} onSubmit={handleAiAgentSubmit} lockForm={false} />
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button leftIcon={<Check className="h-4 w-4" />} onClick={handleSubmit} loading={activeStep === 'sso' && ssoSaving}>
          Save
        </Button>
      </div>
    </PageContainer>
  );
};

export default ApplicationSettingsPage;