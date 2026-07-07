import { listComments } from "../../../../../../lib/comment";

export default defineEventHandler((event) => {
  const issueId = getRouterParam(event, "issueId")!;
  return listComments(event, issueId);
});
