// https://nuxt.com/docs/api/configuration/nuxt-config
import "./env";

export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@nuxtjs/supabase"],
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_PUBLIC_KEY,
    redirect: true,
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: ["/signup"],
      saveRedirectToCookie: true,
    },
    types: false,
  },
  routeRules: {
    "/": { redirect: "/projects" },
    "/projects": { appLayout: "app" },
    "/projects/**": { appLayout: "app" },
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  debug: true,
});
