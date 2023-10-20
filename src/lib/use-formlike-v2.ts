import { useEffect, useState } from "react";
import { z } from "zod";

type Options<TState> = {
  schema?: z.ZodType;
};

type FieldLike<T> = {
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

type FieldLikeAny = FieldLike<any>;

function useFieldlike<FormLike>(defaultValue: FormLike, options?: Options<FormLike>) {
  const [value, _setValue] = useState(defaultValue);
  const [error, setError] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const [mounted, _setMounted] = useState(false);

  useEffect(() => {
    if (!dirty) {
      _setValue(defaultValue);
    }
  }, [defaultValue]);

  function set(value: FormLike | ((prev: FormLike) => FormLike)) {
    _setValue(typeof value === "function" ? (value as Function)(value) : value);
    setDirty(true);
  }

  const reset = () => {
    _setValue(defaultValue);
    setDirty(false);
    setError(undefined);
  };

  const actions = {
    get: () => value,
    set,
    reset,
    setError,
    clearError: () => setError(undefined),
    error: () => error,
    dirty,
    mounted,
    suscribe: () => _setMounted(true),
    unsucribe: () => _setMounted(false),
  } satisfies FieldLike<FormLike>;

  return actions;
}

// type Contact = {
//   name: string | undefined;
//   age: number | null;
//   gender: "male" | "female";
//   categories: string[];
//   address: {
//     city: string;
//     street?: string;
//     postalCode: number;
//   };
// };

// const contact = useFieldlike<Contact>({
//   name: undefined,
//   categories: [],
//   age: null,
//   gender: "female",
//   address: {
//     city: "Tel Aviv",
//     street: "Rothschild",
//     postalCode: 123,
//   },
// });

// contact.get();

type NesteableRecord<T> = {
  [x: string]: T | NesteableRecord<T>;
};

type FormLike = NesteableRecord<FieldLikeAny>;

type Prettify<T> = T & {};

type FormLikeValue<TForm extends FormLike> = Prettify<{
  [K in keyof TForm]: TForm[K] extends FieldLikeAny
    ? ReturnType<TForm[K]["get"]>
    : TForm[K] extends FormLike
    ? FormLikeValue<TForm[K]>
    : never;
}>;

function _get<TForm extends FormLike>(form: TForm): FormLikeValue<TForm> {
  if ("get" in form && typeof form.get === "function") {
    return (form as unknown as FieldLikeAny).get();
  }
  return Object.keys(form).reduce((acc, key) => {
    acc[key] = _get(form[key] as FormLike);
    return acc;
  }, {} as Record<string, unknown>) as FormLikeValue<TForm>;
}

// type FormOptions<TForm extends FormLike> = {
//   schema?: z.ZodType;
// };

function useFormLike<TForm extends FormLike, TSchema extends z.ZodType = any>(
  form: TForm,
  options?: { schema: TSchema }
) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function get() {
    return _get(form);
  }

  function validate(cb?: (value: z.infer<TSchema>) => void | Promise<void>) {
    const schema = options?.schema;
    if (!schema) return false;
    try {
      const value = get();
      const res = schema.parse(value);
      setErrors({});
      cb?.(res);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(error.errors.reduce((acc, error) => ({ ...acc, [error.path.join(".")]: error.message }), {}));
      }
      return false;
    }
  }

  return {
    form,
    get,
    validate,
  };
}

const name = useFieldlike("");
const age = useFieldlike(0);
const address = useFieldlike({
  city: "",
  street: "",
});
const phone = useFieldlike("");
const email = useFieldlike(1);
const isSuscribed = useFieldlike(true);

const contact = useFormLike(
  {
    name,
    age,
    address,
    comunication: {
      phone,
      email,
      isSuscribed,
    },
  },
  {
    schema: z.object({
      test: z.string(),
    }),
  }
);

const a = contact.get();
const b = contact.validate((val) => console.log(val));
