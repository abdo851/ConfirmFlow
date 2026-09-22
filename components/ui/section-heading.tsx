interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-start";

  return (
    <div className={`max-w-2xl ${alignment}`}>
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.16em] text-secondary uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-2xl leading-[1.15] font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}
