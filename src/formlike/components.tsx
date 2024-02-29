import { type FieldLikeAny } from "@/formlike/use-formlike";
import { cn } from "@/lib/utils";
import { forwardRef, memo, type ForwardedRef, useEffect } from "react";

export type InputProps<T extends FieldLikeAny> = React.InputHTMLAttributes<HTMLInputElement> & {
  field: T;
  valueFormatter?: (value: string) => ReturnType<T["get"]>;
};
export const Input = memo(
  forwardRef(
    <T extends FieldLikeAny>(
      { field, onChange, valueFormatter, className, ...props }: InputProps<T>,
      ref: ForwardedRef<HTMLInputElement>
    ) => {
      useEffect(() => {
        field.mount();
        return () => field.unmount();
      }, [field]);

      function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        field.set(valueFormatter ? valueFormatter(e.target.value) : e.target.value);
        field.setError(e.target.value.length > 12 ? "BUeeee que tanto vas a escribir" : undefined);
        onChange?.(e);
      }

      return (
        <input
          {...props}
          ref={ref}
          className={cn("block rounded border border-slate-300 p-1 px-2", className)}
          onChange={handleChange}
          value={(field.get() as never) ?? ""}
        />
      );
    }
  )
);

export const Error = memo(function Error<T extends FieldLikeAny>({
  field,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLParagraphElement> & { field: T }) {
  return (
    <p {...props} className={cn("text-sm text-red-500", className)}>
      {field.error()} - Mounted: {field.isMounted.toString()} - Dirty: {field.isDirty.toString()}
    </p>
  );
});
