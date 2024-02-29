import { FieldError, FieldInfo, FieldInput, UnmountedErrors } from "@/formlike/components";
import { useFieldLike, useFormLike } from "@/formlike/hooks";
import { z } from "zod";

const schema = z.object({
  name: z.string({ required_error: "El nombre es obligatorio", invalid_type_error: "El nombre debe ser un texto" }),
  age: z.number({ required_error: "La edad es obligatoria", invalid_type_error: "La edad debe ser un numero" }),
  phone: z
    .string({
      required_error: "El telefono es obligatorio",
      invalid_type_error: "El telefono debe ser en formato texto",
    })
    .min(8, { message: "Sabes escribir un telefono?" }),
});

export default function Page() {
  const contact = useFormLike({
    form: {
      name: useFieldLike<string | undefined>(undefined),
      age: useFieldLike<number | undefined>(undefined),
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
            <UnmountedErrors form={contact} />
          </Card>
        </div>
        <Card title="Name">
          <FieldInput field={contact.form.name} />
          <FieldError field={contact.form.name}>Flaco no sabes tu nombre?</FieldError>
          <FieldInfo field={contact.form.name} />
        </Card>
        <Card title="Age">
          <FieldInput field={contact.form.age} valueFormatter={(val) => Number(val)} />
          <FieldError field={contact.form.age} />
          <FieldInfo field={contact.form.age} />
        </Card>
        <Card title="Phone">
          <FieldInput
            field={contact.form.phone}
            onChange={(e) => {
              e.target.value.length > 12
                ? contact.form.phone.setError("Tan largo va a ser??")
                : contact.form.phone.setError(undefined);
            }}
          />
          <FieldError field={contact.form.phone} />
          <FieldInfo field={contact.form.phone} />
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
