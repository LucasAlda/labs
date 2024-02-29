import { type FormLikeAny, type FieldLikeAny, type FormLike } from "@/formlike/hooks";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { forwardRef, memo, type ForwardedRef, useEffect } from "react";

export type InputProps<T extends FieldLikeAny> = React.InputHTMLAttributes<HTMLInputElement> & {
  field: T;
  valueFormatter?: (value: string) => ReturnType<T["get"]>;
};
export const FieldInput = memo(
  forwardRef(
    <T extends FieldLikeAny>(
      { field, onChange, valueFormatter, ...props }: InputProps<T>,
      ref: ForwardedRef<HTMLInputElement>
    ) => {
      useEffect(() => {
        field.mount();
        return () => field.unmount();
      }, [field]);

      function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        field.set(valueFormatter ? valueFormatter(e.target.value) : e.target.value);
        onChange?.(e);
      }

      return <Input {...props} ref={ref} onChange={handleChange} value={(field.get() as never) ?? ""} />;
    }
  )
);

export const FieldError = memo(function Error<T extends FieldLikeAny>({
  field,
  className,
  show = "errored",
  children,
  ...props
}: React.InputHTMLAttributes<HTMLParagraphElement> & {
  field: T;
  show?: "allways" | "errored";
  children?: React.ReactNode;
}) {
  const error = field.error();
  return (
    <p {...props} className={cn("text-sm text-red-500", className)}>
      {show === "errored" && field.formStatus === "errored" && error ? children ?? error : ""}
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
  return Object.entries(form.unmountedErrors()).map(([key, error]) => (
    <p {...props} key={key} className={cn("text-sm text-red-500", className)}>
      {error}
    </p>
  ));
});
