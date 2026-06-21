"use client";

import { CalendarDays } from "lucide-react";
import { useRef } from "react";

type NativeDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  type?: "date" | "datetime-local" | "time";
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function NativeDateInput({
  value,
  onChange,
  type = "date",
  min,
  max,
  disabled = false,
  required = false,
  className = "",
  ariaLabel = "اختيار التاريخ",
}: NativeDateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const input = inputRef.current;
    if (!input || disabled) return;

    input.focus();
    try {
      input.showPicker?.();
    } catch {
      // The browser will still use the native picker when the input is focused.
    }
  }

  return (
    <div className="relative min-w-0">
      <input
        ref={inputRef}
        type={type}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        dir="ltr"
        onClick={openPicker}
        onChange={(event) => onChange(event.target.value)}
        className={`elite-date-input v8-input w-full min-w-0 rounded border px-3 py-2.5 pe-11 text-sm ${className}`}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        aria-label={ariaLabel}
        className="absolute end-1 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CalendarDays className="h-4 w-4" />
      </button>
    </div>
  );
}
