import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "../utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, required, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-semibold text-abyssal-blue">
            {label}
            {required && <span className="text-truffle-trouble"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 rounded-lg bg-palladian px-3 text-sm text-abyssal-blue outline-none transition-colors",
            "border focus:border-2 focus:border-blue-fantastic focus:bg-white",
            error ? "border-2 border-truffle-trouble" : "border-oatmeal",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[11px] font-medium text-truffle-trouble">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";