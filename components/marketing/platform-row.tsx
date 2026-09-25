const logos = [
  { name: "Meta", src: "/brands/meta.svg", glow: "8, 102, 255", status: "live" },
  { name: "TikTok", src: "/brands/tiktok.svg", glow: "0, 0, 0", status: "soon" },
  { name: "Google", src: "/brands/google.svg", glow: "66, 133, 244", status: "soon" },
  { name: "WooCommerce", src: "/brands/woocommerce.svg", glow: "127, 84, 179", status: "live" },
  { name: "Shopify", src: "/brands/shopify.svg", glow: "122, 181, 92", status: "none" },
  { name: "YouCan", src: "/brands/youcan.svg", glow: "226, 59, 47", status: "none" },
  { name: "Instagram", src: "/brands/instagram.svg", glow: "238, 42, 123", status: "none" },
  { name: "ChatGPT", src: "/brands/chatgpt.svg", glow: "16, 163, 127", status: "none" },
] as const;

export function PlatformRow({
  trusted,
  liveLabel,
  soonLabel,
}: {
  trusted: string;
  liveLabel: string;
  soonLabel: string;
}) {
  return (
    <div className="mx-auto mt-10 max-w-4xl">
      <ul className="grid grid-cols-4 justify-items-center gap-3 md:grid-cols-8">
        {logos.map((logo, index) => (
          <li key={logo.name} className="logo-bob w-full" style={{ animationDelay: `${index * 120}ms` }}>
            <span
              className="brand-card relative"
              style={{ ["--glow" as string]: logo.glow, animationDelay: `${index * 80}ms` }}
              title={logo.name}
            >
              <span className="brand-mark" style={{ backgroundImage: `url(${logo.src})` }} />
              <span className="sr-only">{logo.name}</span>
              {logo.status === "live" ? <span className="brand-badge brand-badge-live">{liveLabel}</span> : null}
              {logo.status === "soon" ? <span className="brand-badge brand-badge-soon">{soonLabel}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-xs tracking-[0.14em] text-muted uppercase sm:text-sm">{trusted}</p>
    </div>
  );
}
