import { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Formik } from 'formik';
import type {FormikProps} from 'formik';
import FormikText from '../../Formik/FormikText.tsx';
import ValidationSchema from '../../Formik/ValidationSchema.ts';


const yup = ValidationSchema.getBuilder();

const schema = yup.object({
  firstName: yup.string()
    .required('First name is required'),

  lastName: yup.string()
    .required('Last name is required'),

  email: yup.string()
    .email('Invalid email')
    .required('Email is required'),

  password: yup.string()
    .min(6, 'Minimum 6 characters')
    .required('Password is required'),

  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
});

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterFormRef {
  submit: () => void;
  setFieldErrors: (errors: {field: string; message: string}[]) => void;
}

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  lockForm?: boolean;
}

const RegisterForm = forwardRef<RegisterFormRef, RegisterFormProps>((props, ref) => {
  const formikRef = useRef<FormikProps<RegisterFormData>>(null);

  const handleOnFormSubmit = useCallback((data: RegisterFormData) => {
    console.log('REGISTER SUBMIT');
    console.log(data);
    props.onSubmit(data);
  }, [props]);

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
    <Formik<RegisterFormData>
      innerRef={formikRef}
      validationSchema={schema}
      onSubmit={handleOnFormSubmit}
      initialValues={{
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
      }}
    >
      {() => (
        <>
          <FormikText
            label="user.firstName"
            name="firstName"
            disabled={props.lockForm}
          />

          <FormikText
            label="user.lastName"
            name="lastName"
            disabled={props.lockForm}
          />

          <FormikText
            label="user.email"
            name="email"
            disabled={props.lockForm}
          />

          <FormikText
            label="user.password"
            name="password"
            type="password"
            disabled={props.lockForm}
          />

          <FormikText
            label="user.confirmPassword"
            name="confirmPassword"
            type="password"
            disabled={props.lockForm}
          />
        </>
      )}
    </Formik>
  );
});

export default RegisterForm;