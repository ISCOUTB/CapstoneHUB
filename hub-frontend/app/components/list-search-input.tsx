"use client";

import { RiSearchLine } from "@remixicon/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ListSearchInputProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder: string;
  readonly ariaLabel: string;
  readonly className?: string;
};

/** Campo de búsqueda reutilizable para listados y galerías. */
export default function ListSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: ListSearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <RiSearchLine
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />

      <Input
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-8"
      />
    </div>
  );
}
