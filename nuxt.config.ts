/// <reference path="./frappe-ui.d.ts" />
// https://nuxt.com/docs/api/configuration/nuxt-config
import frappeui from "frappe-ui/vite";
import "./env";

export default defineNuxtConfig({
  modules: ["@nuxtjs/supabase"],
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
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["frappe-ui/style.css", "~/assets/css/main.css"],
  build: {
    transpile: ["frappe-ui"],
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  vite: {
    plugins: [
      frappeui({
        frappeProxy: false,
        jinjaBootData: false,
        buildConfig: false,
      }),
    ],
  },
});
