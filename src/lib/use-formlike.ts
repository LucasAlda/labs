import { editObject, getObject } from "@/lib/objects";
import { createFlatProxy, createRecursiveProxy } from "@/lib/proxy";
import { useMemo, useState } from "react";
import { z } from "zod";

// type DeepOptional<T extends Record<string, unknown>> =

type NonOptionalKeys<T extends Record<string, unknown>> = NonNullable<
  {
    [V in keyof T]: IsntOptional<T[V]>;
  }[keyof T]
> extends true
  ? true
  : false;

// type DeepOptional<T extends Record<string, unknown>> = {

// }

type IsOptional<T> = [T] extends [NonNullable<T>] ? false : true;
type IsntOptional<T> = [T] extends [NonNullable<T>] ? true : false;

// type b = IsOptional<null>;
// // type c = string  extends string | null ? true : false;

// type a = KeysAllOptional<{
//   name?: string;
//   age?: number;
//   address?: {
//     city: string;
//     street: string;
//   };
// }>;

const isObjectOrArray = (val: unknown) => {
  const toStringVal = Object.prototype.toString.call(val);
  return ["[object Object]", "[object Array]"].includes(toStringVal);
};

type GenericObject = Record<string, unknown>;

export const flattenObject = (obj: GenericObject, roots = []) => {
  const keys = Object.keys(obj);

  return keys.reduce((memo, prop) => {
    const isNested = isObjectOrArray(obj[prop]);

    const newRoots = (
      isNested
        ? flattenObject(obj[prop] as never, roots.concat([prop as never]))
        : { [roots.concat([prop as never]).join(".")]: obj[prop] }
    ) as GenericObject;

    return Object.assign({}, memo, newRoots);
  }, {} as GenericObject);
};

type Options<TState> = {
  defaultValues: TState;
  schema?: z.ZodType;
};

type Actions<T> = {
  get: () => T;
  set: (value: T) => void;
  reset: () => void;
  setError: (error: string | undefined) => void;
  clearError: () => void;
  error: () => string | undefined;
};

type ValueArrProxy<TArr extends unknown[]> = TArr extends Array<infer TArrElem>
  ? TArrElem extends GenericObject
    ? never
    : TArrElem extends Array<unknown>
    ? never
    : Actions<TArrElem>[]
  : never;

export type ValueProxy<TObj> = TObj extends unknown[]
  ? ValueArrProxy<TObj>
  : TObj extends GenericObject
  ? {
      [TKey in keyof TObj]: TKey extends string
        ? TObj[TKey] extends GenericObject
          ? ValueProxy<TObj[TKey]>
          : TObj[TKey] extends Array<unknown>
          ? ValueArrProxy<TObj[TKey]>
          : Actions<TObj[TKey]>
        : never;
    }
  : Actions<TObj>;

type a = ValueProxy<Contact>["address"];

// type b = a["nest"][0]["get"];

function useFormlike<Form extends GenericObject>(options: Options<Form>) {
  const [values, _setValues] = useState(options.defaultValues);
  const [errors, _setErrors] = useState<Record<string, string | undefined>>({});
  const [dirty, _setDirty] = useState<Record<string, boolean>>({});

  function setValue() {}
  const controls = {
    setValue,
  };

  const get = (path: string) => {
    return getObject(values, path);
  };

  const set = (path: string, value: unknown) => {
    _setValues((prev) => {
      const newValues = { ...prev };
      editObject(newValues, path, value);
      return newValues;
    });
  };

  const setDirty = (path: string, value: boolean) => {
    _setDirty((prev) => {
      const newDirty = { ...prev };
      newDirty[path] = value;
      return newDirty;
    });
  };

  const setError = (path: string, error: string | undefined) => {
    _setErrors((prev) => {
      const newErrors = { ...prev };
      newErrors[path] = error;
      return newErrors;
    });
  };

  const reset = (path: string) => {
    set(path, getObject(options.defaultValues, path));
    setDirty(path, false);
  };

  const fields = createFlatProxy<ValueProxy<Form>>((key) => {
    return createRecursiveProxy(($path, args) => {
      const fullPath = [key, ...$path];
      const last = fullPath.pop();

      const actions = {
        get: () => get(fullPath.join(".")),
        set: (value: unknown) => {
          set(fullPath.join("."), value);
        },
        reset: () => {
          reset(fullPath.join("."));
        },
        setError: (error: string) => {
          setError(fullPath.join("."), error);
        },
        clearError: () => {
          setError(fullPath.join("."), undefined);
        },
        error: () => errors[fullPath.join(".")],
        dirty: () => dirty[fullPath.join(".")],
        setDirty: (value: boolean) => {
          setDirty(fullPath.join("."), value);
        },
      } as Actions<any>;

      (actions[last as keyof typeof actions] as any)(...(args as any[]));
    });
  });

  return [values, fields] as const;
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

/* PROHIBIDO:
 *  - Valores opcionales no primitivos (no objetos, no arrays)
 *  - Arrays de valores no primitivos (no objetos, no arrays)
 */
const [contact, control] = useFormlike<Contact>({
  schema,
  defaultValues: {
    name: undefined,
    categories: [],
    age: null,
    gender: "female",
    address: {
      city: "Tel Aviv",
      street: "Rothschild",
      postalCode: 123,
    },
  },
});

contact.age;

control.address.postalCode.set(123);
const city = control.address.city.get();
const street = control.address.street?.set("test");
control.categories[0]?.set("a");
control.categories[0]?.get();
control.age.get();
