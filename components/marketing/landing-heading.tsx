export function LandingHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl leading-tight font-bold tracking-tight lg:text-4xl">{title}</h2>
      {description ? <p className="mx-auto mt-3 max-w-2xl text-lg text-muted">{description}</p> : null}
    </div>
  );
}
