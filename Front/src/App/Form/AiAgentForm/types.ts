export interface AiAgentFormData {
  agentId: string;
  endpoint: string;
  connectionString: string;
}

export interface AiAgentFormRef {
  submit: () => void;
  setFieldErrors: (errors: {field: string; message: string}[]) => void;
}

export interface AiAgentFormProps {
  lockForm: boolean;
  initialValues: AiAgentFormData;
  onSubmit: (data: AiAgentFormData) => void;
}