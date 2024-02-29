import { FieldInput } from "@/formlike/components";
import { useFieldLike, type FieldLike, createFormLikeContext, useFormLike, type FormLike } from "@/formlike/hooks";
import { memo } from "react";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
  address: z.object({
    city: z.string(),
    street: z.string(),
  }),
  comunication: z.object({
    phone: z.string().min(10),
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
  phone: FieldLike<string | undefined>;
  email: FieldLike<number>;
  isSuscribed: FieldLike<boolean>;
};

const [ContactForm, useContactCtx] = createFormLikeContext<Contact>();

export default function Page() {
  const contact = useFormLike({
    form: {
      name: useFieldLike<string | undefined>(undefined),
      age: useFieldLike<number>(0),
      address: useFieldLike({
        city: "",
        street: "",
      }),
      phone: useFieldLike<string | undefined>(undefined),
      email: useFieldLike(1),
      isSuscribed: useFieldLike(true),
    },
    schema,
    onValid: (value) => console.log({ value }),
    onError: (errors) => console.log(errors),
  }) satisfies FormLike<Contact>;

  console.log("test", contact.unmountedErrors());

  return (
    <ContactForm value={contact}>
      <div className="h-screen w-screen bg-slate-100">
        <div className="grid grid-cols-4 flex-wrap items-start justify-start gap-4 p-4">
          <div className="row-span-6 space-y-4">
            <All />
            <Errors />
            <FieldErrors />
          </div>
          <Name />
          <Phone />
          <Address />
          <PhoneInput />
          <AddressInput />
          <Validate />
          <GenericInput field={contact.form.name} />
        </div>
      </div>
    </ContactForm>
  );
}

const All = memo(function Name() {
  const contact = useContactCtx((c) => c);

  return (
    <Card title="Contact">
      <ViewJSON data={contact.get()} />
      <Button onClick={contact.reset}>Reset</Button>
    </Card>
  );
});

const Errors = memo(function Name() {
  const errors = useContactCtx((c) => c.errors);

  return (
    <Card title="Errors">
      <ViewJSON data={errors} />
    </Card>
  );
});

const FieldErrors = memo(function Name() {
  const contact = useContactCtx((c) => c);
  return (
    <Card title="Field Errors">
      <ViewJSON data={contact.unmountedErrors()} />
    </Card>
  );
});

const Name = memo(function Name() {
  const name = useContactCtx((c) => c.form.name);
  const error = useContactCtx((c) => c.errors.name);
  return (
    <Card title="Name">
      <ViewJSON data={name.get()} />
      <p>Error: {error}</p>
    </Card>
  );
});

const Phone = memo(function Phone() {
  const phone = useContactCtx((c) => c.form.phone);
  const errors = useContactCtx((c) => c.form.phone.error());

  function toggleMount() {
    if (phone.isMounted) {
      phone.unmount();
    } else {
      phone.mount();
    }
  }

  return (
    <>
      <Card title="Phone">
        <ViewJSON data={phone.get()} />
        <Button onClick={toggleMount}>{phone.isMounted ? "Desmontar" : "Montar"}</Button>
        <p>Error: {errors}</p>
        <p>isMounted: {phone.isMounted.toString()}</p>
      </Card>
    </>
  );
});

const Address = memo(function Address() {
  const address = useContactCtx((c) => c.form.address);

  return (
    <Card title="Address">
      <ViewJSON data={address.get()} />
    </Card>
  );
});

const AddressInput = memo(function AddressInput() {
  const address = useContactCtx((c) => c.form.address);

  return (
    <Card title="Address Editor">
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
    </Card>
  );
});

const PhoneInput = memo(function PhoneInput() {
  const phone = useContactCtx((c) => c.form.phone);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    phone.set(e.target.value);
    phone.setError(e.target.value.length > 10 ? "Phone number is too long" : undefined);
  }

  return (
    <Card title="Phone Editor">
      <FieldInput className="block rounded border border-slate-300 p-1 px-2" field={phone} />
      <input className="block rounded border border-slate-300 p-1 px-2" onChange={handleChange} value={phone.get()} />
    </Card>
  );
});

const GenericInput = memo(function PhoneInput({
  field,
  title,
}: {
  field: FieldLike<string | undefined>;
  title?: string;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    field.set(e.target.value);
    field.setError(e.target.value.length > 10 ? "Phone number is too long" : undefined);
  }

  return (
    <Card title={title ?? ""}>
      <input className="block rounded border border-slate-300 p-1 px-2" onChange={handleChange} value={field.get()} />
    </Card>
  );
});

const Validate = memo(function PhoneInput() {
  const validate = useContactCtx((c) => c.validate);

  return (
    <Card title="Validate">
      <Button onClick={() => validate()}>Validar</Button>
    </Card>
  );
});

function ViewJSON({ data }: { data?: unknown }) {
  return (
    <pre>
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={"rounded-md bg-white p-4 shadow" + " " + className}>
      <h1 className="font-semibold text-slate-800">{title}</h1>
      {children}
    </div>
  );
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button className="rounded-md bg-blue-500 px-3 py-1 text-white shadow" onClick={onClick}>
      {children}
    </button>
  );
}
