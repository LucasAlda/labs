import { type FormLikeAny, type FieldLikeAny, type FormLike } from "@/formlike/hooks";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { forwardRef, memo, type ForwardedRef, useEffect, type ReactNode } from "react";
import { useStore } from "@tanstack/react-store";

export type InputProps<T extends FieldLikeAny> = React.InputHTMLAttributes<HTMLInputElement> & {
  field: T;
  noValidation?: boolean;
  keepIsDirtyFalse?: boolean;
  valueFormatter?: (value: string) => ReturnType<T["useValue"]>;
};
export const FieldInput = memo(
  forwardRef(
    <T extends FieldLikeAny>(
      { field, onChange, noValidation, valueFormatter, ...props }: InputProps<T>,
      ref: ForwardedRef<HTMLInputElement>
    ) => {
      const value = useStore(field.store, (v) => v.value as never);

      useEffect(() => {
        field.mount();
        return () => field.unmount();
      }, [field]);

      function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        field.set(valueFormatter ? valueFormatter(e.target.value) : e.target.value, { noValidation });
        onChange?.(e);
      }

      return <Input ref={ref} value={value ?? ""} {...props} onChange={handleChange} />;
    }
  )
);

export const FieldError = memo(function Error<T extends FieldLikeAny>({
  field,
  className,
  beforeError = "info",
  info,
  children,
  ...props
}: React.InputHTMLAttributes<HTMLParagraphElement> & {
  field: T;
  beforeError?: "info" | "warn" | "error";
  children?: React.ReactNode;
  info?: ReactNode;
}) {
  const error = useStore(field.store, (v) => v.error);
  const maxLevel = field.formStatus === "errored" ? "error" : beforeError;

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

export const FieldInfo = memo(function Error<T extends FieldLikeAny>({
  field,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLParagraphElement> & { field: T }) {
  return (
    <p {...props} className={cn("text-sm text-slate-500", className)}>
      Mounted: {field.isMounted.toString()} - Dirty: {field.isDirty.toString()} - Form Status: {field.formStatus}
    </p>
  );
});

export const UnmountedErrors = memo(function UnmountedErrors<T extends FormLike<FormLikeAny>>({
  form,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLParagraphElement>, "form"> & { form: T }) {
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
