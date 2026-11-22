import { Skeleton } from "@/components/ui/skeleton";

type GallerySkeletonProps = {
  readonly count?: number;
};

export default function GallerySkeleton({
  count = 6,
}: GallerySkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-48 w-full rounded-2xl" />
      ))}
    </div>
  );
}
