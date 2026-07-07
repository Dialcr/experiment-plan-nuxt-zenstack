import { addMember, addMemberSchema } from "../../../../lib/member";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const body = await readBody(event);
  const data = addMemberSchema.parse(body);
  return addMember(event, projectId, data);
});
