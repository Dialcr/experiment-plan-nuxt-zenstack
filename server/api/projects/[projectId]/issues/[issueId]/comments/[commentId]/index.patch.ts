import { updateComment, updateCommentSchema } from "../../../../../../../lib/comment";

export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, "commentId")!;
  const body = await readBody(event);
  const data = updateCommentSchema.parse(body);
  return updateComment(event, commentId, data);
});
