import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError, FieldInput, UnmountedErrors } from "@/formlike/components";
import { enougth, useFieldLike, useFormLike } from "@/formlike/hooks";
import { useEffect, useState } from "react";
import { z } from "zod";

// const schema = z.object({
//   name: z.string({ required_error: "El nombre es obligatorio", invalid_type_error: "El nombre debe ser un texto" }),
//   age: z.number({ required_error: "La edad es obligatoria", invalid_type_error: "La edad debe ser un numero" }),
//   phone: z
//     .string({
//       required_error: "El telefono es obligatorio",
//       invalid_type_error: "El telefono debe ser en formato texto",
//     })
//     .min(8, { message: "El telefono es demasiado corto" })
//     .max(12, { message: "El telefono es demasiado largo" }),
//   extras: z.object({
//     email: z.string({ required_error: "El email es obligatorio", invalid_type_error: "El email debe ser un texto" }),
//     address: z.string({
//       required_error: "La direccion es obligatoria",
//       invalid_type_error: "La direccion debe ser un texto",
//     }),
//   }),
// });

const personSchema = z.object({
  general: z.object({
    email: z.string().email(),
    phone: z.string(),
    identity: z.object({
      type: z.enum(["dni", "passport"]),
      number: z.number(),
    }),
    legalIdentity: z.object({
      type: z.enum(["dni", "passport"]),
      number: z.number({
        invalid_type_error: "El numero de documento legal debe ser un numero",
        required_error: "El numero de documento legal es obligatorio",
      }),
    }),
    name: z.string(),
    lastName: z.string(),
    nationality: z.string(),
    birthplace: z.string(),
    birthday: z.date(),
    genre: z.enum(["F", "M", "X", "N"]),
    civilStatus: z.enum(["single", "married", "divorced", "widowed", "separated", "other"]),
  }),
});

export default function Page() {
  const [initial, setInitial] = useState<{ name?: string }>({});

  useEffect(() => {
    setTimeout(() => {
      setInitial({ name: "Lucas" });
    }, 2000);
  }, []);

  const person = useFormLike({
    form: enougth(personSchema, {
      general: {
        email: useFieldLike<string | undefined>(undefined),
        phone: useFieldLike<string | undefined>(undefined),
        identity: {
          type: useFieldLike<string>("dni"),
          number: useFieldLike<number | undefined>(undefined),
        },
        legalIdentity: {
          type: useFieldLike<string>("dni"),
          number: useFieldLike<number | undefined>(undefined),
        },
        name: useFieldLike<string | undefined>(initial.name),
        lastName: useFieldLike<string | undefined>(undefined),
        nationality: useFieldLike<string | undefined>(undefined),
        birthplace: useFieldLike<string | undefined>(undefined),
        birthday: useFieldLike<Date | undefined>(undefined),
        genre: useFieldLike<string | undefined>(undefined),
        civilStatus: useFieldLike<string | undefined>(undefined),
      },
    }),
    schema: personSchema,
    onValid: (value) => alert(JSON.stringify(value)),
    onError: (errors) => console.log({ errors }),
  });

  return (
    <div className="h-screen bg-slate-100">
      <div className="grid grid-cols-2 flex-wrap items-start justify-start gap-4 p-4">
        <div className="row-span-2 space-y-4">
          <Field label="Titular Datos Generales">
            <ViewJSON data={person.get()} />
            <Button onClick={person.reset}>Reset</Button>
          </Field>
          <Field label="Enviar">
            <Button onClick={() => person.submit()}>Submit</Button>
          </Field>
          <Field label="Errors">
            <ViewJSON data={person.formStatus} />
            <ViewJSON data={person.errors()} />
          </Field>
          <Field label="Unmounted Errors">
            <UnmountedErrors form={person} />
          </Field>
        </div>
        <div className="space-y-2">
          <Field label="Email">
            <FieldInput type="email" field={person.form.general.email} />
            <FieldError field={person.form.general.email} />
          </Field>
          <Field label="Phone">
            <FieldInput field={person.form.general.phone} />
            <FieldError field={person.form.general.phone} />
          </Field>

          <Field label="Documento">
            <div className="flex">
              <Select
                value={person.form.general.identity.type.get()}
                onValueChange={(val) => person.form.general.identity.type.set(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dni">DNI</SelectItem>
                  <SelectItem value="passport">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
              <FieldInput field={person.form.general.identity.number} valueFormatter={Number} />
            </div>
            <FieldError field={person.form.general.identity.type} />
            <FieldError field={person.form.general.identity.number} />
          </Field>
          <Field label="Documento Legal">
            <div className="flex">
              <Select
                value={person.form.general.legalIdentity.type.get()}
                onValueChange={(val) => person.form.general.legalIdentity.type.set(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dni">DNI</SelectItem>
                  <SelectItem value="passport">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
              <FieldInput field={person.form.general.legalIdentity.number} valueFormatter={Number} />
            </div>
            <FieldError field={person.form.general.legalIdentity.type} />
            <FieldError field={person.form.general.legalIdentity.number} />
          </Field>
          <Field label="Nombre">
            <div className="flex">
              <FieldInput field={person.form.general.name} />
              <FieldInput field={person.form.general.lastName} />
            </div>
            <FieldError field={person.form.general.name} />
            <FieldError field={person.form.general.lastName} />
          </Field>
          <Field label="Nacionalidad">
            <Select
              value={person.form.general.nationality.get()}
              onValueChange={(val) => person.form.general.nationality.set(val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Argentina">Argentina</SelectItem>
                <SelectItem value="Mexico">Uno de mierda</SelectItem>
              </SelectContent>
            </Select>
            <FieldError field={person.form.general.nationality} />
          </Field>
          <Field label="Nacimiento">
            <FieldInput
              type="date"
              field={person.form.general.birthday}
              value={person.form.general.birthday.get()?.toISOString()?.split("T")[0]}
              valueFormatter={(val) => new Date(val)}
            />
            <FieldError field={person.form.general.birthday} />
          </Field>
          <Field label="Lugar Nacimiento">
            <Select
              value={person.form.general.birthplace.get()}
              onValueChange={(val) => person.form.general.birthplace.set(val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Argentina">Argentina</SelectItem>
                <SelectItem value="Mexico">Uno de mierda</SelectItem>
              </SelectContent>
            </Select>
            <FieldError field={person.form.general.birthplace} />
          </Field>
          <Field label="Genero">
            <Select value={person.form.general.genre.get()} onValueChange={(val) => person.form.general.genre.set(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
                <SelectItem value="X">No binario</SelectItem>
                <SelectItem value="O">Otro</SelectItem>
              </SelectContent>
            </Select>
            <FieldError field={person.form.general.genre} />
          </Field>
          <Field label="Estado civil">
            <Select
              value={person.form.general.civilStatus.get()}
              onValueChange={(val) => person.form.general.civilStatus.set(val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Soltero</SelectItem>
                <SelectItem value="married">Casado</SelectItem>
                <SelectItem value="divorced">Divorciado</SelectItem>
                <SelectItem value="widowed">Viudo</SelectItem>
                <SelectItem value="separated">Separado</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            <FieldError field={person.form.general.civilStatus} />
          </Field>
        </div>
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
