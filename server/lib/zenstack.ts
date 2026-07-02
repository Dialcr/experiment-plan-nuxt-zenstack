import { serverSupabaseUser } from "#supabase/server";
import { ZenStackClient } from "@zenstackhq/orm";
import { PostgresDialect } from "@zenstackhq/orm/dialects/postgres";
import { PolicyPlugin } from "@zenstackhq/plugin-policy";
import { createError, type H3Event } from "h3";
import { Pool } from "pg";
import { schema } from "../../zenstack/schema";

export const rawDb = new ZenStackClient(schema, {
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
});

export const db = rawDb;
export const policyDb = rawDb.$use(new PolicyPlugin());

export async function getUserDb(event: H3Event) {
  const supabaseUser = await serverSupabaseUser(event);

  if (!supabaseUser?.sub) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const user = await rawDb.user.findUnique({
    where: { id: supabaseUser.sub },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "User profile has not been initialized",
    });
  }

  if (!user.isActive) {
    throw createError({
      statusCode: 403,
      statusMessage: "User is inactive",
    });
  }

  return policyDb.$setAuth(user);
}
