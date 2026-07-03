import { getCurrentUser } from "../lib/zenstack";

export default defineEventHandler((event) => {
  return getCurrentUser(event);
});
