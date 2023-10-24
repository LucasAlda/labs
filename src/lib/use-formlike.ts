import { type SetStateAction, useCallback, useState, useMemo, useEffect } from "react";
import { createContext, useContextSelector } from "use-context-selector";
import { z } from "zod";

/***   Utility Types   ***/
// eslint-disable-next-line @typescript-eslint/ban-types
type Prettify<T> = T & {};

type NesteableRecord<T> = {
  [x: string]: T | NesteableRecord<T>;
};

/***   Context   ***/
export function createFormLikeContext<T extends FormLikeAny>() {
  const context = createContext<FormLike<T>>(null as never);
  function useFormLikeContext<Selected>(selector: (value: FormLike<T>) => Selected): Selected {
    return useContextSelector(context, selector);
  }
  return [context, useFormLikeContext] as const;
}

/***    Fieldlike     ***/
export type FieldLike<T> = {
  __type: "fieldlike";
  get: () => T;
  set: (value: T) => void;
  reset: () => void;
  setError: (error: string | undefined) => void;
  clearError: () => void;
  error: string | undefined;
  isDirty: boolean;
  isMounted: boolean;
  mount: () => void;
  unmount: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldLikeAny = FieldLike<any>;

export function useFieldLike<FormLike>(_defaultValue: FormLike) {
  const [defaultValue, setDefaultValue] = useState(_defaultValue);
  const [value, _setValue] = useState(defaultValue);
  const [error, setError] = useState<string>();
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
  const mount = useCallback(() => _setMounted(true), []);
  const unmount = useCallback(() => _setMounted(false), []);

  const actions = useMemo(() => {
    return {
      __type: "fieldlike",
      get,
      set,
      reset,
      setError,
      clearError,
      error,
      isDirty,
      isMounted,
      mount,
      unmount,
    } satisfies FieldLike<FormLike>;
  }, [get, set, reset, clearError, error, isDirty, isMounted, mount, unmount]);

  return actions;
}

/***    Formlike     ***/
export type FormLikeAny = NesteableRecord<FieldLikeAny>;

export type FormLikeValue<TForm extends FormLikeAny> = Prettify<{
  [K in keyof TForm]: TForm[K] extends FieldLikeAny
    ? ReturnType<TForm[K]["get"]>
    : TForm[K] extends FormLikeAny
    ? FormLikeValue<TForm[K]>
    : never;
}>;

export type FormLikeFieldError<TForm extends FormLikeAny> = Prettify<{
  [K in keyof TForm]: TForm[K] extends FieldLikeAny
    ? TForm[K]["error"]
    : TForm[K] extends FormLikeAny
    ? FormLikeValue<TForm[K]>
    : never;
}>;

export type FormLike<TForm extends FormLikeAny> = {
  __type: "formlike";
  form: TForm;
  get: () => FormLikeValue<TForm>;
  getFieldErrors: () => Record<string, string | undefined>;
  getUnmountedErrors: () => Record<string, string | undefined>;
  reset: () => void;
  validate: (cb?: (value: FormLikeValue<TForm>) => void) => boolean;
  errors: Record<string, string>;
};

export function useFormLike<TForm extends FormLikeAny, TSchema extends z.ZodType>(options: {
  form: TForm;
  schema: TSchema;
  onValid?: (value: z.infer<TSchema>) => void;
  onError?: (_errors: Record<string, string>) => void;
}): FormLike<TForm> {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const get = useCallback(() => {
    return _get(options.form);
  }, [options.form]);

  const getFieldErrors = useCallback(() => {
    return flattenObject(_fieldErrors(options.form)) as Record<string, string | undefined>;
  }, [options.form]);

  const getUnmountedErrors = useCallback(() => {
    return flattenObject(_unmountedFieldErrors(options.form)) as Record<string, string | undefined>;
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
      getFieldErrors,
      getUnmountedErrors,
      get,
      reset,
      validate,
      errors,
    } satisfies FormLike<TForm>;
  }, [options.form, getFieldErrors, getUnmountedErrors, get, reset, validate, errors]);
}

function _get<TForm extends FormLikeAny>(form: TForm): FormLikeValue<TForm> {
  if ("get" in form && typeof form.get === "function") {
    return (form as unknown as FieldLikeAny).get() as never;
  }
  return Object.keys(form).reduce((acc, key) => {
    acc[key] = _get(form[key] as never);
    return acc;
  }, {} as Record<string, unknown>) as FormLikeValue<TForm>;
}

function _fieldErrors<TForm extends FormLikeAny>(form: TForm): FormLikeFieldError<TForm> {
  if ("error" in form) {
    return (form as unknown as FieldLikeAny).error as never;
  }
  return Object.keys(form).reduce((acc, key) => {
    acc[key] = _fieldErrors(form[key] as never);
    return acc;
  }, {} as Record<string, unknown>) as FormLikeFieldError<TForm>;
}

function _unmountedFieldErrors<TForm extends FormLikeAny>(form: TForm): FormLikeFieldError<TForm> {
  if ("error" in form && "isMounted" in form) {
    if (form.isMounted) return undefined as never;
    return (form as unknown as FieldLikeAny).error as never;
  }
  return Object.keys(form).reduce((acc, key) => {
    const recError = _unmountedFieldErrors(form[key] as never);
    if (recError) acc[key] = recError;
    return acc;
  }, {} as Record<string, unknown>) as FormLikeFieldError<TForm>;
}

function _reset<TForm extends FormLikeAny>(form: TForm) {
  if ("reset" in form && typeof form.reset === "function") {
    return (form as unknown as FieldLikeAny).reset();
  }
  Object.keys(form).forEach((key) => {
    _reset(form[key] as never);
  });
}

const isObjectOrArray = (val: unknown) => {
  const toStringVal = Object.prototype.toString.call(val);
  return ["[object Object]", "[object Array]"].includes(toStringVal);
};

type GenericObject = Record<string, unknown>;
export const flattenObject = (obj: GenericObject, roots = []) => {
  const keys = Object.keys(obj);

  return keys.reduce((memo, prop) => {
    const isNested = isObjectOrArray(obj[prop]);

    const newRoots: GenericObject = isNested
      ? flattenObject(obj[prop] as GenericObject, roots.concat([prop as never]))
      : { [roots.concat([prop as never]).join(".")]: obj[prop] };

    return Object.assign({}, memo, newRoots);
  }, {} as GenericObject);
};
