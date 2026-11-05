"use client";

import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectProgramSchool } from "../services/schemas";

type ProgramRequirementItem = {
  id: string;
  programId: string;
  studentCount: string;
  programName?: string;
  schoolName?: string;
};

type ProjectProgramRequirementsProps = {
  items: ProgramRequirementItem[];
  schools: ProjectProgramSchool[];
  idPrefix: string;
  disabled?: boolean;
  invalid?: boolean;
  onProgramChange: (
    id: string,
    program: {
      programId: string;
      programName: string;
      schoolName: string;
    },
  ) => void;
  onStudentCountChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
};

export default function ProjectProgramRequirements({
  items,
  schools,
  idPrefix,
  disabled = false,
  invalid = false,
  onProgramChange,
  onStudentCountChange,
  onRemove,
  onAdd,
}: ProjectProgramRequirementsProps) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const selectedProgram = schools
          .flatMap((school) =>
            school.programs.map((program) => ({
              ...program,
              schoolName: school.name,
            })),
          )
          .find((program) => program.id === item.programId);

        const invalidCount =
          invalid &&
          (!item.studentCount.trim() ||
            !Number.isInteger(Number(item.studentCount)) ||
            Number(item.studentCount) < 1);

        return (
          <div
            key={item.id}
            className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end"
          >
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-program-${item.id}`}>
                Programa {index + 1}
              </FieldLabel>
              <Select
                value={item.programId}
                onValueChange={(value) => {
                  if (value === null) return;

                  const program = schools
                    .flatMap((school) =>
                      school.programs.map((entry) => ({
                        ...entry,
                        schoolName: school.name,
                      })),
                    )
                    .find((entry) => entry.id === value);

                  onProgramChange(item.id, {
                    programId: value,
                    programName: program?.name ?? value,
                    schoolName: program?.schoolName ?? "",
                  });
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  id={`${idPrefix}-program-${item.id}`}
                  className={`w-full ${
                    invalid && !item.programId
                      ? "border-destructive focus:ring-destructive"
                      : ""
                  }`}
                  aria-invalid={Boolean(invalid && !item.programId)}
                >
                  <SelectValue placeholder="Selecciona un programa">
                    {selectedProgram
                      ? `${selectedProgram.name} — ${selectedProgram.schoolName}`
                      : item.programName
                        ? `${item.programName} — ${item.schoolName ?? ""}`
                        : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) =>
                    school.programs.map((program) => {
                      const selectedElsewhere = items.some(
                        (other) =>
                          other.programId === program.id &&
                          other.id !== item.id,
                      );

                      return (
                        <SelectItem
                          key={program.id}
                          value={program.id}
                          disabled={selectedElsewhere}
                        >
                          {program.name} — {school.name}
                        </SelectItem>
                      );
                    }),
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor={`${idPrefix}-students-${item.id}`}>
                Estudiantes
              </FieldLabel>
              <Input
                id={`${idPrefix}-students-${item.id}`}
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={item.studentCount}
                aria-invalid={Boolean(invalidCount)}
                className={
                  invalidCount
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                onChange={(event) =>
                  onStudentCountChange(item.id, event.target.value)
                }
                disabled={disabled}
              />
            </Field>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onRemove(item.id)}
              aria-label={`Eliminar programa ${index + 1}`}
              disabled={disabled}
            >
              <RiDeleteBinLine />
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="w-fit"
        onClick={onAdd}
        disabled={disabled || items.length >= 4}
      >
        <RiAddLine data-icon="inline-start" />
        Agregar programa
      </Button>
    </div>
  );
}
