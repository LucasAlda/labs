import { type SetStateAction, useCallback, useState, useMemo, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { createContext, useContextSelector } from "use-context-selector";
import { z } from "zod";

/***   Utility Types   ***/
// eslint-disable-next-line @typescript-eslint/ban-types
type Prettify<T> = T & {};

/***   Context   ***/
export function createFormLikeContext<T extends FormLikeAny>() {
  const context = createContext<FormLike<T>>(null as never);
  function useFormLikeContext<Selected>(selector: (value: FormLike<T>) => Selected): Selected {
    return useContextSelector(context, selector);
  }
  return [context.Provider, useFormLikeContext] as const;
}

/***    Fieldlike     ***/
export type FieldLike<T> = {
  get: () => T;
  set: (value: SetStateAction<T>, options?: { noValidation?: boolean; keepIsDirtyFalse?: boolean }) => void;
  reset: () => void;
  error: () => { message: string; level: "error" | "warn" } | undefined;
  rawErrors: {
    field: { message: string; level: "error" | "warn" } | undefined;
    form: { message: string; level: "error" } | undefined;
  };
  setError: (error: { message: string; level: "error" | "warn" } | string | undefined) => void;
  setFormError: (error: string | undefined) => void;
  clearError: () => void;
  errorSource: "field" | "form";
  formStatus: "errored" | "valid" | "idle";
  setFormStatus: (status: "errored" | "valid" | "idle") => void;
  isDirty: boolean;
  isMounted: boolean;
  mount: () => void;
  unmount: () => void;
  validateRef: React.MutableRefObject<((props: never) => void) | null>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldLikeAny = FieldLike<any>;

export function useFieldLike<T>(_defaultValue: T): FieldLike<T> {
  const [defaultValue, setDefaultValue] = useState(_defaultValue);
  const [value, _setValue] = useState(defaultValue);
  const [_error, _setError] = useState<{ message: string; level: "warn" | "error" }>();
  const [_formError, setFormError] = useState<string>();
  const validateRef = useRef<() => void>(null);
  const [formStatus, setFormStatus] = useState<"errored" | "valid" | "idle">("idle");
  const [isDirty, setDirty] = useState(false);
  const [isMounted, _setMounted] = useState(false);

  useEffect(() => {
    if (JSON.stringify(defaultValue) !== JSON.stringify(_defaultValue)) {
      setDefaultValue(_defaultValue);
      if (!isDirty) {
        _setValue(_defaultValue);
      }
    }
  }, [_defaultValue, defaultValue, isDirty]);

  const get = useCallback(() => value, [value]);
  const error = useCallback(
    () => (_formError ? { message: _formError, level: "error" as const } : _error),
    [_error, _formError]
  );

  const set = useCallback(
    (valueAction: SetStateAction<T>, options?: { noValidation?: boolean; keepIsDirtyFalse?: boolean }) => {
      if (options?.noValidation !== false && formStatus === "errored") {
        flushSync(() => {
          _setValue(valueAction);
        });
        validateRef.current?.();
      } else {
        _setValue(valueAction);
      }
      if (!options?.keepIsDirtyFalse) setDirty(true);
    },
    [formStatus]
  );

  const reset = useCallback(() => {
    _setValue(defaultValue);
    _setError(undefined);
    setFormError(undefined);
    setDirty(false);
  }, [defaultValue]);

  const setError = useCallback((error: { message: string; level: "error" | "warn" } | string | undefined) => {
    _setError(typeof error === "string" ? { message: error, level: "error" } : error);
  }, []);

  const clearError = useCallback(() => _setError(undefined), []);
  const mount = useCallback(() => _setMounted(true), []);
  const unmount = useCallback(() => _setMounted(false), []);

  const actions = useMemo(() => {
    return {
      get,
      set,
      reset,
      error,
      rawErrors: { field: _error, form: _formError ? { message: _formError, level: "error" as const } : undefined },
      errorSource: _formError ? ("form" as const) : ("field" as const),
      setError,
      formStatus,
      setFormStatus,
      setFormError,
      clearError,
      isDirty,
      isMounted,
      mount,
      unmount,
      validateRef,
    };
  }, [
    get,
    set,
    reset,
    error,
    _error,
    _formError,
    setError,
    formStatus,
    clearError,
    isDirty,
    isMounted,
    mount,
    unmount,
  ]);

  return actions;
}

/***    Formlike     ***/
export type FormLikeAny = Record<string, FieldLikeAny>;

export type FormLikeValue<TForm extends FormLikeAny> = Prettify<{
  [K in keyof TForm]: ReturnType<TForm[K]["get"]>;
}>;

export type FormLikeFieldError<TForm extends FormLikeAny> = Prettify<{
  [K in keyof TForm]: ReturnType<TForm[K]["error"]>;
}>;

// export type FormLike<TForm extends FormLikeAny> = {
//   form: TForm;
//   get: () => FormLikeValue<TForm>;
//   errors: () => { [K in keyof TForm]?: TForm[K]["error"] };
//   unmountedErrors: () => { [K in keyof TForm]?: TForm[K]["error"] };
//   reset: () => void;
//   validate: (props?: {
//     valid?: (value: FormLikeValue<TForm>) => void;
//     invalid?: (errors: Record<string, string>) => void;
//   }) => boolean;
//   submit: (cb?: (value: FormLikeValue<TForm>) => void) => boolean;
// };

export type FormLike<TForm extends FormLikeAny> = ReturnType<typeof useFormLike<TForm, z.ZodType>>;

export function useFormLike<TForm extends FormLikeAny, TSchema extends z.ZodType>(options: {
  form: TForm;
  schema: TSchema;
  onValid?: (value: z.infer<TSchema>) => void;
  onError?: (errors: Record<string, string>) => void;
}) {
  const [formStatus, setFormStatus] = useState<"errored" | "valid" | "idle">("idle");

  const get = useCallback(() => {
    return Object.keys(options.form).reduce((acc, key) => {
      acc[key] = options.form[key]?.get();
      return acc;
    }, {} as Record<string, unknown>) as FormLikeValue<TForm>;
  }, [options.form]);

  const errors = useCallback(() => {
    return Object.keys(options.form).reduce((acc, key) => {
      acc[key] = options.form[key]?.error();
      return acc;
    }, {} as Record<string, unknown>) as FormLikeFieldError<TForm>;
  }, [options.form]);

  const unmountedErrors = useCallback(() => {
    return Object.keys(options.form).reduce((acc, key) => {
      const field = options.form[key];
      acc[key] = field?.isMounted ? undefined : options.form[key]?.error();
      return acc;
    }, {} as Record<string, unknown>) as FormLikeFieldError<TForm>;
  }, [options.form]);

  const setFormErrors = useCallback(
    (errors: Record<string, string>) => {
      // ordenados primero los errores mas especificos sobre los contenidos en el
      const errorsEntries = Object.entries(errors);
      errorsEntries.sort(([a], [b]) => (a.includes(b) ? -1 : b.includes(a) ? 1 : a.localeCompare(b)));

      Object.entries(options.form).forEach(([key, field]) => {
        const fieldErrorIndex = errorsEntries.findIndex(([errorKey]) => errorKey.includes(key));
        field.setFormError(fieldErrorIndex === -1 ? undefined : errorsEntries[fieldErrorIndex]?.[1]);
        if (fieldErrorIndex >= 0) errorsEntries.splice(fieldErrorIndex, 1);
      });
    },
    [options.form]
  );

  const updateFormStatus = useCallback(
    (status: "errored" | "valid" | "idle") => {
      Object.values(options.form).forEach((field) => field.setFormStatus(status));
      setFormStatus(status);
    },
    [options.form]
  );

  const reset = useCallback(() => {
    updateFormStatus("idle");
    return Object.keys(options.form).reduce((acc, key) => {
      acc[key] = options.form[key]?.reset();
      return acc;
    }, {} as Record<string, unknown>) as FormLikeValue<TForm>;
  }, [options.form, updateFormStatus]);

  const validate = useCallback(
    (props?: { valid?: (value: z.infer<TSchema>) => void; invalid?: (errors: Record<string, string>) => void }) => {
      try {
        const schema = options.schema;
        if (!schema) return false;
        const value = get();
        schema.parse(value);
        setFormErrors({} as never);
        const areFieldErrors = Object.values(errors()).filter(Boolean).length > 0;
        if (areFieldErrors) throw new Error("Field errors");
        updateFormStatus("valid");
        props?.valid?.(value as z.infer<TSchema>);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorsObj = error.errors.reduce(
            (acc, error) => ({ ...acc, [error.path.join(".")]: error.message }),
            {}
          ) as Record<string, string>;
          setFormErrors(errorsObj);
          props?.invalid?.(errorsObj);
        }
        updateFormStatus("errored");
        return false;
      }
    },
    [errors, get, options.schema, setFormErrors, updateFormStatus]
  );

  const submit = useCallback(
    (cb?: (value: z.infer<TSchema>) => void) => {
      const valid = validate({
        valid: (res) => {
          cb?.(res);
          options.onValid?.(res);
        },
        invalid: (errors) => options.onError?.(errors),
      });
      return valid;
    },
    [options, validate]
  );

  Object.values(options.form).forEach((field) => {
    field.validateRef.current = validate;
  });

  return useMemo(() => {
    return {
      form: options.form,
      errors,
      unmountedErrors,
      get,
      reset,
      validate,
      submit,
      formStatus,
    };
  }, [options.form, errors, unmountedErrors, get, reset, validate, submit, formStatus]);
}
