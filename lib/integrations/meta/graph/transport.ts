import "server-only";

import type { MetaGraphGetResponse, MetaGraphTransport } from "../verification/types";

export const defaultMetaGraphTransport: MetaGraphTransport = {
  async get(url: string): Promise<MetaGraphGetResponse> {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return {
      status: response.status,
      body,
    };
  },
};
