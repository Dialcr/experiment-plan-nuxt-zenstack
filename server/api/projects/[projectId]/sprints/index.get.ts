import { listSprints } from "../../../../lib/sprint";

export default defineEventHandler((event) => {
  const projectId = getRouterParam(event, "projectId")!;
  return listSprints(event, projectId);
});
