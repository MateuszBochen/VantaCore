import {useMemo, useState} from 'react';
import Stepper from '@/components/ui/Stepper';
import type {StepperStep} from '@/components/ui/Stepper';
import useCreateImportJobHook from '@/lib/ImportExport/useCreateImportJobHook';
import type {ImportFieldMapping, ImportPreview, ImportProvider, ImportValueMapping} from '@/lib/ImportExport/Type/types';
import type {Project} from '@/lib/Project/Type/types';
import SourceStep from './SourceStep';
import MapFieldsStep from './MapFieldsStep';
import PreviewStep from './PreviewStep';
import ResultStep from './ResultStep';

const STEPS: StepperStep[] = [
  {id: 'source', label: 'Source'},
  {id: 'map', label: 'Map fields'},
  {id: 'preview', label: 'Preview'},
  {id: 'result', label: 'Result'},
];

type WizardStepId = 'source' | 'map' | 'preview' | 'result';

const STEP_ORDER: WizardStepId[] = ['source', 'map', 'preview', 'result'];

type ImportWizardProps = {
  project: Project;
};

// Unlike ProjectSettings/AutomationRuleEditorPage's Stepper (every step is
// independently valid, you can jump straight to any of them), this wizard's
// steps are strictly sequential - MapFieldsStep can't render without a
// preview, PreviewStep can't render without a mapping. `furthestStep` gates
// which pills are clickable so the Stepper still doubles as a progress
// indicator without letting the user jump ahead of the data they've
// actually produced yet.
const ImportWizard = ({project}: ImportWizardProps) => {
  const {createImportJob} = useCreateImportJobHook();

  const [activeStep, setActiveStep] = useState<WizardStepId>('source');
  const [furthestStep, setFurthestStep] = useState<WizardStepId>('source');
  const [provider, setProvider] = useState<ImportProvider | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<ImportFieldMapping[]>([]);
  const [valueMappings, setValueMappings] = useState<ImportValueMapping[]>([]);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const goTo = (step: WizardStepId) => {
    setActiveStep(step);
    if (STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(furthestStep)) {
      setFurthestStep(step);
    }
  };

  const handleSourceReady = (nextPreview: ImportPreview, nextConnectionId: string | null) => {
    setPreview(nextPreview);
    setConnectionId(nextConnectionId);
    // Jira and Azure DevOps both call it "Priority" - pre-select it, the
    // user can still unmap it in MapFieldsStep.
    const prioritySourceField = nextPreview.fields.find((field) => field.toLowerCase() === 'priority');
    setMapping(prioritySourceField ? [{sourceField: prioritySourceField, targetField: 'priority'}] : []);
    setValueMappings([]);
    goTo('map');
  };

  const handleStartImport = () => {
    if (!provider) {
      return;
    }

    setStarting(true);

    const result =
      provider === 'CSV' && file
        ? createImportJob(project.id, {provider: 'CSV', file, mapping, valueMappings})
        : provider !== 'CSV' && connectionId
          ? createImportJob(project.id, {provider, connectionId, mapping, valueMappings})
          : null;

    if (!result) {
      setStarting(false);
      return;
    }

    result.then((outcome) => {
      setStarting(false);
      if (outcome.success) {
        setImportJobId(outcome.importJobId);
        goTo('result');
      }
    });
  };

  const handleStartOver = () => {
    setProvider(null);
    setFile(null);
    setConnectionId(null);
    setPreview(null);
    setMapping([]);
    setValueMappings([]);
    setImportJobId(null);
    setActiveStep('source');
    setFurthestStep('source');
  };

  const clickableSteps = useMemo(
    () => STEPS.filter((step) => STEP_ORDER.indexOf(step.id as WizardStepId) <= STEP_ORDER.indexOf(furthestStep)),
    [furthestStep],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Stepper steps={clickableSteps} activeId={activeStep} onSelect={(id) => goTo(id as WizardStepId)} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeStep === 'source' && (
          <SourceStep provider={provider} onProviderChange={setProvider} file={file} onFileChange={setFile} onReady={handleSourceReady} />
        )}

        {activeStep === 'map' && preview && (
          <MapFieldsStep
            project={project}
            preview={preview}
            mapping={mapping}
            onChange={setMapping}
            onBack={() => goTo('source')}
            onContinue={() => goTo('preview')}
          />
        )}

        {activeStep === 'preview' && preview && provider && (
          <PreviewStep
            project={project}
            provider={provider}
            preview={preview}
            mapping={mapping}
            valueMappings={valueMappings}
            onValueMappingsChange={setValueMappings}
            onBack={() => goTo('map')}
            onStartImport={handleStartImport}
            starting={starting}
          />
        )}

        {activeStep === 'result' && importJobId && <ResultStep projectId={project.id} importJobId={importJobId} onStartOver={handleStartOver} />}
      </div>
    </div>
  );
};

export default ImportWizard;
