import React, { useRef, useImperativeHandle } from "react";
import { cn, formatThousandsInput, parseThousandsInput } from "@/lib/utils";

export interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string | number;
  onChange: (value: string, numericValue: number) => void;
  className?: string;
  prefix?: string;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, className, prefix, placeholder = "0,00", ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const displayValue = formatThousandsInput(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const raw = input.value;
      const oldVal = displayValue;
      const selStart = input.selectionStart ?? raw.length;

      // Cantidad de dígitos hasta la posición actual del cursor antes de formatear
      const digitsBeforeCursor = raw.slice(0, selStart).replace(/\D/g, "").length;

      // Normalizar y formatear
      const formatted = formatThousandsInput(raw);
      const numeric = parseThousandsInput(formatted);

      onChange(formatted, numeric);

      // Restaurar la posición del cursor de manera natural relativa a los dígitos ingresados
      requestAnimationFrame(() => {
        if (!inputRef.current) return;
        let newPos = 0;
        let digitsCounted = 0;

        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) {
            digitsCounted++;
          }
          if (digitsCounted === digitsBeforeCursor) {
            newPos = i + 1;
            break;
          }
        }

        // Si estaba justo antes de la coma o después, no irse al final
        if (digitsBeforeCursor === 0) {
          newPos = 0;
        } else if (newPos === 0) {
          newPos = formatted.length;
        }

        inputRef.current.setSelectionRange(newPos, newPos);
      });
    };

    return (
      <div className="relative flex items-center w-full">
        {prefix && (
          <span className="absolute left-3 text-muted-foreground font-mono-data text-sm pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "flex h-10 w-full rounded-[10px] border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 font-mono-data",
            prefix && "pl-8",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

MoneyInput.displayName = "MoneyInput";
