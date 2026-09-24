import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDetailsSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-24 w-full rounded-3xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </section>
  );
}
