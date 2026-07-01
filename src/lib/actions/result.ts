export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function success<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function failure(error: string): ActionResult<never> {
  return { ok: false, error };
}
