import { listMembers } from "../../../../lib/member";

export default defineEventHandler((event) => {
  const projectId = getRouterParam(event, "projectId")!;
  return listMembers(event, projectId);
});
