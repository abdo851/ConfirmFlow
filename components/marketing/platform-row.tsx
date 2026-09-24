const logos = [
  { name: "Meta", delay: "0s", icon: MetaIcon },
  { name: "TikTok", delay: "0.2s", icon: TikTokIcon },
  { name: "Google", delay: "0.4s", icon: GoogleIcon },
  { name: "WooCommerce", delay: "0.6s", icon: WooIcon },
  { name: "Shopify", delay: "0.8s", icon: ShopifyIcon },
  { name: "YouCan", delay: "1s", icon: YouCanIcon },
  { name: "ChatGPT", delay: "1.2s", icon: ChatIcon },
  { name: "Instagram", delay: "1.4s", icon: InstagramIcon },
] as const;

export function PlatformRow() {
  return (
    <ul className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center justify-center gap-4 sm:gap-6">
      {logos.map((logo) => (
        <li key={logo.name} className="logo-bob" style={{ animationDelay: logo.delay }}>
          <span className="logo-glow inline-flex size-16 items-center justify-center rounded-2xl bg-white shadow-medium sm:size-20" title={logo.name}>
            <logo.icon />
            <span className="sr-only">{logo.name}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function MetaIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden>
      <path
        fill="#0668E1"
        d="M14 34c-4.8-3.2-8-8.4-8-13.2C6 13.2 11.6 8 18.4 8c3.4 0 6.2 1.4 8.6 4.2C29.2 9.4 32 8 35.4 8 41.2 8 46 13 46 19.6c0 5.2-3.2 10.6-8.4 14.2-2.2 1.6-4.6 2.6-6.6 2.6-2.4 0-4.2-1.2-6-3.2-1.6 2-3.4 3.2-5.8 3.2-1.8 0-3.6-.8-5.2-2.4z"
      />
      <path fill="#fff" d="M18.6 16.2c-2.4 3.6-4.2 7.6-5.2 11.2 1.6 1.2 3.2 1.6 4.4 1.6 1.2 0 2.4-.8 4-3.2 1.4-2.2 2.4-4.6 3.2-6.8-1.6-2.2-3.4-3.2-5-3.2-.6 0-1 .1-1.4.4zm10.2-.2c-1.6 2.2-2.6 4.6-3.2 6.8 1.6 2.4 2.8 3.2 4 3.2 1.2 0 2.8-.4 4.4-1.6-1-3.6-2.8-7.6-5.2-11.2-.4-.3-.8-.4-1.4-.4-1.4 0-3 1-4 2.8.4-.1.8-.1 1.4.4z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden>
      <path fill="#25F4EE" d="M20 16v14.2a5.2 5.2 0 1 1-3.6-5V20.6A9.2 9.2 0 1 0 26 29.2V20.4c1.6 1.2 3.6 1.8 5.6 1.8V18c-2.4 0-4.4-.8-5.6-2h-6z" />
      <path fill="#FE2C55" d="M22 14v16.2a5.2 5.2 0 1 1-3.6-5V18.6A9.2 9.2 0 1 0 28 27.2V18.4c1.6 1.2 3.6 1.8 5.6 1.8V16c-2.4 0-4.4-.8-5.6-2h-6z" />
      <path fill="#111" d="M21 15v15.2a5.2 5.2 0 1 1-3.6-5V19.6A9.2 9.2 0 1 0 27 28.2V19.4c1.6 1.2 3.6 1.8 5.6 1.8V17c-2.4 0-4.4-.8-5.6-2h-6z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden>
      <path fill="#FFC107" d="M40.6 24.5c0-1.3-.1-2.5-.3-3.7H24v7h9.3a8 8 0 0 1-3.4 5.2v4.3h5.5c3.2-3 5.2-7.4 5.2-12.8z" />
      <path fill="#FF3D00" d="M24 42c4.4 0 8.1-1.5 10.8-4l-5.5-4.3c-1.5 1-3.4 1.6-5.3 1.6-4.1 0-7.6-2.8-8.8-6.5H9.5v4.4A18 18 0 0 0 24 42z" />
      <path fill="#4CAF50" d="M15.2 28.8A10.8 10.8 0 0 1 14.6 24c0-1.7.3-3.3.6-4.8v-4.4H9.5A18 18 0 0 0 6 24c0 2.9.7 5.6 1.9 8l7.3-3.2z" />
      <path fill="#1976D2" d="M24 13.7c2.4 0 4.5.8 6.2 2.4l4.6-4.6A17.8 17.8 0 0 0 24 6a18 18 0 0 0-14.5 8.8l7.3 4.4c1.2-3.7 4.7-6.5 8.8-5.5.4 0 .4 0 .4 0z" />
    </svg>
  );
}

function WooIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden>
      <circle cx="24" cy="24" r="16" fill="#7F54B3" />
      <path fill="#fff" d="M15 18.5 18.2 30h2.2l2.2-8.2 2.2 8.2h2.2L30.2 18.5h-2.2l-1.8 8-2.1-8h-2.2l-2.1 8-1.8-8z" />
    </svg>
  );
}

function ShopifyIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden>
      <path fill="#95BF47" d="M32.2 12.4 30.6 12s-.2-.2-.4-.1l-1.2 2.4c-.4-.1-.8-.2-1.4-.2-.1 0-2.6.8-2.6.8l-1.8-5.2L16 11.2l7.2 25.2 9.6-2.4s-1.2-21-1.2-21.6c.2 0 .6 0 .6 0z" />
      <path fill="#5E8E3E" d="M30.2 11.9c-.2.1-.4.1-.4.1l1.2 3.4s1.4-.6 2.2-.8c-.8-1.6-2-2.6-3-2.7z" />
      <path fill="#fff" d="M26.2 20.2s-1.2-.6-2.6-.4c-2 .2-2.1 1.4-2.1 1.8 0 2 5.2 2.4 5.2 6.6 0 3.2-2 5.4-4.8 5.6-2.4.2-3.8-.8-3.8-.8l.6-2.4s1.4 1 2.6.8c1.2-.2 1.6-1 1.6-1.6 0-2.6-4.4-2.8-4.4-6.4 0-3.2 2.4-6.4 7.2-6.6 1.6 0 2.4.4 2.4.4z" />
    </svg>
  );
}

function YouCanIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden>
      <rect x="10" y="10" width="28" height="28" rx="8" fill="#E11D48" />
      <path fill="#fff" d="M18 30.5 16.2 18h2.4l1.1 8.4 2.6-8.4h2.2l2.6 8.4 1.1-8.4H31L29.2 30.5h-2.6l-2.4-7.6-2.4 7.6z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden>
      <circle cx="24" cy="24" r="14" fill="#0F766E" />
      <path
        fill="#fff"
        d="M24 14.5c.6 3.4 2.6 6.2 5.5 8.5-2.9 2.3-4.9 5.1-5.5 8.5-.6-3.4-2.6-6.2-5.5-8.5 2.9-2.3 4.9-5.1 5.5-8.5z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden>
      <defs>
        <linearGradient id="ig-grad" x1="8" y1="40" x2="40" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F9CE34" />
          <stop offset="0.45" stopColor="#EE2A7B" />
          <stop offset="1" stopColor="#6228D7" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="28" height="28" rx="8" fill="url(#ig-grad)" />
      <rect x="16" y="16" width="16" height="16" rx="5" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="24" cy="24" r="4" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="30.5" cy="17.5" r="1.3" fill="#fff" />
    </svg>
  );
}
