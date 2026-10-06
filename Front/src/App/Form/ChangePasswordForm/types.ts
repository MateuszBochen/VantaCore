export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type ChangePasswordFieldError = {field: keyof ChangePasswordFormData; message: string};

export interface ChangePasswordFormProps {
  // Resolves with the field errors to show, or null when the change went
  // through (the form is then cleared).
  onSubmit: (data: ChangePasswordFormData) => Promise<ChangePasswordFieldError[] | null>;
}
