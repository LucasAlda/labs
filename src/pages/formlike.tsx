import { useFieldLike, useFormLike, type FieldLike, type FormLike, type ReturnFormLike } from "@/lib/use-formlike";
import { memo } from "react";
import { createContext, useContextSelector } from "use-context-selector";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
  address: z.object({
    city: z.string(),
    street: z.string(),
  }),
  comunication: z.object({
    phone: z.string(),
    email: z.number(),
    isSuscribed: z.boolean(),
  }),
});

type Contact = {
  name: FieldLike<string | undefined>;
  age: FieldLike<number>;
  address: FieldLike<{
    city: string;
    street: string;
  }>;
  comunication: {
    phone: FieldLike<string | undefined>;
    email: FieldLike<number>;
    isSuscribed: FieldLike<boolean>;
  };
};

// <Value, Selected>(context: Context<Value>, selector: (value: Value) => Selected): Selected;

function createFormLikeContext<T extends FormLike>() {
  const context = createContext<ReturnFormLike<T>>(null as never);
  function useFormLikeContext<Selected>(selector: (value: ReturnFormLike<T>) => Selected): Selected {
    return useContextSelector(context, selector);
  }
  return [context, useFormLikeContext] as const;
}

const [contactCtx, useContactCtx] = createFormLikeContext<Contact>();
// const context = createContext<Contact>(null as never);

export default function Page() {
  const contact = useFormLike({
    form: {
      name: useFieldLike<string | undefined>(undefined),
      age: useFieldLike(0),
      address: useFieldLike({
        city: "",
        street: "",
      }),
      comunication: {
        phone: useFieldLike<string | undefined>(undefined),
        email: useFieldLike(1),
        isSuscribed: useFieldLike(true),
      },
    },
    schema,
    onValid: (value) => console.log(value),
    onError: (errors) => console.log(errors),
  });

  return (
    <contactCtx.Provider value={contact}>
      <div className="h-screen w-screen bg-slate-100">
        <div className="flex  flex-wrap items-start justify-start gap-8 p-4">
          <All />
          <Name />
          <Phone />
          <Address />
          <PhoneInput />
          <AddressInput />
          <Errors />
          <Validate />
        </div>
      </div>
    </contactCtx.Provider>
  );
}

const All = memo(function Name() {
  const contact = useContactCtx((c) => c);

  return <ViewJSON name="Contact" data={contact.get()} />;
});

const Errors = memo(function Name() {
  const errors = useContactCtx((c) => c.errors);

  return <ViewJSON name="Errors" data={errors} />;
});

const Name = memo(function Name() {
  const name = useContactCtx((c) => c.form.name);
  const errors = useContactCtx((c) => c.errors);
  console.log(errors);
  return <ViewJSON name="Name" data={name.get()} />;
});

const Phone = memo(function Phone() {
  const phone = useContactCtx((c) => c.form.comunication.phone);

  return <ViewJSON name="Phone" data={phone.get()} />;
});

const Address = memo(function Address() {
  const address = useContactCtx((c) => c.form.address);

  return <ViewJSON name="Address" data={address.get()} />;
});

const AddressInput = memo(function AddressInput() {
  const address = useContactCtx((c) => c.form.address);

  return (
    <div className="space-y-1 rounded-md bg-white p-4 shadow">
      <label className="font-semibold  text-slate-800">Address Editor</label>
      <input
        className="block rounded border border-slate-300 p-1 px-2"
        onChange={(e) => address.set({ ...address.get(), city: e.target.value })}
        value={address.get().city}
      />
      <input
        className="block rounded border border-slate-300 p-1 px-2"
        onChange={(e) => address.set({ ...address.get(), street: e.target.value })}
        value={address.get().street}
      />
    </div>
  );
});

const PhoneInput = memo(function PhoneInput() {
  const phone = useContactCtx((c) => c.form.comunication.phone);

  return (
    <div className="space-y-1 rounded-md bg-white p-4 shadow">
      <label className="font-semibold  text-slate-800">Phone Editor</label>
      <input
        className="block rounded border border-slate-300 p-1 px-2"
        onChange={(e) => phone.set(e.target.value)}
        value={phone.get()}
      />
    </div>
  );
});

const Validate = memo(function PhoneInput() {
  const validate = useContactCtx((c) => c.validate);

  return (
    <div className="space-y-1 rounded-md bg-white p-4 shadow">
      <label className="font-semibold  text-slate-800">Validate</label>
      <button onClick={() => validate()}>Validar</button>
    </div>
  );
});

function ViewJSON({ data, name }: { data: unknown; name?: string }) {
  return (
    <div className="rounded-md bg-white p-4 shadow">
      <h1 className="font-semibold text-slate-800">{name}</h1>
      <pre>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  );
}
