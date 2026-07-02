declare module 'frappe-ui/tailwind' {
  import type { Config } from 'tailwindcss';

  const preset: Config;
  export default preset;
}

declare module 'frappe-ui/vite' {
  import type { PluginOption } from 'vite';

  interface FrappeUIPluginOptions {
    frontendRoute?: string;
    lucideIcons?: boolean | Record<string, unknown>;
    frappeProxy?: boolean | Record<string, unknown>;
    frappeTypes?: Record<string, unknown>;
    jinjaBootData?: boolean | Record<string, unknown>;
    buildConfig?: boolean | Record<string, unknown>;
  }

  export default function frappeui(options?: FrappeUIPluginOptions): PluginOption[];
}
