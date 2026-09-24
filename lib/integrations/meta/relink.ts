export interface MetaRelinkSource {
  storeConnectionId: string;
  pixelId: string;
  encryptedAccessToken: string;
}

export interface MetaRelinkPlan {
  deleteStoreConnectionId: string;
  storeConnection: {
    store_id: string;
    connection_type: "marketing";
    provider: "meta";
    status: "active";
  };
  metaConnection: {
    pixel_id: string;
    verification_status: "verified";
    verified_at: string;
    connected_at: string;
    error_message: null;
  };
  secret: {
    encrypted_access_token: string;
  };
}

export function isCopyableEncryptedToken(value: string): boolean {
  const [version, iv, tag, ciphertext, extra] = value.split(":");
  return (
    version === "v1" &&
    Boolean(iv) &&
    Boolean(tag) &&
    Boolean(ciphertext) &&
    extra === undefined
  );
}

export function buildMetaRelinkPlan(input: {
  source: MetaRelinkSource;
  newStoreId: string;
  now: string;
}): MetaRelinkPlan {
  if (!isCopyableEncryptedToken(input.source.encryptedAccessToken)) {
    throw new Error("encrypted_token_cannot_be_copied");
  }

  return {
    deleteStoreConnectionId: input.source.storeConnectionId,
    storeConnection: {
      store_id: input.newStoreId,
      connection_type: "marketing",
      provider: "meta",
      status: "active",
    },
    metaConnection: {
      pixel_id: input.source.pixelId,
      verification_status: "verified",
      verified_at: input.now,
      connected_at: input.now,
      error_message: null,
    },
    secret: {
      encrypted_access_token: input.source.encryptedAccessToken,
    },
  };
}
