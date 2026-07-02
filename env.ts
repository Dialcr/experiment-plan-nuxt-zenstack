import { createEnv } from "@t3-oss/env-nuxt";
import * as z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    SUPABASE_URL: z.url(),
    SUPABASE_PUBLIC_KEY: z.string().min(1),
  },
});
