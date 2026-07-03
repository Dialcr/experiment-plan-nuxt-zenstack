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

export async function getCurrentUser(event: H3Event) {
  const supabaseUser = await serverSupabaseUser(event);

  if (!supabaseUser?.sub) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const email = supabaseUser.email;

  if (!email) {
    throw createError({
      statusCode: 422,
      statusMessage: "Authenticated user is missing an email",
    });
  }

  const name = supabaseUser.user_metadata?.name;

  if (typeof name !== "string" || !name) {
    throw createError({
      statusCode: 422,
      statusMessage: "Authenticated user is missing a name",
    });
  }

  const user = await rawDb.user.upsert({
    where: { id: supabaseUser.sub },
    update: { email },
    create: {
      id: supabaseUser.sub,
      email,
      name,
    },
  });

  if (!user.isActive) {
    throw createError({
      statusCode: 403,
      statusMessage: "User is inactive",
    });
  }

  return user;
}

export async function getUserDb(event: H3Event) {
  const user = await getCurrentUser(event);
  return policyDb.$setAuth(user);
}
