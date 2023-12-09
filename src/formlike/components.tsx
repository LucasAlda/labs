import { type FieldLikeAny } from "@/formlike/use-formlike";
import { cn } from "@/lib/utils";
import { forwardRef, memo, type ForwardedRef } from "react";
import { useWhyDidYouUpdate } from "use-why-did-you-update";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { field: FieldLikeAny };
export const Input = memo(
  forwardRef(({ field, onChange, className, ...props }: InputProps, ref: ForwardedRef<HTMLInputElement>) => {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      field.set(e.target.value);
      field.setError(e.target.value.length > 10 ? "Phone number is too long" : undefined);
      onChange?.(e);
    }

    useWhyDidYouUpdate("Input", { field, onChange, className, ...props });

    return (
      <input
        {...props}
        ref={ref}
        className={cn("block rounded border border-slate-300 p-1 px-2", className)}
        onChange={handleChange}
        value={field.get() as never}
      />
    );
  })
);
