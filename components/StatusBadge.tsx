type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  let style = "bg-zinc-100 text-zinc-700";
  if (
    normalized.includes("sangat") ||
    normalized.includes("baik") ||
    normalized.includes("sehat")
  ) {
    style = "bg-emerald-100 text-emerald-700";
  } else if (normalized.includes("waspada") || normalized.includes("sedang")) {
    style = "bg-amber-100 text-amber-700";
  } else if (normalized.includes("buruk") || normalized.includes("risiko")) {
    style = "bg-rose-100 text-rose-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}
