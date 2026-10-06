export type ToastVariant = 'success' | 'error';

export type Toast = {
  id: string;
  variant: ToastVariant;
  message: string;
};