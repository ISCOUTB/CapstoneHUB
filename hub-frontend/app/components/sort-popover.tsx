"use client";

import { useState } from "react";
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type SortOption<T extends string> = {
  readonly value: T;
  readonly label: string;
};

type SortPopoverProps<T extends string> = {
  readonly value: T;
  readonly options: readonly SortOption<T>[];
  readonly onChange: (value: T) => void;
  readonly placeholder?: string;
  readonly placeholderValue?: T;
  readonly title?: string;
};

/** Popover de orden reutilizable para listados y galerías. */
export default function SortPopover<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Ordenar",
  placeholderValue,
  title = "Ordenar por",
}: SortPopoverProps<T>) {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;
  const showPlaceholder =
    placeholderValue !== undefined && value === placeholderValue;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-8 gap-1.5 px-2.5 font-normal"
          />
        }
      >
        <span>{showPlaceholder ? placeholder : selectedLabel}</span>

        <RiArrowDownSLine
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-56 p-1">
        <p className="px-2 py-1.5 text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          {title}
        </p>

        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            className="h-8 w-full justify-between px-2 font-normal"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            {option.label}

            {value === option.value ? (
              <RiCheckLine
                className="size-4 text-utb-blue"
                aria-hidden="true"
              />
            ) : null}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
