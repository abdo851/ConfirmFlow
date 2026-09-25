export interface SidebarLink {
  labelKey: string;
  href: string;
}

export interface SidebarGroup {
  key: string;
  href: string;
  adminOnly?: boolean;
  items: SidebarLink[];
}

export const sidebarGroups: SidebarGroup[] = [
  { key: "overview", href: "/dashboard", items: [] },
  {
    key: "orders",
    href: "/dashboard/orders",
    items: [
      { labelKey: "ordersAll", href: "/dashboard/orders" },
      { labelKey: "ordersConfirmed", href: "/dashboard/orders?status=confirmed" },
      { labelKey: "ordersPending", href: "/dashboard/orders?status=pending" },
      { labelKey: "ordersRejected", href: "/dashboard/orders?status=rejected" },
      { labelKey: "ordersArchived", href: "/dashboard/orders?status=archived" },
    ],
  },
  { key: "analytics", href: "/dashboard/analytics", items: [] },
  {
    key: "connections",
    href: "/dashboard/connections",
    items: [
      { labelKey: "stores", href: "/dashboard/connections" },
      { labelKey: "metaPixel", href: "/dashboard/connections/meta" },
      { labelKey: "webhooks", href: "/dashboard/connections/webhooks" },
    ],
  },
  {
    key: "tracking",
    href: "/dashboard/tracking",
    items: [
      { labelKey: "pixelSettings", href: "/dashboard/tracking/pixel" },
      { labelKey: "capi", href: "/dashboard/tracking/capi" },
      { labelKey: "gtm", href: "/dashboard/tracking/gtm" },
      { labelKey: "tiktok", href: "/dashboard/tracking/tiktok" },
    ],
  },
  {
    key: "marketing",
    href: "/dashboard/marketing",
    items: [
      { labelKey: "campaigns", href: "/dashboard/marketing/campaigns" },
      { labelKey: "audiences", href: "/dashboard/marketing/audiences" },
      { labelKey: "templates", href: "/dashboard/marketing/templates" },
    ],
  },
  {
    key: "wallet",
    href: "/dashboard/wallet",
    items: [
      { labelKey: "balance", href: "/dashboard/wallet" },
      { labelKey: "transactions", href: "/dashboard/wallet/transactions" },
      { labelKey: "invoices", href: "/dashboard/wallet/invoices" },
    ],
  },
  { key: "team", href: "/dashboard/team", items: [] },
  {
    key: "admin",
    href: "/dashboard/admin",
    adminOnly: true,
    items: [
      { labelKey: "cms", href: "/dashboard/admin/content" },
      { labelKey: "policies", href: "/dashboard/admin/policies" },
      { labelKey: "users", href: "/dashboard/admin/users" },
      { labelKey: "generalSettings", href: "/dashboard/admin/settings" },
      { labelKey: "videos", href: "/dashboard/admin/videos" },
    ],
  },
  {
    key: "settings",
    href: "/dashboard/settings",
    items: [
      { labelKey: "account", href: "/dashboard/settings/account" },
      { labelKey: "language", href: "/dashboard/settings/language" },
      { labelKey: "notifications", href: "/dashboard/settings/notifications" },
      { labelKey: "api", href: "/dashboard/settings/api" },
    ],
  },
];

export function visibleSidebarGroups(isAdmin: boolean): SidebarGroup[] {
  return sidebarGroups.filter((group) => isAdmin || !group.adminOnly);
}

export function groupIsActive(group: SidebarGroup, pathname: string): boolean {
  if (group.href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === group.href || pathname.startsWith(`${group.href}/`);
}

export function itemIsActive(href: string, pathname: string, search: string): boolean {
  const [path, query] = href.split("?");
  if (pathname !== path) {
    return false;
  }

  const actual = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!query) {
    if (path === "/dashboard/orders") {
      return !actual.get("status");
    }
    return true;
  }

  const expected = new URLSearchParams(query);
  for (const [key, value] of expected) {
    if (actual.get(key) !== value) {
      return false;
    }
  }

  return true;
}
