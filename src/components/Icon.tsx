export function Icon({
  name,
  fill = false,
  size,
  className,
}: {
  name: string;
  fill?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={["ms", fill ? "fill" : "", className].filter(Boolean).join(" ")}
      aria-hidden="true"
      style={size ? { fontSize: size } : undefined}
    >
      {name}
    </span>
  );
}
