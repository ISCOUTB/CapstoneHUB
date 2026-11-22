"use client";

import { Checkbox } from "@/components/ui/checkbox";

type FilterCheckboxProps = {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
};

/** Casilla con etiqueta para los paneles de filtros rápidos. */
export default function FilterCheckbox({
  id,
  label,
  checked,
  onChange,
}: FilterCheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />

      <label
        htmlFor={id}
        className="cursor-pointer text-sm text-foreground"
      >
        {label}
      </label>
    </div>
  );
}
