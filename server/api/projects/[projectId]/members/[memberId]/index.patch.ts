import { updateMember, updateMemberSchema } from "../../../../../lib/member";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const memberId = getRouterParam(event, "memberId")!;
  const body = await readBody(event);
  const data = updateMemberSchema.parse(body);
  return updateMember(event, projectId, memberId, data);
});
