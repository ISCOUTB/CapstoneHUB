import Link from "next/link";
import {
  RiAdminLine,
  RiArrowRightLine,
  RiGraduationCapLine,
  RiShieldCheckLine,
  RiTeamLine,
  RiUserSettingsLine,
  RiUserStarLine,
} from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserRole } from "../services/roles";
import { formatRole } from "../services/utils";
import type { RoleManual } from "./role-manuals";

const ROLE_ICONS: Record<UserRole, typeof RiGraduationCapLine> = {
  student: RiGraduationCapLine,
  teacher: RiUserStarLine,
  evaluator: RiShieldCheckLine,
  directivo: RiUserSettingsLine,
  admin: RiAdminLine,
  proposer: RiTeamLine,
};

export function RoleIcon({
  role,
  className,
}: Readonly<{ role: UserRole; className?: string }>) {
  const Icon = ROLE_ICONS[role];

  return <Icon className={className} aria-hidden="true" />;
}

type RoleManualSummaryCardProps = {
  manual: RoleManual;
  onSelect: () => void;
};

/** Tarjeta compacta que aparece en la vista «Todos» y abre el manual del rol. */
export function RoleManualSummaryCard({
  manual,
  onSelect,
}: Readonly<RoleManualSummaryCardProps>) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-utb-blue/10 text-utb-blue">
            <RoleIcon role={manual.role} className="size-5" />
          </span>

          <div className="min-w-0">
            <CardTitle>{manual.title}</CardTitle>
            <CardDescription>{formatRole(manual.role)}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">{manual.summary}</p>
      </CardContent>

      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onSelect}>
          Ver manual
          <RiArrowRightLine data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/** Manual completo que encabeza cada pestaña de rol. */
export default function RoleManualCard({
  manual,
}: Readonly<{ manual: RoleManual }>) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-utb-blue/10 text-utb-blue">
              <RoleIcon role={manual.role} className="size-5.5" />
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.18em] text-utb-blue uppercase">
                Manual de usuario
              </p>
              <CardTitle className="mt-1">{manual.title}</CardTitle>
              <CardDescription>{manual.summary}</CardDescription>
            </div>
          </div>

          <Badge variant="outline">{formatRole(manual.role)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {manual.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-border/70 bg-muted/20 p-4"
            >
              <h3 className="text-sm font-semibold">{section.title}</h3>

              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-2 text-sm leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets?.length ? (
                <ul className="mt-2 space-y-1.5 pl-4 text-sm text-muted-foreground">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="list-disc">
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {manual.quickLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            {manual.quickLinks.map((link) => (
              <Button
                key={link.href}
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={link.href} />}
              >
                {link.label}
                <RiArrowRightLine data-icon="inline-end" />
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
