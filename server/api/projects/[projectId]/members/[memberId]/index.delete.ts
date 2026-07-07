import { removeMember } from "../../../../../lib/member";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const memberId = getRouterParam(event, "memberId")!;
  await removeMember(event, projectId, memberId);
  return { success: true };
});
