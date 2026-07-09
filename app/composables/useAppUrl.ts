export function useAppUrl() {
  const config = useRuntimeConfig();

  if (config.public.siteUrl) {
    return config.public.siteUrl;
  }

  if (import.meta.client) {
    return window.location.origin;
  }

  return useRequestURL().origin;
}
