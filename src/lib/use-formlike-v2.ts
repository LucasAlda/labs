import { useState } from "react";
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

  function set(value: FormLike | ((prev: FormLike) => FormLike)) {
    _setValue(typeof value === "function" ? (value as Function)(value) : value);
    setDirty(true);
  }

  const reset = () => {
    set(defaultValue);
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

const schema = z.object({
  name: z.string(),
  age: z.number(),
  address: z.object({
    city: z.string(),
    street: z.string(),
  }),
});

type Contact = {
  name: string | undefined;
  age: number | null;
  gender: "male" | "female";
  categories: string[];
  address: {
    city: string;
    street?: string;
    postalCode: number;
  };
};

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

type Stack<T> = {
  [x: string]: T | Stack<T>;
};

type FormLike = Stack<FieldLikeAny>;

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

function useFormLike<TForm extends FormLike>(form: TForm) {
  function get() {
    return _get(form);
  }

  return {
    get,
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

const contact = useFormLike({
  name,
  age,
  address,
  comunication: {
    phone,
    email,
    isSuscribed,
  },
});

const a = contact.get();
