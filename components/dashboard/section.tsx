import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { SectionHelp } from "@/components/dashboard/section-help";
import { BackButton } from "@/components/ui/back-button";
import { getVideoForPlacement } from "@/lib/videos/queries";
import type { VideoPlacement } from "@/lib/videos/types";

export async function DashboardSection({
  title,
  description,
  backHref = "/dashboard",
  helpPlacement,
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  helpPlacement?: VideoPlacement;
  children: ReactNode;
}) {
  const common = await getTranslations("common");
  const helpVideo = helpPlacement ? await getVideoForPlacement(helpPlacement) : null;

  return (
    <div className="dash-stagger animate-fade-in space-y-8">
      <BackButton href={backHref} label={common("back")} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">{description}</p> : null}
        </div>
        <SectionHelp video={helpVideo} />
      </div>
      {children}
    </div>
  );
}
