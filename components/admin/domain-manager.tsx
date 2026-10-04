"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { removePlatformDomainAction, savePlatformDomainAction } from "@/lib/domain/actions";
import { domainStatusCopyKey, type PlatformDomainRecord } from "@/lib/domain/platform-domain";

function domainErrorKey(error: string): "domainInvalid" | "domainForbidden" | "domainSaveFailed" {
  if (error === "invalid_domain") {
    return "domainInvalid";
  }
  if (error === "forbidden") {
    return "domainForbidden";
  }
  return "domainSaveFailed";
}

export function DomainManager({ saved }: { saved: PlatformDomainRecord | null }) {
  const pages = useTranslations("dashboard.pages");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await savePlatformDomainAction(new FormData(event.currentTarget));
    setPending(false);
    if (!result.ok) {
      setError(pages(domainErrorKey(result.error)));
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function onRemove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await removePlatformDomainAction(new FormData(event.currentTarget));
    setPending(false);
    if (!result.ok) {
      setError(pages(domainErrorKey(result.error)));
      return;
    }
    setEditing(false);
    router.refresh();
  }

  const showForm = !saved || editing;

  return (
    <div className="space-y-4">
      {saved && !editing ? (
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-muted">{pages("customDomain")}</dt>
            <dd className="mt-1 font-medium">{saved.domain}</dd>
          </div>
          <div>
            <dt className="text-muted">{pages("domainStatus")}</dt>
            <dd className="mt-1 font-medium">{pages(domainStatusCopyKey(saved.status))}</dd>
          </div>
        </dl>
      ) : null}
      {showForm ? (
        <form className="space-y-4" onSubmit={onSave}>
          <Input
            label={pages("customDomain")}
            name="domain"
            defaultValue={saved?.domain ?? ""}
            placeholder={pages("domainPlaceholder")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
          <Button type="submit" disabled={pending} loading={pending}>
            {saved ? pages("domainEditSave") : pages("domainAdd")}
          </Button>
          {saved ? (
            <Button type="button" variant="outline" disabled={pending} onClick={() => setEditing(false)}>
              {pages("domainCancel")}
            </Button>
          ) : null}
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={() => setEditing(true)}>
            {pages("domainEdit")}
          </Button>
          <form onSubmit={onRemove}>
            <input type="hidden" name="id" value={saved.id} />
            <Button type="submit" variant="outline" disabled={pending}>
              {pages("domainRemove")}
            </Button>
          </form>
        </div>
      )}
      {saved ? <p className="text-sm leading-6 text-muted">{pages("domainSavedNote")}</p> : null}
      {error ? (
        <Toast tone="danger" role="alert">
          {error}
        </Toast>
      ) : null}
    </div>
  );
}
