"use client";

import { useId, useState } from "react";
import { RiArrowDownSLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type FilterOption = {
  readonly value: string;
  readonly label: string;
};

type FilterPopoverProps = {
  readonly label: string;
  readonly options: readonly FilterOption[];
  readonly selected: string[];
  readonly onChange: (selected: string[]) => void;
  readonly searchable?: boolean;
};

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}

/** Popover de selección múltiple reutilizable para filtros de listados. */
export default function FilterPopover({
  label,
  options,
  selected,
  onChange,
  searchable = false,
}: FilterPopoverProps) {
  const id = useId();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const visibleOptions = normalizedQuery
    ? options.filter((option) =>
        option.label.toLowerCase().includes(normalizedQuery),
      )
    : options;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-8 gap-1.5 px-2.5 font-normal"
          />
        }
      >
        <span>{label}</span>

        {selected.length > 0 ? (
          <Badge
            variant="secondary"
            className="h-5 min-w-5 rounded-full px-1.5 text-[10px]"
          >
            {selected.length}
          </Badge>
        ) : null}

        <RiArrowDownSLine
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
            {label}
          </span>

          {selected.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onChange([])}
            >
              Limpiar
            </Button>
          ) : null}
        </div>

        {searchable ? (
          <div className="border-b border-border p-2">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              aria-label={`Buscar ${label.toLowerCase()}`}
              className="h-7"
            />
          </div>
        ) : null}

        <div className="max-h-64 overflow-y-auto p-1">
          {visibleOptions.length > 0 ? (
            visibleOptions.map((option, index) => (
              <div
                key={option.value}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
              >
                <Checkbox
                  id={`${id}-${index}`}
                  checked={selected.includes(option.value)}
                  onCheckedChange={() =>
                    onChange(toggleValue(selected, option.value))
                  }
                />

                <label
                  htmlFor={`${id}-${index}`}
                  className="min-w-0 flex-1 cursor-pointer truncate text-sm"
                >
                  {option.label}
                </label>
              </div>
            ))
          ) : (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              Sin opciones.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
