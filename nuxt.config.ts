/// <reference path="./frappe-ui.d.ts" />
// https://nuxt.com/docs/api/configuration/nuxt-config
import frappeui from "frappe-ui/vite";
import "./env";

export default defineNuxtConfig({
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
