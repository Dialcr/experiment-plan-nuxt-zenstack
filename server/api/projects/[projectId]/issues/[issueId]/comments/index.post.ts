import {
  createComment,
  createCommentSchema,
} from "../../../../../../lib/comment";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const issueId = getRouterParam(event, "issueId")!;
  const body = await readBody(event);
  const data = createCommentSchema.parse(body);
  return createComment(event, projectId, issueId, data);
});
