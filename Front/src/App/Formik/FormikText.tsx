import * as React from 'react';
import { Field, type FieldProps } from 'formik';
import TextInput from '../../components/ui/TextInput.tsx';
import type {TextInputProps} from '../../components/ui/types.ts';

const FormikText: React.FC<TextInputProps> = (props: TextInputProps) => {

  return (
    <Field
      name={props.name}
      render={(inputProps: FieldProps) => {
        const {field, form} = inputProps;
        // form.errors[name] is a union (nested errors, arrays, ...) - only a
        // plain string is a message this flat input can render.
        const rawError = form.errors[field.name];
        const errorText = typeof rawError === 'string' ? rawError : undefined;
        const isInvalid = Boolean(form.touched[field.name]) && errorText !== undefined;
        const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          field.onChange(e);
          if (props?.onChange) {
            props?.onChange(e);
          }
        }

        return (
          <TextInput
            {...field}
            disabled={props.disabled}
            initialValue={field.value}
            label={props.label}
            type={props.type}
            onChange={handleOnChange}
            name={props.name}
            isInvalid={isInvalid}
            errors={isInvalid && errorText ? [errorText] : []}
          />
        );
      }}
    />
  );

}

export default FormikText;