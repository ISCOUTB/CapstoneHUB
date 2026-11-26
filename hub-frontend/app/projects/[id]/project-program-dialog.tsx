"use client";

import { useEffect, useMemo, useState } from "react";
import { RiSearchLine } from "@remixicon/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export type ProjectProgramOption = {
  readonly programId: string;
  readonly programName: string;
  readonly schoolName: string;
};

type ProjectProgramDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly options: readonly ProjectProgramOption[];
  readonly existingProgramIds: readonly string[];
  readonly remainingSlots: number;
  readonly onSave: (
    programs: { programId: string; studentCount: number }[],
  ) => Promise<void>;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function groupBySchool(
  options: readonly ProjectProgramOption[],
): { schoolName: string; programs: ProjectProgramOption[] }[] {
  const groups = new Map<string, ProjectProgramOption[]>();

  for (const option of options) {
    const programs = groups.get(option.schoolName) ?? [];
    programs.push(option);
    groups.set(option.schoolName, programs);
  }

  return [...groups.entries()].map(([schoolName, programs]) => ({
    schoolName,
    programs,
  }));
}

/**
 * Diálogo para asociar varios programas al proyecto. La selección y la
 * cantidad de estudiantes se guardan en una sola petición al confirmar.
 */
export default function ProjectProgramDialog({
  open,
  onOpenChange,
  options,
  existingProgramIds,
  remainingSlots,
  onSave,
}: ProjectProgramDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearch("");
    setSelected({});
    setErrorMessage(null);
    setSaving(false);
  }, [open]);

  const existingIds = useMemo(
    () => new Set(existingProgramIds),
    [existingProgramIds],
  );

  const filteredOptions = useMemo(() => {
    const normalizedSearch = normalize(search.trim());

    if (!normalizedSearch) {
      return options;
    }

    return options.filter(
      (option) =>
        normalize(option.programName).includes(normalizedSearch) ||
        normalize(option.schoolName).includes(normalizedSearch),
    );
  }, [options, search]);

  const groups = useMemo(
    () => groupBySchool(filteredOptions),
    [filteredOptions],
  );
  const selectedCount = Object.keys(selected).length;
  const slotsLeft = Math.max(0, remainingSlots - selectedCount);

  function toggleProgram(option: ProjectProgramOption, checked: boolean) {
    setErrorMessage(null);

    if (checked && slotsLeft === 0) {
      setErrorMessage(
        "Puedes agregar hasta 4 programas por proyecto. Quita uno para seleccionar otro.",
      );
      return;
    }

    setSelected((previous) => {
      if (!checked) {
        const next = { ...previous };
        delete next[option.programId];
        return next;
      }

      return {
        ...previous,
        [option.programId]: previous[option.programId] ?? "1",
      };
    });
  }

  function updateStudentCount(programId: string, value: string) {
    setErrorMessage(null);
    setSelected((previous) => ({ ...previous, [programId]: value }));
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const entries = Object.entries(selected);

    if (entries.length === 0) {
      setErrorMessage("Selecciona al menos un programa.");
      return;
    }

    if (entries.length > remainingSlots) {
      setErrorMessage(
        "Puedes agregar hasta 4 programas por proyecto. Quita uno para seleccionar otro.",
      );
      return;
    }

    const invalid = entries.find(([, studentCount]) => {
      const parsed = Number(studentCount);
      return !Number.isInteger(parsed) || parsed < 1;
    });

    if (invalid) {
      setErrorMessage(
        "La cantidad de estudiantes debe ser un entero mayor a 0 en cada programa.",
      );
      return;
    }

    setSaving(true);

    try {
      await onSave(
        entries.map(([programId, studentCount]) => ({
          programId,
          studentCount: Number(studentCount),
        })),
      );
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron agregar los programas.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saving) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Agregar programas</DialogTitle>
          <DialogDescription>
            Busca y selecciona los programas que requiere el proyecto. Asigna la
            cantidad de estudiantes de cada uno antes de guardar.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="relative">
            <label htmlFor="program-search" className="sr-only">
              Filtrar programas
            </label>
            <RiSearchLine
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="program-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filtrar por programa o escuela..."
              className="pl-8"
              disabled={saving}
            />
          </div>

          {remainingSlots === 0 ? (
            <Alert>
              <AlertDescription>
                El proyecto ya tiene el máximo de 4 programas. Quita uno para
                poder agregar otro.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="max-h-[min(24rem,50vh)] overflow-y-auto pr-1">
            {groups.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                No hay programas que coincidan con la búsqueda.
              </p>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <section key={group.schoolName} className="space-y-2">
                    <h3 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {group.schoolName}
                    </h3>

                    <div className="space-y-1">
                      {group.programs.map((option) => {
                        const isExisting = existingIds.has(option.programId);
                        const isSelected =
                          selected[option.programId] !== undefined;

                        return (
                          <div
                            key={option.programId}
                            className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                          >
                            <label
                              htmlFor={`program-option-${option.programId}`}
                              className="flex min-w-0 flex-1 items-center gap-2"
                            >
                              <Checkbox
                                id={`program-option-${option.programId}`}
                                checked={isExisting || isSelected}
                                onCheckedChange={(checked) =>
                                  toggleProgram(option, checked === true)
                                }
                                disabled={
                                  isExisting ||
                                  saving ||
                                  (!isSelected && slotsLeft === 0)
                                }
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium">
                                  {option.programName}
                                </span>
                                {isExisting ? (
                                  <span className="block text-xs text-muted-foreground">
                                    Ya asociado al proyecto
                                  </span>
                                ) : null}
                              </span>
                            </label>

                            {isSelected ? (
                              <div className="w-24">
                                <label
                                  htmlFor={`program-students-${option.programId}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Estudiantes
                                </label>
                                <Input
                                  id={`program-students-${option.programId}`}
                                  type="number"
                                  min={1}
                                  value={selected[option.programId] ?? "1"}
                                  onChange={(event) =>
                                    updateStudentCount(
                                      option.programId,
                                      event.target.value,
                                    )
                                  }
                                  disabled={saving}
                                />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {selectedCount === 0
              ? "Ningún programa seleccionado."
              : `${selectedCount} programa(s) seleccionado(s).`}
          </p>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || selectedCount === 0}>
              {saving ? <Spinner data-icon="inline-start" /> : null}
              {saving ? "Guardando..." : "Guardar programas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
