import type {LoginFormData, LoginFormProps, LoginFormRef} from './types.ts';
import { useRef, useImperativeHandle, forwardRef } from 'react';
import type {FormikProps} from 'formik';
import {Form, Formik} from 'formik';
import ValidationSchema from '../../Formik/ValidationSchema.ts';
import {useCallback} from 'react';
import FormikText from '../../Formik/FormikText.tsx';

const yup = ValidationSchema.getBuilder();

const schema = yup.object({
  username: yup.string()
    .required('Login is required'),
  password: yup.string().required('Password is required'),
});


const LoginForm = forwardRef<LoginFormRef, LoginFormProps>(({onSubmit, lockForm}, ref) => {
  const formikRef = useRef<FormikProps<LoginFormData>>(null);

  const handleOnFormSubmit = useCallback((data: LoginFormData) => {
    onSubmit(data);
  }, [onSubmit]);

  useImperativeHandle(ref, () => {
    return {
      submit() {
        formikRef?.current?.submitForm()
      },
      setFieldErrors(errors) {
        errors.forEach(({field, message}) => {
          formikRef?.current?.setFieldTouched(field, true, false);
          formikRef?.current?.setFieldError(field, message);
        });
      },
    };
  }, [formikRef]);

  return (
    <Formik<LoginFormData>
      innerRef={formikRef}
      validationSchema={schema}
      onSubmit={handleOnFormSubmit}
      initialValues={{
        username: '',
        password: '',
      }}
    >
      {() => {
        return (
          // A real <form> (not just the fragment this used to be) so
          // pressing Enter in either field submits - the separate
          // Authenticate button lives outside this component (see
          // Login.tsx) and only triggers submission via the imperative
          // `submit()` ref method above, which native Enter-key handling
          // knows nothing about. The hidden submit button is required for
          // that: with two fields and no submit control inside the form
          // itself, browsers don't treat Enter as an implicit submit
          // otherwise (only a lone single-text-field form gets that for
          // free).
          // space-y-6 matches Login.tsx's wrapping div - a Fragment never
          // created a DOM node, so that div's own space-y-6 used to apply
          // directly between the two fields; the new <form> element is now
          // the div's one and only child instead, so the gap has to be
          // reproduced here or the fields render flush against each other.
          <Form className="space-y-6">
            <FormikText label="user.email" name={'username'} disabled={lockForm}/>
            <FormikText label="user.password" name={'password'} type="password" disabled={lockForm} />
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
          </Form>
        );
      }}
    </Formik>
  );
});

export default LoginForm;
