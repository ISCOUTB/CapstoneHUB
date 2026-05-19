import Link from "next/link";

type SubmitCardProps = {
  title: string;
  description: string;
  href?: string;
  disabled?: boolean;
};

export default function SubmitCard({
  title,
  description,
  href,
  disabled = false,
}: SubmitCardProps) {
  const card = (
    <div
      className={`mb-6 border border-blue-200 bg-blue-50 p-5 transition ${
        disabled ? "opacity-60" : "hover:shadow-sm"
      }`}
    >
      <div>
        <p className="text-2xl">{title}</p>
      </div>
      <div>{description}</div>
    </div>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  return <div aria-disabled={disabled}>{card}</div>;
}
