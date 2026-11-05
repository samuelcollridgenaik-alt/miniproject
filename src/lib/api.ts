export async function apiJson<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  try {
    const id = localStorage.getItem("cognify_user_id");
    if (id && !headers.has("x-user-id")) headers.set("x-user-id", id);
  } catch {
    /* Existing session behavior remains available without local storage. */
  }
  const response = await fetch(url, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(90000),
  });
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `The service returned an unreadable response (${response.status}). Please retry.`,
    );
  }
  if (!data || typeof data !== "object")
    throw new Error(
      "The service returned an unexpected response. Please retry.",
    );
  const payload = data as { success?: boolean; error?: string };
  if (!response.ok || payload.success === false)
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : `The request failed (${response.status}). Please retry.`,
    );
  return data as T;
}
