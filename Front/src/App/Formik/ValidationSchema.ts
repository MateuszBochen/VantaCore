import * as yup from 'yup';

export default class ValidationSchema {
  private static yupInstance: typeof yup;

  public static getBuilder(): typeof yup {
    if (!ValidationSchema.yupInstance) {
      ValidationSchema.yupInstance = yup;
    }

    return ValidationSchema.yupInstance;
  }
}
