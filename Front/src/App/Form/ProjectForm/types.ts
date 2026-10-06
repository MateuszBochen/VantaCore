export interface BasicsFormData {
  name: string;
  prefix: string;
  startingNumber: string;
  estimateUnit: string;
}

export interface BasicsFormRef {
  submit: () => void;
  setFieldErrors: (errors: {field: string; message: string}[]) => void;
}

export interface BasicsFormProps {
  lockForm: boolean;
  initialValues: BasicsFormData;
  onSubmit: (data: BasicsFormData) => void;
  onValuesChange?: (values: BasicsFormData) => void;
}
