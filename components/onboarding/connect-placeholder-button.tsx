"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ConnectPlaceholderButtonProps {
  label: string;
  message: string;
}

export function ConnectPlaceholderButton({
  label,
  message,
}: ConnectPlaceholderButtonProps) {
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  return (
    <div>
      <Button type="button" variant="outline" onClick={() => setIsMessageVisible(true)}>
        {label}
      </Button>
      {isMessageVisible ? (
        <p
          className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
