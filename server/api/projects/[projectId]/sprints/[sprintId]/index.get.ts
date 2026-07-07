import { getSprint } from "../../../../../lib/sprint";

export default defineEventHandler((event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const sprintId = getRouterParam(event, "sprintId")!;
  return getSprint(event, projectId, sprintId);
});
