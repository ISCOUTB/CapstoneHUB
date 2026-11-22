"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ListPaginationProps = {
  readonly id: string;
  readonly pageIndex: number;
  readonly pageCount: number;
  readonly onPageChange: (pageIndex: number) => void;
};

/** Paginación numérica reutilizable para listados y galerías. */
export default function ListPagination({
  id,
  pageIndex,
  pageCount,
  onPageChange,
}: ListPaginationProps) {
  const [pageDraft, setPageDraft] = useState<string | null>(null);
  const currentPage = Math.min(pageIndex + 1, pageCount);

  function commitPage() {
    const parsed = Number.parseInt(pageDraft ?? "", 10);

    if (Number.isNaN(parsed)) {
      setPageDraft(null);
      return;
    }

    onPageChange(Math.min(Math.max(parsed, 1), pageCount) - 1);
    setPageDraft(null);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <label htmlFor={id}>Página</label>

        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={pageCount}
          value={pageDraft ?? String(currentPage)}
          onChange={(event) => setPageDraft(event.target.value)}
          onBlur={commitPage}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitPage();
            }
          }}
          className="h-7 w-14 px-1 text-center"
        />

        <span>de {pageCount}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex <= 0}
        >
          Anterior
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
