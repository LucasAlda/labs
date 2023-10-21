import { type SetStateAction, useCallback, useState, useMemo, useEffect } from "react";
import { z } from "zod";

/***   Utility Types   ***/
// eslint-disable-next-line @typescript-eslint/ban-types
type Prettify<T> = T & {};

type NesteableRecord<T> = {
  [x: string]: T | NesteableRecord<T>;
};

/***    Fieldlike     ***/
export type FieldLike<T> = {
  __type: "fieldlike";
  get: () => T;
  set: (value: T) => void;
  reset: () => void;
  setError: (error: string | undefined) => void;
  clearError: () => void;
  error: () => string | undefined;
  dirty: boolean;
  mounted: boolean;
  suscribe: () => void;
  unsucribe: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldLikeAny = FieldLike<any>;

export function useFieldLike<FormLike>(_defaultValue: FormLike) {
  const [defaultValue, setDefaultValue] = useState(_defaultValue);
  const [value, _setValue] = useState(defaultValue);
  const [_error, setError] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const [mounted, _setMounted] = useState(false);

  useEffect(() => {
    if (JSON.stringify(defaultValue) !== JSON.stringify(_defaultValue)) {
      setDefaultValue(_defaultValue);
      if (!dirty) {
        _setValue(_defaultValue);
      }
    }
  }, [_defaultValue, defaultValue, dirty]);

  const get = useCallback(() => value, [value]);

  const set = useCallback((value: SetStateAction<FormLike>) => {
    _setValue(value);
    setDirty(true);
  }, []);

  const reset = useCallback(() => {
    _setValue(defaultValue);
    setDirty(false);
    setError(undefined);
  }, [defaultValue]);

  const clearError = useCallback(() => setError(undefined), []);
  const error = useCallback(() => _error, [_error]);
  const suscribe = useCallback(() => _setMounted(true), []);
  const unsucribe = useCallback(() => _setMounted(false), []);

  const actions = useMemo(() => {
    return {
      __type: "fieldlike",
      get,
      set,
      reset,
      setError,
      clearError,
      error,
      dirty,
      mounted,
      suscribe,
      unsucribe,
    } satisfies FieldLike<FormLike>;
  }, [get, set, reset, clearError, error, dirty, mounted, suscribe, unsucribe]);

  return actions;
}

/***    Formlike     ***/
export type FormLike = NesteableRecord<FieldLikeAny>;

export type FormLikeValue<TForm extends FormLike> = Prettify<{
  [K in keyof TForm]: TForm[K] extends FieldLikeAny
    ? ReturnType<TForm[K]["get"]>
    : TForm[K] extends FormLike
    ? FormLikeValue<TForm[K]>
    : never;
}>;

// type FormOptions<TForm extends FormLike> = {
//   schema?: z.ZodType;
// };

export type ReturnFormLike<TForm extends FormLike> = {
  __type: "formlike";
  form: TForm;
  get: () => FormLikeValue<TForm>;
  reset: () => void;
  validate: (cb?: (value: FormLikeValue<TForm>) => void) => boolean;
  errors: Record<string, string>;
};

export function useFormLike<TForm extends FormLike, TSchema extends z.ZodType>(options: {
  form: TForm;
  schema: TSchema;
  onValid?: (value: z.infer<TSchema>) => void;
  onError?: (_errors: Record<string, string>) => void;
}): ReturnFormLike<TForm> {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const get = useCallback(() => {
    return _get(options.form);
  }, [options.form]);

  const reset = useCallback(() => {
    return _reset(options.form);
  }, [options.form]);

  const validate = useCallback(
    (cb?: (value: z.infer<TSchema>) => void) => {
      const schema = options.schema;
      if (!schema) return false;
      try {
        const value = get();
        const res = schema.parse(value) as z.infer<TSchema>;
        setErrors({});
        cb?.(res);
        options.onValid?.(res);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors(error.errors.reduce((acc, error) => ({ ...acc, [error.path.join(".")]: error.message }), {}));
        }
        options.onError?.(errors);
        return false;
      }
    },
    [errors, get, options]
  );

  return useMemo(() => {
    return {
      __type: "formlike",
      form: options.form,
      get,
      reset,
      validate,
      errors,
    };
  }, [errors, get, options.form, reset, validate]);
}

function _get<TForm extends FormLike>(form: TForm): FormLikeValue<TForm> {
  if ("get" in form && typeof form.get === "function") {
    return (form as unknown as FieldLikeAny).get() as never;
  }
  return Object.keys(form).reduce((acc, key) => {
    acc[key] = _get(form[key] as FormLike);
    return acc;
  }, {} as Record<string, unknown>) as FormLikeValue<TForm>;
}

function _reset<TForm extends FormLike>(form: TForm) {
  if ("reset" in form && typeof form.get === "function") {
    return (form as unknown as FieldLikeAny).reset();
  }
  Object.keys(form).forEach((acc, key) => {
    _reset(form[key] as FormLike);
  });
}

/* FORM:
 *  - get all field errors (as get)
 *  - get all unmounted fields errors (as get)
 *
 * FIELD:
 *  - debugger function
 */
