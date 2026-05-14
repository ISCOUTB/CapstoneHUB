import Link from "next/link";

export default function SubmmitCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Link href="/">
      <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div>
          <p className="text-2xl">{title}</p>
        </div>
        <div>{description}</div>
      </div>
    </Link>
  );
}
