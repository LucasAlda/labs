/* eslint-disable @typescript-eslint/no-explicit-any */
import { type SetStateAction, useCallback, useState, useMemo, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { createContext, useContextSelector } from "use-context-selector";
import { z } from "zod";

/***   Utility Types   ***/
// eslint-disable-next-line @typescript-eslint/ban-types
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

/***   Context   ***/
export function createFormLikeContext<T extends FormLikeAny>() {
  const context = createContext<FormLike<T>>(null as never);
  function useFormLikeContext<Selected>(selector: (value: FormLike<T>) => Selected): Selected {
    return useContextSelector(context, selector);
  }
  return [context.Provider, useFormLikeContext] as const;
}

/***    Fieldlike     ***/
export type FieldLike<T> = ReturnType<typeof useFieldLike<T>>;
export type FieldLikeAny = FieldLike<any>;

export function useFieldLike<T>(_defaultValue: T) {
  const [defaultValue, setDefaultValue] = useState(_defaultValue);
  const [value, _setValue] = useState(defaultValue);
  const [_error, _setError] = useState<{ message: string; level: "warn" | "error" }>();
  const [_formError, setFormError] = useState<string>();
  const validateRef = useRef<() => void>();
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
      __type__: "fieldlike" as const,
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
export type FormLikeAny = Record<string, FieldLikeAny | Record<string, FieldLikeAny | Record<string, FieldLikeAny>>>;

export type FormLikeValue<TForm extends object> = TForm extends FormLikeAny
  ? {
      [K in keyof TForm]: FormLikeValue<TForm[K]>;
    }
  : TForm extends FieldLikeAny
  ? ReturnType<TForm["get"]>
  : never;

export type FormLikeError<TForm extends object> = TForm extends FormLikeAny
  ? {
      [K in keyof TForm]: FormLikeError<TForm[K]>;
    }
  : TForm extends FieldLikeAny
  ? ReturnType<TForm["error"]>
  : never;

export type FormLike<TForm extends FormLikeAny> = ReturnType<typeof useFormLike<TForm, z.ZodType>>;

export function useFormLike<TForm extends FormLikeAny, TSchema extends z.ZodType>(options: {
  form: TForm;
  schema: TSchema;
  onValid?: (value: z.infer<TSchema>) => void;
  onError?: (errors: Record<string, string>) => void;
}) {
  const [formStatus, setFormStatus] = useState<"errored" | "valid" | "idle">("idle");

  const get = useCallback(() => {
    return fieldsMap(options.form, (field) => field.get()) as FormLikeValue<TForm>;
  }, [options.form]);

  const errors = useCallback(() => {
    return fieldsMap(options.form, (field) => field.error()) as FormLikeError<TForm>;
  }, [options.form]);

  const unmountedErrors = useCallback(() => {
    return fieldsMap(options.form, (field) => (field?.isMounted ? undefined : field?.error())) as FormLikeError<TForm>;
  }, [options.form]);

  const flatErrors = useCallback(() => {
    const errors = {} as Record<string, { level: "warn" | "error"; message: string }>;
    fieldsForEach(options.form, (field, path) => {
      const error = field.error();
      if (error) errors[path.join(".")] = error;
    });
    return errors;
  }, [options.form]);

  const flatUnmountedErrors = useCallback(() => {
    const errors = {} as Record<string, { level: "warn" | "error"; message: string }>;
    fieldsForEach(options.form, (field, path) => {
      const error = field.error();
      if (!field.isMounted && error) errors[path.join(".")] = error;
    });
    return errors;
  }, [options.form]);

  const setFormErrors = useCallback(
    (errors: Record<string, string>) => {
      // ordenados primero los errores mas especificos sobre los contenidos en el
      const errorsEntries = Object.entries(errors);
      errorsEntries.sort(([a], [b]) => (a.includes(b) ? -1 : b.includes(a) ? 1 : a.localeCompare(b)));

      fieldsForEach(options.form, (field, path) => {
        const fieldErrorIndex = errorsEntries.findIndex(([errorKey]) => errorKey.includes(path.join(".")));
        field.setError(fieldErrorIndex === -1 ? undefined : errorsEntries[fieldErrorIndex]?.[1]);
        if (fieldErrorIndex >= 0) errorsEntries.splice(fieldErrorIndex, 1);
      });
    },
    [options.form]
  );

  const updateFormStatus = useCallback(
    (status: "errored" | "valid" | "idle") => {
      fieldsForEach(options.form, (field) => field.setFormStatus(status));
      setFormStatus(status);
    },
    [options.form]
  );

  const reset = useCallback(() => {
    updateFormStatus("idle");
    fieldsForEach(options.form, (field) => field.reset());
  }, [options.form, updateFormStatus]);

  const validate = useCallback(
    (props?: { valid?: (value: z.infer<TSchema>) => void; invalid?: (errors: Record<string, string>) => void }) => {
      try {
        const schema = options.schema;
        if (!schema) return false;
        const value = get();
        schema.parse(value);
        setFormErrors({} as never);
        const areFieldErrors = Object.values(flatErrors()).filter(Boolean).length > 0;
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
    [flatErrors, get, options.schema, setFormErrors, updateFormStatus]
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

  fieldsForEach(options.form, (field) => {
    field.validateRef.current = validate;
  });

  return useMemo(() => {
    return {
      form: options.form,
      errors,
      unmountedErrors,
      flatErrors,
      flatUnmountedErrors,
      get,
      reset,
      validate,
      submit,
      formStatus,
    };
  }, [
    options.form,
    errors,
    unmountedErrors,
    flatErrors,
    flatUnmountedErrors,
    get,
    reset,
    validate,
    submit,
    formStatus,
  ]);
}

/***    Formlike Helpers   ***/

type Enougth<TForm, Schema> = Schema extends Record<string, unknown> // schema is object?
  ? {
      [K in keyof Schema]: K extends keyof TForm // value for a schema key exists?
        ? Enougth<TForm[K], Schema[K]>
        : false;
    }[keyof Schema] extends true // all values are correct?
    ? true
    : false
  : TForm extends FieldLikeAny // schema is leaf?
  ? Schema extends ReturnType<TForm["get"]> //  value is correct?
    ? true
    : false
  : false;

export function enougth<TSchema extends z.ZodType, TForm extends FormLikeAny>(
  schema: TSchema,
  form: TForm
): Enougth<TForm, z.infer<TSchema>> extends true ? TForm : "Not Enougth to cover schema" {
  return form as never;
}

/***    Formlike Recursion   ***/

function isFieldLike(value: unknown): value is FieldLikeAny {
  return typeof value === "object" && value !== null && "__type__" in value && value.__type__ === "fieldlike";
}

function fieldsForEach(
  form: any, //Recursive<FieldLikeAny>,
  cb: (field: FieldLikeAny, path: string[]) => void,
  path: string[] = []
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  Object.entries(form).forEach(([key, value]) => {
    if (isFieldLike(value)) {
      cb(value, [...path, key]);
    } else {
      fieldsForEach(value, cb, [...path, key]);
    }
  });
}

function fieldsMap(
  form: any, // Recursive<FieldLikeAny>,
  cb: (field: FieldLikeAny, path: string[]) => unknown,
  path: string[] = []
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return Object.entries(form).reduce((acc, [key, value]) => {
    if (isFieldLike(value)) {
      acc[key] = cb(value, [...path, key]);
    } else {
      acc[key] = fieldsMap(value, cb, [...path, key]);
    }
    return acc;
  }, {} as Record<string, unknown>);
}
