import { createClient, type FetchFn } from "@zenstackhq/fetch-client";
import { schema } from "~~/zenstack/schema-lite";

export function useZenStackClient() {
  const requestUrl = useRequestURL();
  const requestHeaders = useRequestHeaders(["cookie"]);

  const fetchWithCookies: FetchFn = (url, init) => {
    const headers = new Headers(init?.headers);

    if (import.meta.server && requestHeaders.cookie) {
      headers.set("cookie", requestHeaders.cookie);
    }

    return fetch(url, {
      ...init,
      headers,
    });
  };

  return createClient(schema, {
    endpoint: `${requestUrl.origin}/api/model`,
    fetch: fetchWithCookies,
  });
}
