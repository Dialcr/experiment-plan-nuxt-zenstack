import { getProject } from "../../lib/project";

export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id")!;
  return getProject(event, id);
});
