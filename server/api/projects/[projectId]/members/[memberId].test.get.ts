export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const memberId = getRouterParam(event, "memberId")!;

  console.log("[TEST GET Member] TEST member:", { projectId, memberId });

  return { success: true };
});
