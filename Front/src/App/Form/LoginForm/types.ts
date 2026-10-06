
export interface LoginFormData {
  username: string;
  password: string;
}

export interface LoginFormRef {
  submit: () => void;
  setFieldErrors: (errors: {field: string; message: string}[]) => void;
}

export interface LoginFormProps {
  lockForm: boolean;
  onSubmit: (data: LoginFormData) => void;
}
