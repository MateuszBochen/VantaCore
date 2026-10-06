import {forwardRef, useCallback, useImperativeHandle, useRef} from 'react';
import {Field, Formik} from 'formik';
import type {FieldProps, FormikProps} from 'formik';
import ValidationSchema from '../../Formik/ValidationSchema.ts';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {cn} from '@/lib/utils';
import {AI_AGENT_OPTIONS} from '../../Pages/Panel/Settings/aiAgentOptions';
import type {AiAgentFormData, AiAgentFormProps, AiAgentFormRef} from './types';

const yup = ValidationSchema.getBuilder();

const schema = yup.object({
  agentId: yup.string().required('Agent is required'),
  endpoint: yup.string().url('Must be a valid URL').required('API endpoint is required'),
  connectionString: yup.string().required('Connection string is required'),
});

type FieldRowProps = {
  name: keyof AiAgentFormData;
  label: string;
  description?: string;
  disabled?: boolean;
  placeholder?: string;
  monospace?: boolean;
};

const FieldRow = ({name, label, description, disabled, placeholder, monospace}: FieldRowProps) => (
  <Field name={name}>
    {({field, form}: FieldProps) => {
      const error = form.touched[name] ? (form.errors[name] as string | undefined) : undefined;

      return (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={name} className="text-sm font-medium text-zinc-200">
            {label}
          </label>
          <Input
            {...field}
            id={name}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              'h-10',
              monospace && 'font-mono',
              error && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30',
            )}
          />
          {description && <p className="text-xs text-zinc-500">{description}</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      );
    }}
  </Field>
);

// A select, not a text Input, so it gets its own row instead of reusing FieldRow -
// the value itself only ever drives which placeholder/description the other
// rows show (see AI_AGENT_OPTIONS), never which fields are rendered.
const AgentSelectRow = ({disabled}: {disabled?: boolean}) => (
  <Field name="agentId">
    {({field, form}: FieldProps) => {
      const error = form.touched.agentId ? (form.errors.agentId as string | undefined) : undefined;

      return (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="agentId" className="text-sm font-medium text-zinc-200">
            Agent
          </label>
          <Select
            id="agentId"
            value={field.value}
            onValueChange={(value) => form.setFieldValue('agentId', value)}
            disabled={disabled}
            className="h-10"
            options={AI_AGENT_OPTIONS.map((agent) => ({value: agent.id, label: agent.label}))}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      );
    }}
  </Field>
);

const AiAgentForm = forwardRef<AiAgentFormRef, AiAgentFormProps>((props, ref) => {
  const formikRef = useRef<FormikProps<AiAgentFormData>>(null);

  const handleOnFormSubmit = useCallback(
    (data: AiAgentFormData) => {
      props.onSubmit(data);
    },
    [props],
  );

  useImperativeHandle(ref, () => ({
    submit() {
      formikRef?.current?.submitForm();
    },
    setFieldErrors(errors) {
      errors.forEach(({field, message}) => {
        formikRef?.current?.setFieldTouched(field, true, false);
        formikRef?.current?.setFieldError(field, message);
      });
    },
  }));

  return (
    <Formik<AiAgentFormData>
      innerRef={formikRef}
      validationSchema={schema}
      onSubmit={handleOnFormSubmit}
      enableReinitialize
      initialValues={props.initialValues}
    >
      {({values}) => {
        const activeAgent = AI_AGENT_OPTIONS.find((agent) => agent.id === values.agentId) ?? AI_AGENT_OPTIONS[0];

        return (
          <div className="flex flex-col gap-6">
            <AgentSelectRow disabled={props.lockForm} />

            <FieldRow
              name="endpoint"
              label="API endpoint"
              placeholder={activeAgent.endpointPlaceholder}
              disabled={props.lockForm}
            />

            <FieldRow
              name="connectionString"
              label="Connection string"
              placeholder={activeAgent.connectionStringPlaceholder}
              description={`Everything this agent needs beyond the endpoint - key, model, and any provider-specific extras - as a single DSN-style string, e.g. "${activeAgent.connectionStringPlaceholder}".`}
              disabled={props.lockForm}
              monospace
            />
          </div>
        );
      }}
    </Formik>
  );
});

export default AiAgentForm;