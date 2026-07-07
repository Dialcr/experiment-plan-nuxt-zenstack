import { listLabels } from "../../../../lib/label";

export default defineEventHandler((event) => {
  const projectId = getRouterParam(event, "projectId")!;
  return listLabels(event, projectId);
});
