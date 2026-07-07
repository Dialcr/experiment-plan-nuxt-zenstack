import { deleteComment } from "../../../../../../../lib/comment";

export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, "commentId")!;
  await deleteComment(event, commentId);
  return { success: true };
});
