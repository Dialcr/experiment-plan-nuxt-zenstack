import { serverSupabaseUser } from "#supabase/server";
import { createError } from "h3";
import { rawDb } from "../lib/zenstack";

export default defineEventHandler(async (event) => {
  const supabaseUser = await serverSupabaseUser(event);

  if (!supabaseUser) {
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

  // Because of our implementation of the registration form
  // the user_metadata is always expected to be in the payload
  const name = supabaseUser.user_metadata?.name;

  if (typeof name !== "string" || !name) {
    throw createError({
      statusCode: 422,
      statusMessage: "Authenticated user is missing a name",
    });
  }

  const user = await rawDb.user.upsert({
    where: { id: supabaseUser.sub! },
    update: { email },
    create: {
      id: supabaseUser.sub!,
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
});
