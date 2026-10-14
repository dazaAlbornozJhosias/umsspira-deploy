import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "h-11 px-6 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          variant === "primary" &&
            "bg-blue-fantastic text-white hover:bg-abyssal-blue",
          variant === "secondary" &&
            "bg-palladian text-abyssal-blue border border-oatmeal hover:bg-oatmeal",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
