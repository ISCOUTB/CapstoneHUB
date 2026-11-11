import {
  RiBookOpenLine,
  RiDownloadLine,
  RiExternalLinkLine,
  RiFileExcelLine,
  RiFileLine,
  RiFileList3Line,
  RiFilePdfLine,
  RiFilePptLine,
  RiFileTextLine,
  RiFileWordLine,
  RiFileZipLine,
  RiHourglassLine,
  RiLinksLine,
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
import {
  formatGuideAudiences,
  formatGuideCategory,
  formatGuideFileSize,
  guideDownloadHref,
  guideFileKind,
  type GuideDocumentItem,
  type GuideFileKind,
} from "../services/guides";

const FILE_ICONS: Record<GuideFileKind, typeof RiFileLine> = {
  pdf: RiFilePdfLine,
  word: RiFileWordLine,
  excel: RiFileExcelLine,
  powerpoint: RiFilePptLine,
  zip: RiFileZipLine,
  file: RiFileLine,
  link: RiLinksLine,
  none: RiHourglassLine,
};

const FILE_LABELS: Record<GuideFileKind, string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
  powerpoint: "PowerPoint",
  zip: "ZIP",
  file: "Archivo",
  link: "Enlace",
  none: "Próximamente",
};

const CATEGORY_ICONS = {
  format: RiFileTextLine,
  template: RiFileList3Line,
  guide: RiBookOpenLine,
} as const;

export default function GuideDocumentCard({
  document,
}: Readonly<{ document: GuideDocumentItem }>) {
  const kind = guideFileKind(document);
  const FileIcon = FILE_ICONS[kind];
  const CategoryIcon = CATEGORY_ICONS[document.category];
  const size = formatGuideFileSize(document.sizeBytes);

  return (
    <Card className="hover-lift flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-utb-blue/10 text-utb-blue">
            <FileIcon className="size-5" aria-hidden="true" />
          </span>

          <Badge variant="outline">{FILE_LABELS[kind]}</Badge>
        </div>

        <CardTitle className="mt-1 line-clamp-2">{document.title}</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <CategoryIcon className="size-3.5" aria-hidden="true" />
          {formatGuideCategory(document.category)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {document.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {document.description}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="secondary">
            {formatGuideAudiences(document.audiences)}
          </Badge>
          {size ? <Badge variant="outline">{size}</Badge> : null}
        </div>
      </CardContent>

      <CardFooter>
        {document.hasFile ? (
          <Button
            className="w-full"
            nativeButton={false}
            render={
              <a
                href={guideDownloadHref(document.id)}
                aria-label={`Descargar ${document.title}`}
              />
            }
          >
            <RiDownloadLine data-icon="inline-start" />
            Descargar
          </Button>
        ) : document.externalUrl ? (
          <Button
            className="w-full"
            nativeButton={false}
            render={
              <a
                href={document.externalUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`${document.title} (se abre en una pestaña nueva)`}
              />
            }
          >
            <RiExternalLinkLine data-icon="inline-start" />
            Abrir enlace
          </Button>
        ) : (
          <Button className="w-full" variant="outline" disabled>
            <RiHourglassLine data-icon="inline-start" />
            Próximamente
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
