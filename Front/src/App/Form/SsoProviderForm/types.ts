import type {SsoProvider} from '@/lib/Sso/Type/types';

export interface SsoProviderFormData {
  enabled: boolean;
  clientId: string;
  // Empty = keep the stored secret (the Api never sends it back).
  clientSecret: string;
  tenantId: string;
  issuerUrl: string;
  displayName: string;
}

export interface SsoProviderFormRef {
  submit: () => void;
  setFieldErrors: (errors: {field: string; message: string}[]) => void;
}

export interface SsoProviderFormProps {
  provider: SsoProvider;
  // Whether a secret is already stored - then an empty secret field means
  // "keep it" and isn't required.
  clientSecretSet: boolean;
  lockForm: boolean;
  initialValues: SsoProviderFormData;
  onSubmit: (data: SsoProviderFormData) => void;
}
