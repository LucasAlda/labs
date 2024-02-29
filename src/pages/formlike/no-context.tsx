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
    .min(8, { message: "El telefono es demasiado corto" })
    .max(12, { message: "El telefono es demasiado largo" }),
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
          <Field label="Contact">
            <ViewJSON data={contact.get()} />
            <Button onClick={contact.reset}>Reset</Button>
          </Field>
          <Field label="Errors">
            <ViewJSON data={contact.formStatus} />
            <ViewJSON data={contact.errors()} />
          </Field>
          <Field label="Unmounted Errors">
            <UnmountedErrors form={contact} />
          </Field>
        </div>
        <Field label="Name">
          <FieldInput field={contact.form.name} />
          <FieldError field={contact.form.name}>Flaco no sabes tu nombre?</FieldError>
          <FieldInfo field={contact.form.name} />
        </Field>
        <Field label="Age">
          <FieldInput field={contact.form.age} valueFormatter={(val) => Number(val)} />
          <FieldError field={contact.form.age} />
          <FieldInfo field={contact.form.age} />
        </Field>
        <Field label="Phone">
          <FieldInput
            field={contact.form.phone}
            onChange={(e) => {
              e.target.value.length > 10
                ? contact.form.phone.setError("Sin codigo de area")
                : e.target.value.length < 10
                ? contact.form.phone.setError({ message: "Quizas te falto un numero", level: "warn" })
                : contact.form.phone.setError(undefined);
            }}
          />
          <FieldError field={contact.form.phone} beforeError="info" info="Debe ser XXXXXXXX sin guiones" />
          <FieldInfo field={contact.form.phone} />
        </Field>
        <Field label="Validate">
          <Button onClick={() => contact.submit()}>Validar</Button>
        </Field>
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

function Field({
  label: title,
  children,
  className = "",
}: {
  label: string;
  children?: React.ReactNode;
  className?: string;
}) {
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
