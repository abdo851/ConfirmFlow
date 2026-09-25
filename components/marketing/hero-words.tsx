export function HeroWords({
  text,
  className = "",
  wordClassName = "",
}: {
  text: string;
  className?: string;
  wordClassName?: string;
}) {
  const words = text.trim().split(/\s+/).filter(Boolean);

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={`hero-word ${wordClassName}`}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          {word}{" "}
        </span>
      ))}
    </span>
  );
}
