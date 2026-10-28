import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import ModuleHeader from "./module-header";
import UserActionTabs from "./user-action-tabs";

type PageFrameProps = {
  eyebrow?: string;
  title: ReactNode;
  accentColor?: string;
  teamSize?: number;
  maxWidth?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Chrome de las páginas internas: statusbar pegado bajo la navbar, pestañas de
 * acciones de usuario y contenido. Solo la navbar es sticky.
 */
export default function PageFrame({
  eyebrow,
  title,
  accentColor,
  teamSize,
  maxWidth = "max-w-[96rem]",
  className,
  children,
}: Readonly<PageFrameProps>) {
  return (
    <main className="flex-1 text-foreground">
      <div className="border-b border-border/60 bg-card">
        <div className="mx-auto w-full max-w-[96rem] px-4 py-3 sm:px-6 lg:px-8">
          <ModuleHeader
            eyebrow={eyebrow}
            title={title}
            accentColor={accentColor}
            teamSize={teamSize}
          />
        </div>
      </div>

      <UserActionTabs />

      <section
        className={cn(
          "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8",
          maxWidth,
          className,
        )}
      >
        {children}
      </section>
    </main>
  );
}
