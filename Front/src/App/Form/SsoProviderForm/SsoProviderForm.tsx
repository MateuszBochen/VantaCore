import {forwardRef, useCallback, useImperativeHandle, useMemo, useRef} from 'react';
import type {ReactNode} from 'react';
import {Field, Form, Formik} from 'formik';
import type {FieldProps, FormikProps} from 'formik';
import ValidationSchema from '../../Formik/ValidationSchema.ts';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {cn} from '@/lib/utils';
import type {SsoProvider} from '@/lib/Sso/Type/types';
import type {SsoProviderFormData, SsoProviderFormProps, SsoProviderFormRef} from './types';

const yup = ValidationSchema.getBuilder();

// Nothing is required while the provider is switched off - an admin can
// save a half-filled, disabled config and finish it later. Once enabled,
// the Api needs a client id, a secret (a new one, unless one is already
// stored), for Microsoft which directory to trust, and for a generic OIDC
// provider where it lives and what to call it.
const buildSchema = (provider: SsoProvider, clientSecretSet: boolean) =>
  yup.object({
    clientId: yup.string().trim().when('enabled', {
      is: true,
      then: (schema) => schema.required('Client ID is required'),
    }),
    clientSecret: yup.string().when('enabled', {
      is: true,
      then: (schema) => (clientSecretSet ? schema : schema.required('Client secret is required')),
    }),
    tenantId: yup.string().trim().when('enabled', {
      is: true,
      then: (schema) => (provider === 'MICROSOFT' ? schema.required('Tenant ID is required') : schema),
    }),
    issuerUrl: yup
      .string()
      .trim()
      // Same rule as the Api (UpsertSsoProviderPolicy): https only.
      .matches(/^https:\/\/[^\s/]+/i, {message: 'Must be an https:// URL, e.g. https://login.example.com', excludeEmptyString: true})
      .when('enabled', {
        is: true,
        then: (schema) => (provider === 'OIDC' ? schema.required('Issuer URL is required') : schema),
      }),
    displayName: yup.string().trim().when('enabled', {
      is: true,
      then: (schema) => (provider === 'OIDC' ? schema.required('Button label is required') : schema),
    }),
  });

const invalidClassName = 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30';

const errorOf = (name: keyof SsoProviderFormData, form: FieldProps['form']): string | undefined => {
  if (!form.touched[name]) {
    return undefined;
  }

  return form.errors[name] as string | undefined;
};

type RowProps = {
  label: string;
  htmlFor?: string;
  description?: ReactNode;
  error?: string;
  children: ReactNode;
};

const Row = ({label, htmlFor, description, error, children}: RowProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {label}
    </label>
    {children}
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

type TextFieldProps = {
  name: 'clientId' | 'clientSecret' | 'tenantId' | 'issuerUrl' | 'displayName';
  // Ids/secrets/URLs read better monospaced; a human label doesn't.
  monospace?: boolean;
  label: string;
  description?: ReactNode;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
};

const TextField = ({name, label, description, placeholder, type = 'text', disabled, monospace = true}: TextFieldProps) => (
  <Field name={name}>
    {({field, form}: FieldProps) => {
      const error = errorOf(name, form);

      return (
        <Row label={label} htmlFor={name} description={description} error={error}>
          <Input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={type === 'password' ? 'new-password' : 'off'}
            className={cn(monospace && 'font-mono', error && invalidClassName)}
          />
        </Row>
      );
    }}
  </Field>
);

type CheckboxFieldProps = {
  name: 'enabled';
  label: string;
  description: string;
  disabled?: boolean;
};

const CheckboxField = ({name, label, description, disabled}: CheckboxFieldProps) => (
  <Field name={name}>
    {({field, form}: FieldProps) => (
      <label className="flex cursor-pointer items-start gap-2.5">
        <Checkbox checked={Boolean(field.value)} onCheckedChange={(checked) => form.setFieldValue(name, checked)} disabled={disabled} className="mt-0.5" />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </span>
      </label>
    )}
  </Field>
);

// One sign-in provider's settings (Settings → SSO), same shape as
// AiAgentForm/ReleaseForm: Formik + Yup, the card submits through the ref.
const SsoProviderForm = forwardRef<SsoProviderFormRef, SsoProviderFormProps>((props, ref) => {
  const formikRef = useRef<FormikProps<SsoProviderFormData>>(null);
  const schema = useMemo(() => buildSchema(props.provider, props.clientSecretSet), [props.provider, props.clientSecretSet]);

  const handleOnFormSubmit = useCallback(
    (data: SsoProviderFormData) => {
      props.onSubmit({
        ...data,
        clientId: data.clientId.trim(),
        tenantId: data.tenantId.trim(),
        issuerUrl: data.issuerUrl.trim(),
        displayName: data.displayName.trim(),
      });
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

  const disabled = props.lockForm;

  return (
    <Formik<SsoProviderFormData>
      innerRef={formikRef}
      validationSchema={schema}
      onSubmit={handleOnFormSubmit}
      enableReinitialize
      initialValues={props.initialValues}
    >
      {() => (
        <Form className="flex flex-col gap-5">
          <CheckboxField
            name="enabled"
            label="Enabled"
            description="Show a sign-in button for this provider on the login page."
            disabled={disabled}
          />

          {props.provider === 'MICROSOFT' && (
            <TextField
              name="tenantId"
              label="Tenant ID"
              placeholder="00000000-0000-0000-0000-000000000000"
              description={
                <>
                  Your Entra ID directory (tenant) ID - only accounts from that directory can sign in. Use{' '}
                  <span className="font-mono">organizations</span> to accept any work or school account.
                </>
              }
              disabled={disabled}
            />
          )}

          {props.provider === 'OIDC' && (
            <>
              <TextField
                name="displayName"
                label="Button label"
                placeholder="e.g. Okta"
                description='Shown on the login page as "Sign in with …".'
                disabled={disabled}
                monospace={false}
              />
              <TextField
                name="issuerUrl"
                label="Issuer URL"
                placeholder="https://login.example.com"
                description="The provider's issuer - its /.well-known/openid-configuration is read from this address."
                disabled={disabled}
              />
            </>
          )}

          <TextField name="clientId" label="Client ID" description="The application (client) ID from the provider's app registration." disabled={disabled} />

          <TextField
            name="clientSecret"
            label="Client secret"
            type="password"
            placeholder={props.clientSecretSet ? '•••••••••••• (saved)' : undefined}
            description={props.clientSecretSet ? 'A secret is stored. Leave empty to keep it, or enter a new one to replace it.' : undefined}
            disabled={disabled}
          />


          {/* Enter in a text field submits - see LoginForm for why a hidden
              submit control is needed for that. */}
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
        </Form>
      )}
    </Formik>
  );
});

export default SsoProviderForm;
