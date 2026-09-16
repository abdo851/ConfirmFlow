/** Meta Conversions API event payload shape — provider-specific, not core domain. */
export interface MetaCapiUserDataPayload {
  em?: string[];
  ph?: string[];
}

export interface MetaCapiCustomDataPayload {
  currency: string;
  value: number;
}

export interface MetaCapiEventPayload {
  event_name: "Purchase";
  event_time: number;
  event_id: string;
  action_source: "website";
  user_data: MetaCapiUserDataPayload;
  custom_data: MetaCapiCustomDataPayload;
}

export interface MetaCapiRequestPayload {
  data: MetaCapiEventPayload[];
}

export interface MetaCapiSendResult {
  success: boolean;
  error?: string;
}
