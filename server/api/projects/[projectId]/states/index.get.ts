import { listStatesWithIssueCount } from "../../../../lib/state";

export default defineEventHandler((event) => {
  const projectId = getRouterParam(event, "projectId")!;
  return listStatesWithIssueCount(event, projectId);
});
