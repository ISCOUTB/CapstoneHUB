"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PageHeader = {
  /** Categoría/contexto de la página. Ej: "Administración". */
  eyebrow?: string;
  title: string;
  /** Color del acento lateral que identifica el módulo. */
  accentColor?: string;
  /** Personas asignadas al equipo del proyecto. */
  teamSize?: number;
};

type PageHeaderContextValue = {
  header: PageHeader | null;
  setHeader: (header: PageHeader | null) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

// En el servidor `useLayoutEffect` no se ejecuta; usar `useEffect` evita el
// warning de React y mantiene el mismo comportamiento en el cliente.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Guarda el header del módulo activo para que el topbar pueda renderizarlo.
 * `PageFrame` es quien lo publica; el topbar solo consume.
 */
export function PageHeaderProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [header, setHeader] = useState<PageHeader | null>(null);

  const value = useMemo<PageHeaderContextValue>(
    () => ({ header, setHeader }),
    [header],
  );

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);

  if (!context) {
    throw new Error("usePageHeader must be used within PageHeaderProvider");
  }

  return context;
}

/**
 * Publica el header mientras la pantalla está montada y lo limpia al salir.
 * Se ejecuta en un layout effect para que el topbar se actualice antes del
 * paint en las navegaciones del cliente.
 */
export function PageHeaderSync({
  eyebrow,
  title,
  accentColor,
  teamSize,
}: Readonly<PageHeader>) {
  const { setHeader } = usePageHeader();

  useIsomorphicLayoutEffect(() => {
    setHeader({ eyebrow, title, accentColor, teamSize });

    return () => setHeader(null);
  }, [accentColor, eyebrow, setHeader, teamSize, title]);

  return null;
}
