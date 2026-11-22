import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_KEYS = [
  "skeleton-a",
  "skeleton-b",
  "skeleton-c",
  "skeleton-d",
  "skeleton-e",
  "skeleton-f",
] as const;

export default function GallerySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SKELETON_KEYS.map((key) => (
        <Skeleton key={key} className="h-48 w-full rounded-2xl" />
      ))}
    </div>
  );
}
