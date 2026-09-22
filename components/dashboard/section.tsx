import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { BackButton } from "@/components/ui/back-button";

export async function DashboardSection({
  title,
  description,
  backHref = "/dashboard",
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  children: ReactNode;
}) {
  const common = await getTranslations("common");

  return (
    <div className="animate-fade-in space-y-6">
      <BackButton href={backHref} label={common("back")} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
