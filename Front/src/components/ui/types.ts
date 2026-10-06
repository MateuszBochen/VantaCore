import * as React from 'react';
import {Button as ButtonPrimitive} from '@base-ui/react/button';
import type {VariantProps} from 'class-variance-authority';
import {buttonVariants} from './buttonVariants';

export interface TypeLinkProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export interface ActionLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}


export interface TextInputProps {
  disabled?: boolean;
  initialValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  type?: string;
  name?: string;
  errors?: string[];
  isInvalid?: boolean;
}

export interface ButtonProps
  extends React.ComponentProps<typeof ButtonPrimitive>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}