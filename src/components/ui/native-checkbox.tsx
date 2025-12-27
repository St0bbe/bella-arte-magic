import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface NativeCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * A native HTML checkbox with custom styling.
 * This component avoids the ref-related infinite loop issues that can occur
 * with Radix UI's Checkbox component when used inside clickable containers.
 */
const NativeCheckbox = React.forwardRef<HTMLInputElement, NativeCheckboxProps>(
  ({ className, checked, onChange, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label
        className={cn(
          "relative inline-flex items-center justify-center h-4 w-4 shrink-0 cursor-pointer",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "h-4 w-4 rounded-sm border border-primary ring-offset-background transition-colors",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            checked
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-primary/40"
          )}
        >
          {checked && (
            <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
          )}
        </span>
      </label>
    );
  }
);

NativeCheckbox.displayName = "NativeCheckbox";

export { NativeCheckbox };
