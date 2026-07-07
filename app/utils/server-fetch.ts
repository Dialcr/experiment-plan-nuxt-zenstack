export function serverFetch<T = unknown>(url: string, opts?: Record<string, unknown>): Promise<T> {
  return ($fetch as any)(url, opts) as Promise<T>;
}
