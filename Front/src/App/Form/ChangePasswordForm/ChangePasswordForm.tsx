import {useCallback} from 'react';
import {Form, Formik, type FormikHelpers} from 'formik';
import {Button} from '@/components/ui/button';
import FormikText from '../../Formik/FormikText.tsx';
import ValidationSchema from '../../Formik/ValidationSchema.ts';
import type {ChangePasswordFormData, ChangePasswordFormProps} from './types.ts';

const yup = ValidationSchema.getBuilder();

const MIN_PASSWORD_LENGTH = 8;

const schema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string()
    .min(MIN_PASSWORD_LENGTH, `Minimum ${MIN_PASSWORD_LENGTH} characters`)
    .notOneOf([yup.ref('currentPassword')], 'New password must differ from the current one')
    .required('New password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm your new password'),
});

const INITIAL_VALUES: ChangePasswordFormData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

// Self-submitting (unlike LoginForm's external-button ref API) - it's the
// only thing on its Profile tab, so the Save button lives right here.
const ChangePasswordForm = ({onSubmit}: ChangePasswordFormProps) => {
  const handleOnFormSubmit = useCallback(
    async (data: ChangePasswordFormData, helpers: FormikHelpers<ChangePasswordFormData>) => {
      const fieldErrors = await onSubmit(data);

      if (fieldErrors === null) {
        helpers.resetForm();
        return;
      }

      fieldErrors.forEach(({field, message}) => {
        helpers.setFieldTouched(field, true, false);
        helpers.setFieldError(field, message);
      });
    },
    [onSubmit],
  );

  return (
    <Formik<ChangePasswordFormData> validationSchema={schema} onSubmit={handleOnFormSubmit} initialValues={INITIAL_VALUES}>
      {({isSubmitting}) => (
        <Form className="flex flex-col gap-4">
          <FormikText label="Current password" name="currentPassword" type="password" disabled={isSubmitting} />
          <FormikText label="New password" name="newPassword" type="password" disabled={isSubmitting} />
          <FormikText label="Confirm new password" name="confirmPassword" type="password" disabled={isSubmitting} />

          <div>
            <Button type="submit" loading={isSubmitting}>
              Change password
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ChangePasswordForm;
