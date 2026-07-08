import { removeMember } from "../../../../lib/member";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const memberId = getRouterParam(event, "memberId")!;
  
  console.log("[DELETE Member] Removing member:", { projectId, memberId });
  
  if (!projectId || !memberId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Faltan parámetros: projectId o memberId",
    });
  }
  
  await removeMember(event, projectId, memberId);
  return { success: true };
});
