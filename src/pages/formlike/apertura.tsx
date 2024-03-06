import { SelectItem } from "@/components/ui/select";
import { ErrorLike, InputLike, SelectLike, UnmountedErrorsLike } from "@/formlike/components";
import { type FieldLikeAny, enougth, useFieldLike, useFormLike } from "@/formlike/hooks";
import { useEffect, useState } from "react";
import { z } from "zod";

const personSchema = z.object({
  general: z.object({
    email: z
      .string({ required_error: "El email es obligatorio", invalid_type_error: "El email debe ser un texto" })
      .email({ message: "El email no es valido" }),
    phone: z.string({
      required_error: "El telefono es obligatorio",
      invalid_type_error: "El telefono debe ser un texto",
    }),
    identity: z.object({
      type: z.enum(["dni", "passport"], {
        required_error: "El tipo de documento es obligatorio",
        invalid_type_error: "El tipo de documento debe ser un DNI o pasaporte",
      }),
      number: z.number({
        required_error: "El numero de documento es obligatorio",
        invalid_type_error: "El numero de documento debe ser un numero",
      }),
    }),
    legalIdentity: z.object({
      type: z.enum(["dni", "passport"], {
        required_error: "El tipo de documento legal es obligatorio",
        invalid_type_error: "El tipo de documento legal debe ser un DNI o pasaporte",
      }),
      number: z.number({
        required_error: "El numero de documento legal es obligatorio",
        invalid_type_error: "El numero de documento legal debe ser un numero",
      }),
    }),
    name: z.string({ required_error: "El nombre es obligatorio", invalid_type_error: "El nombre debe ser un texto" }),
    lastName: z.string({
      required_error: "El apellido es obligatorio",
      invalid_type_error: "El apellido debe ser un texto",
    }),
    nationality: z.string({
      required_error: "La nacionalidad es obligatoria",
      invalid_type_error: "La nacionalidad debe ser un texto",
    }),
    birthplace: z.string({
      required_error: "El lugar de nacimiento es obligatorio",
      invalid_type_error: "El lugar de nacimiento debe ser un texto",
    }),
    birthday: z.date({
      required_error: "La fecha de nacimiento es obligatoria",
      invalid_type_error: "La fecha de nacimiento debe ser una fecha",
    }),
    genre: z.enum(["F", "M", "X", "N"], {
      required_error: "El genero es obligatorio",
      invalid_type_error: "El genero debe ser F, M, X o N",
    }),
    civilStatus: z.enum(["single", "married", "divorced", "widowed", "separated", "other"], {
      required_error: "El estado civil es obligatorio",
      invalid_type_error: "El estado civil debe ser soltero, casado, divorciado, viudo, separado u otro",
    }),
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
          <Card label="Titular Datos Generales">
            <ViewJSON data={person.get()} />
            <Button onClick={person.reset}>Reset</Button>
          </Card>
          <Card label="Enviar">
            <Button onClick={() => person.submit()}>Submit</Button>
          </Card>
          <Card label="Errors">
            <ViewJSON data={person.formStatus} />
            <ViewJSON data={person.errors()} />
          </Card>
          <Card label="Unmounted Errors">
            <UnmountedErrorsLike form={person} />
          </Card>
        </div>
        <div className="space-y-2">
          <Field label="Email" field={person.form.general.email} />
          <Field label="Phone" field={person.form.general.phone} />

          <Card label="Documento">
            <div className="flex">
              <SelectLike field={person.form.general.identity.type}>
                <SelectItem value="dni">DNI</SelectItem>
                <SelectItem value="passport">Pasaporte</SelectItem>
              </SelectLike>
              <InputLike field={person.form.general.identity.number} setAs={Number} />
            </div>
            <ErrorLike field={person.form.general.identity.type} />
            <ErrorLike field={person.form.general.identity.number} />
          </Card>

          <Card label="Documento Legal">
            <div className="flex">
              <SelectLike field={person.form.general.legalIdentity.type}>
                <SelectItem value="dni">DNI</SelectItem>
                <SelectItem value="passport">Pasaporte</SelectItem>
              </SelectLike>
              <InputLike field={person.form.general.legalIdentity.number} setAs={Number} />
            </div>
            <ErrorLike field={person.form.general.legalIdentity.type} />
            <ErrorLike field={person.form.general.legalIdentity.number} />
          </Card>

          <Card label="Nombre">
            <div className="flex">
              <InputLike field={person.form.general.name} />
              <InputLike field={person.form.general.lastName} />
            </div>
            <ErrorLike field={person.form.general.name} />
            <ErrorLike field={person.form.general.lastName} />
          </Card>
          <FieldSelect label="Nacionalidad" field={person.form.general.nationality}>
            <SelectItem value="argentina">Argentina</SelectItem>
            <SelectItem value="mexico">Mexico</SelectItem>
          </FieldSelect>

          <Field
            label="Nacimiento"
            field={person.form.general.birthday}
            type="date"
            valueAs={(v) => v?.toISOString()?.split("T")[0] ?? ""}
            setAs={(val) => new Date(val)}
          />

          <FieldSelect label="Lugar Nacimiento" field={person.form.general.birthplace}>
            <SelectItem value="argentina">Argentina</SelectItem>
            <SelectItem value="mexico">Mexico</SelectItem>
          </FieldSelect>

          <FieldSelect label="Genero" field={person.form.general.genre}>
            <SelectItem value="M">Masculino</SelectItem>
            <SelectItem value="F">Femenino</SelectItem>
            <SelectItem value="X">No binario</SelectItem>
            <SelectItem value="N">Otro</SelectItem>
          </FieldSelect>

          <FieldSelect label="Estado civil" field={person.form.general.civilStatus}>
            <SelectItem value="single">Soltero</SelectItem>
            <SelectItem value="married">Casado</SelectItem>
            <SelectItem value="divorced">Divorciado</SelectItem>
            <SelectItem value="widowed">Viudo</SelectItem>
            <SelectItem value="separated">Separado</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </FieldSelect>
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

function Card({
  label: title,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"rounded-md bg-white p-4 shadow" + " " + className}>
      <h1 className="font-semibold text-slate-800">{title}</h1>
      {children}
    </div>
  );
}

interface Field<T extends FieldLikeAny> extends InputLike<T> {
  label: string;
  info?: string;
  fieldClassName?: string;
}

function Field<T extends FieldLikeAny>({ field, info, label, fieldClassName, ...props }: Field<T>) {
  return (
    <Card label={label} className={fieldClassName}>
      <InputLike field={field} {...props} />
      <ErrorLike field={field} info={info} />
    </Card>
  );
}

interface FieldSelect<T extends FieldLikeAny> extends SelectLike<T> {
  label: string;
  info?: string;
  fieldClassName?: string;
}

function FieldSelect<T extends FieldLikeAny>({
  field,
  info,
  label: title,
  className = "",
  children,
}: {
  label: string;
  info?: string;
  className?: string;
  field: T;
  value?: string;
  valueFormatter?: (value: string) => ReturnType<T["get"]>;
  children: React.ReactNode;
}) {
  return (
    <Card label={title} className={className}>
      <SelectLike field={field}>{children}</SelectLike>
      <ErrorLike field={field} info={info} />
    </Card>
  );
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button className="rounded-md bg-blue-500 px-3 py-1 text-white shadow" onClick={onClick}>
      {children}
    </button>
  );
}
