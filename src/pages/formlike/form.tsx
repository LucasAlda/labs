import { Error, Input } from "@/formlike/components";
import { useFieldLike, useFormLike } from "@/formlike/use-formlike";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
  phone: z.string().min(10, { message: "Sabes escribir un telefono?" }),
});

export default function Page() {
  const contact = useFormLike({
    form: {
      name: useFieldLike<string | undefined>(undefined),
      age: useFieldLike<number>(0),
      phone: useFieldLike<string | undefined>(undefined),
    },
    schema,
    onValid: (value) => alert(JSON.stringify(value)),
    onError: (errors) => console.log({ errors }),
  });

  return (
    <div className="h-screen bg-slate-100">
      <div className="grid grid-cols-2 flex-wrap items-start justify-start gap-4 p-4">
        <div className="row-span-6 space-y-4">
          <Card title="Contact">
            <ViewJSON data={contact.get()} />
            <Button onClick={contact.reset}>Reset</Button>
          </Card>
          <Card title="Errors">
            <ViewJSON data={contact.formStatus} />
            <ViewJSON data={contact.errors()} />
          </Card>
          <Card title="Unmounted Errors">
            <ViewJSON data={contact.unmountedErrors()} />
          </Card>
        </div>
        <Card title="Name">
          <Input field={contact.form.name} />
          <Error field={contact.form.name} />
        </Card>
        <Card title="Age">
          <Input field={contact.form.age} valueFormatter={(val) => Number(val)} />
          <Error field={contact.form.age} />
        </Card>
        <Card title="Phone">
          <Input field={contact.form.phone} />
          <Error field={contact.form.phone} />
        </Card>
        <Card title="Validate">
          <Button onClick={() => contact.submit()}>Validar</Button>
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
