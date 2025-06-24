export interface Token {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

const store = new Map<string, Token>();

export function get(userId: string): Token | null {
  return store.get(userId) || null;
}

export function save(userId: string, token: Token): void {
  store.set(userId, token);
}

export default { get, save };
