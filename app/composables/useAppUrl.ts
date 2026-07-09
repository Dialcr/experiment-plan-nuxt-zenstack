/**
 * Get the correct public URL of the application.
 * Works correctly in production behind reverse proxies (like Render.com)
 * by reading X-Forwarded-* headers.
 */
export function useAppUrl() {
  // In the client, use window.location
  if (import.meta.client) {
    return window.location.origin;
  }

  // In the server, read headers to detect the correct public URL
  const event = useRequestEvent();
  if (!event) {
    // Fallback to useRequestURL() if no event available
    return useRequestURL().origin;
  }

  const headers = event.node.req.headers;

  // Check for X-Forwarded-* headers set by reverse proxies
  const forwardedProto = headers["x-forwarded-proto"] as string | undefined;
  const forwardedHost = headers["x-forwarded-host"] as string | undefined;

  if (forwardedProto && forwardedHost) {
    // Use the forwarded headers (production behind proxy)
    return `${forwardedProto}://${forwardedHost}`;
  }

  // Fallback to the Host header
  const host = headers.host;
  if (host) {
    // Detect protocol based on common patterns
    const proto =
      host.includes("localhost") || host.includes("127.0.0.1")
        ? "http"
        : "https";
    return `${proto}://${host}`;
  }

  // Last resort: use useRequestURL()
  return useRequestURL().origin;
}
