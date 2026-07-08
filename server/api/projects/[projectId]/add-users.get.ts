import { H3Event } from "h3";
import { getCurrentUser, rawDb } from "../../../lib/zenstack";

/**
 * Get list of users that are not already members of this project
 * and are active in the system
 */
export default defineEventHandler(async (event: H3Event) => {
  const projectId = getRouterParam(event, "projectId")!;

  try {
    // Ensure user is authenticated
    await getCurrentUser(event);

    // Use rawDb to bypass policies and get all active users
    const db = rawDb;

    // Get all active users
    const allUsers = await db.user.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get current project members
    const projectMembers = await db.projectMember.findMany({
      where: {
        project_id: projectId,
      },
      select: {
        user_id: true,
      },
    });

    const memberIds = new Set(projectMembers.map((m) => m.user_id));

    // Filter out users who are already members
    const availableUsers = allUsers.filter((user) => !memberIds.has(user.id));

    return availableUsers;
  } catch (error) {
    console.error("Failed to fetch available users:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch available users",
    });
  }
});
