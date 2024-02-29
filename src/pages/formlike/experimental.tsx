import { Input } from "@/formlike/components";
import { useFieldLike, useFormLike, type FormLike, type FieldLike } from "@/formlike/use-formlike";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
  phone: z.string().min(10, { message: "Sabes escribir un telefono?" }),
});

type Field = {
  value: unknown;
};

function field<T>() {
  return (initialValue: T) => ({ value: initialValue } satisfies Field);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function factory<Fields extends Record<string, (value: any) => Field>>({}: {
  fields: Fields;
  initialValues?: { [k in keyof Fields]?: ReturnType<Fields[k]>["value"] };
}) {
  const fieldsStates = {} as ;
  Object.entries(fields).forEach(([name, field]) => {
    fieldsStates[name] = field(undefined);
  });
  return {};
}

const form = factory({
  fields: { name: field<string>(), age: field<number>() },
  initialValues: {
    name: "John Doe",
    age: 30,
  },
});

type Contact = {
  name: FieldLike<string | undefined>;
  age: FieldLike<number>;
  phone: FieldLike<string | undefined>;
};

export default function Page() {
  const contact = useFormLike({
    form: {
      name: useFieldLike<string | undefined>(undefined),
      age: useFieldLike<number>(0),
      phone: useFieldLike<string | undefined>(undefined),
    },
    schema,
    onValid: (value) => console.log({ value }),
    onError: (errors) => console.log(errors),
  }) satisfies FormLike<Contact>;

  return (
    <div className="h-screen bg-slate-100">
      <div className="grid grid-cols-2 flex-wrap items-start justify-start gap-4 p-4">
        <div className="row-span-6 space-y-4">
          <Card title="Contact">
            <ViewJSON data={contact.get()} />
            <Button onClick={contact.reset}>Reset</Button>
          </Card>
          <Card title="Errors">
            <ViewJSON data={contact.errors} />
          </Card>
          <Card title="Field Errors">
            <ViewJSON data={contact.getErrors()} />
          </Card>
        </div>
        <Card title="Name">
          <Input field={contact.form.name} />
        </Card>
        <Card title="Age">
          <Input field={contact.form.age} valueFormatter={(val) => Number(val)} />
        </Card>
        <Card title="Phone">
          <Input field={contact.form.phone} />
        </Card>
        <Card title="Validate">
          <Button onClick={() => contact.validate()}>Validar</Button>
        </Card>
      </div>
    </div>
  );
}

function ViewJSON({ data }: { data?: unknown }) {
  return (
    <pre>
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
}

function Card({ title, children, className = "" }: { title: string; children?: React.ReactNode; className?: string }) {
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
