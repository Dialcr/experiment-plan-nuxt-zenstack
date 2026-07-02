/// <reference path="./frappe-ui.d.ts" />
import frappeUIPreset from "frappe-ui/tailwind";
import type { Config } from "tailwindcss";

export default {
  presets: [frappeUIPreset],
  content: [
    "./app/**/*.{vue,js,ts}",
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.{vue,js,ts}",
    "./pages/**/*.{vue,js,ts}",
    "./node_modules/frappe-ui/src/**/*.{vue,js,ts}",
  ],
} satisfies Config;
