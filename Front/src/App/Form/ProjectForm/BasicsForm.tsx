import {forwardRef, useCallback, useEffect, useImperativeHandle, useRef} from 'react';
import {Field, Formik} from 'formik';
import type {FieldProps, FormikProps} from 'formik';
import ValidationSchema from '../../Formik/ValidationSchema.ts';
import {Input} from '@/components/ui/input';
import {cn} from '@/lib/utils';
import type {BasicsFormData, BasicsFormProps, BasicsFormRef} from './types.ts';

const yup = ValidationSchema.getBuilder();

const schema = yup.object({
  name: yup.string()
    .required('Project name is required'),

  prefix: yup.string()
    .matches(/^[A-Z][A-Z0-9]*$/, 'Uppercase letters and numbers only, starting with a letter')
    .max(6, 'Maximum 6 characters')
    .required('Prefix is required'),

  startingNumber: yup.number()
    .typeError('Must be a number')
    .integer('Must be a whole number')
    .min(1, 'Must be at least 1')
    .required('Starting number is required'),
});

type FieldRowProps = {
  name: keyof BasicsFormData;
  label: string;
  description: string;
  disabled?: boolean;
  type?: string;
  transform?: (value: string) => string;
};

const FieldRow = ({name, label, description, disabled, type = 'text', transform}: FieldRowProps) => (
  <Field name={name}>
    {({field, form}: FieldProps) => {
      const error = form.touched[name] ? (form.errors[name] as string | undefined) : undefined;

      return (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={name} className="text-sm font-medium text-zinc-200">
            {label}
          </label>
          <Input
            {...field}
            id={name}
            type={type}
            disabled={disabled}
            onChange={(e) => form.setFieldValue(name, transform ? transform(e.target.value) : e.target.value)}
            className={cn('h-10', error && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30')}
          />
          <p className="text-xs text-zinc-500">{description}</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      );
    }}
  </Field>
);

// Reports live Formik values up to the parent (e.g. so a page header can reflect
// the name as it's typed) without making the parent own the form state itself.
type ValuesWatcherProps = {
  values: BasicsFormData;
  onValuesChange?: (values: BasicsFormData) => void;
};

const ValuesWatcher = ({values, onValuesChange}: ValuesWatcherProps) => {
  useEffect(() => {
    onValuesChange?.(values);
  }, [values, onValuesChange]);

  return null;
};

const BasicsForm = forwardRef<BasicsFormRef, BasicsFormProps>((props, ref) => {
  const formikRef = useRef<FormikProps<BasicsFormData>>(null);

  const handleOnFormSubmit = useCallback((data: BasicsFormData) => {
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
    <Formik<BasicsFormData>
      innerRef={formikRef}
      validationSchema={schema}
      onSubmit={handleOnFormSubmit}
      initialValues={props.initialValues}
    >
      {({values}) => (
        <div className="flex flex-col gap-6">
          <ValuesWatcher values={values} onValuesChange={props.onValuesChange} />

          <div>
            <p className="text-sm font-semibold text-zinc-200">Project basics</p>
            <p className="text-xs text-zinc-500">These identify the project and how its tickets get numbered.</p>
          </div>

          <FieldRow
            name="name"
            label="Project name"
            description="Shown across the app, e.g. in the sidebar and on ticket views."
            disabled={props.lockForm}
          />

          <FieldRow
            name="prefix"
            label="Ticket prefix"
            description="Uppercase letters/numbers, starting with a letter — used at the start of every ticket ID."
            disabled={props.lockForm}
            transform={(value) => value.toUpperCase()}
          />

          <FieldRow
            name="startingNumber"
            label="Starting number"
            description="The number the very first ticket in this project will get."
            type="number"
            disabled={props.lockForm}
          />

          <FieldRow
            name="estimateUnit"
            label="Estimate unit"
            description="Shown next to the Estimate field on estimable ticket types, e.g. h or SP - just a label, nothing is converted."
            disabled={props.lockForm}
          />

          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
            First ticket will be{' '}
            <span className="font-mono text-cyan-300">
              {values.prefix || 'PREFIX'}-{values.startingNumber || '1000'}
            </span>
          </div>
        </div>
      )}
    </Formik>
  );
});

export default BasicsForm;
