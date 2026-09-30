/**
 * STUB: Ameex shipping client.
 * Replace with real API calls once the Ameex API contract is confirmed.
 * Do NOT call any network endpoint from here yet.
 */
export const AMEEX_BASE_URL = process.env.AMEEX_API_BASE_URL ?? '';

export async function login(_apiKey: string): Promise<never> {
  throw new Error('Ameex login not implemented yet');
}

export async function createDelivery(_token: string, _payload: unknown): Promise<never> {
  throw new Error('Ameex createDelivery not implemented yet');
}

export async function track(_token: string, _trackingNumber: string): Promise<never> {
  throw new Error('Ameex track not implemented yet');
}

export async function getLabel(_token: string, _parcelCode: string): Promise<never> {
  throw new Error('Ameex getLabel not implemented yet');
}
