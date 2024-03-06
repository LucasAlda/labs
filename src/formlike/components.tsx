import { type FormLikeAny, type FieldLikeAny, type FormLike } from "@/formlike/hooks";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { forwardRef, memo, type ForwardedRef, useEffect, type ReactNode } from "react";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface InputProps<T extends FieldLikeAny> extends React.InputHTMLAttributes<HTMLInputElement> {
  field: T;
  noValidation?: boolean;
  keepIsDirtyFalse?: boolean;
  valueAs?: (value: ReturnType<T["get"]>) => string;
  setAs?: (value: string) => ReturnType<T["get"]>;
}

export const FieldInput = memo(
  forwardRef(
    <T extends FieldLikeAny>(
      { field, onChange, noValidation, valueAs, setAs, ...props }: InputProps<T>,
      ref: ForwardedRef<HTMLInputElement>
    ) => {
      function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        field.set(setAs ? setAs(e.target.value) : e.target.value, { noValidation });
        onChange?.(e);
      }

      const value = typeof valueAs === "function" ? valueAs(field.get() as never) : (field.get() as never);

      return <Input ref={ref} value={value ?? ""} {...props} onChange={handleChange} />;
    }
  )
);

export interface SelectProps<T extends FieldLikeAny>
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "defaultValue" | "dir" | "onChange"> {
  field: T;
  noValidation?: boolean;
  keepIsDirtyFalse?: boolean;
  valueAs?: (value: ReturnType<T["get"]>) => string;
  setAs?: (value: string) => ReturnType<T["get"]>;
  defaultValue?: string;
  onChange?: (value: ReturnType<T["get"]> | string) => void;
}
export const FieldSelectInput = memo(function FieldSelectInput<T extends FieldLikeAny>({
  field,
  onChange,
  noValidation,
  children,
  className,
  valueAs,
  setAs,
  ...props
}: SelectProps<T>) {
  function handleChange(value: string) {
    const parsedValue = setAs ? setAs(value) : value;
    field.set(parsedValue, { noValidation });
    onChange?.(parsedValue);
  }

  const value = typeof valueAs === "function" ? valueAs(field.get() as never) : (field.get() as never);

  return (
    <Select {...props} value={value ?? ""} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
});

interface FieldError<T extends FieldLikeAny> extends React.InputHTMLAttributes<HTMLParagraphElement> {
  field: T;
  beforeError?: "info" | "warn" | "error";
  children?: React.ReactNode;
  info?: ReactNode;
}
export const FieldError = memo(function Error<T extends FieldLikeAny>({
  field,
  className,
  beforeError = "info",
  info,
  children,
  ...props
}: FieldError<T>) {
  const error = field.error();
  const maxLevel = field.formStatus === "errored" ? "error" : beforeError;

  useEffect(() => {
    field.mountError();
    return () => field.unmountError();
  }, [field]);

  if (["error"].includes(maxLevel) && error?.level === "error") {
    return (
      <p {...props} className={cn("text-sm text-red-500", className)}>
        {children ?? error.message}
      </p>
    );
  }

  if (["warn", "error"].includes(maxLevel) && error?.level === "warn") {
    return (
      <p {...props} className={cn("text-sm text-yellow-500", className)}>
        {children ?? error.message}
      </p>
    );
  }

  return (
    <p {...props} className={cn("text-sm text-slate-500", className)}>
      {info}
    </p>
  );
});

interface FieldInfo<T extends FieldLikeAny> extends React.InputHTMLAttributes<HTMLParagraphElement> {
  field: T;
}
export const FieldInfo = memo(function Error<T extends FieldLikeAny>({ field, className, ...props }: FieldInfo<T>) {
  return (
    <p {...props} className={cn("text-sm text-slate-500", className)}>
      Mounted: {field.isMounted.toString()} - Dirty: {field.isDirty.toString()} - Form Status: {field.formStatus}
    </p>
  );
});

interface UnmountedErrors<T extends FormLike<FormLikeAny>>
  extends Omit<React.InputHTMLAttributes<HTMLParagraphElement>, "form"> {
  form: T;
}
export const UnmountedErrors = memo(function UnmountedErrors<T extends FormLike<FormLikeAny>>({
  form,
  className,
  ...props
}: UnmountedErrors<T>) {
  return Object.entries(form.flatUnmountedErrors())
    .sort(([, a], [, b]) => (a?.level === "warn" && b?.level === "warn" ? 0 : a?.level === "warn" ? -1 : 1))
    .map(([key, error]) => (
      <p
        {...props}
        key={key}
        className={cn(
          "text-sm",
          { "text-red-500": error?.level === "error", "text-yellow-500": error?.level === "warn" },
          className
        )}
      >
        {error?.message}
      </p>
    ));
});
