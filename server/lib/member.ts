import { z } from "zod";
import type { H3Event } from "h3";
import { createError } from "h3";
import { getUserDb, rawDb } from "./zenstack";
import { handleOrmError } from "./error";
import type { ProjectMember } from "../../zenstack/models";

export const addMemberSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

export const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).optional(),
  is_active: z.boolean().optional(),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export type MemberResponse = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  created_at: Date;
};

function toResponse(
  member: ProjectMember & {
    user: {
      id: string;
      name: string;
      email: string;
      avatar_url: string | null;
    };
  },
): MemberResponse {
  return {
    id: member.user_id,
    user_id: member.user_id,
    name: member.user.name,
    email: member.user.email,
    avatar_url: member.user.avatar_url ?? null,
    role: member.role,
    is_active: member.is_active,
    created_at: member.created_at,
  };
}

export async function listMembers(
  event: H3Event,
  projectId: string,
): Promise<MemberResponse[]> {
  try {
    const db = await getUserDb(event);
    const members = await db.projectMember.findMany({
      where: { project_id: projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar_url: true },
        },
      },
      orderBy: { created_at: "asc" },
    });
    return members.map(toResponse);
  } catch (error) {
    return handleOrmError(error, "Failed to list members");
  }
}

export async function addMember(
  event: H3Event,
  projectId: string,
  data: AddMemberInput,
): Promise<MemberResponse> {
  try {
    const db = await getUserDb(event);
    const member = await db.projectMember.create({
      data: {
        project_id: projectId,
        user_id: data.user_id,
        role: data.role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar_url: true },
        },
      },
    });
    return toResponse(member);
  } catch (error) {
    return handleOrmError(error, "Failed to add member");
  }
}

export async function updateMember(
  event: H3Event,
  projectId: string,
  userId: string,
  data: UpdateMemberInput,
): Promise<MemberResponse> {
  try {
    const db = await getUserDb(event);

    const project = await rawDb.project.findUnique({
      where: { id: projectId },
      select: { created_by_id: true },
    });
    if (!project) {
      throw createError({ statusCode: 404, statusMessage: "Project not found" });
    }

    if (userId === project.created_by_id && data.role !== undefined) {
      throw createError({
        statusCode: 403,
        statusMessage: "Cannot change the project owner's role",
      });
    }

    const updateData: Record<string, unknown> = {};
    if (data.role !== undefined) updateData.role = data.role;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    const member = await db.projectMember.update({
      where: { project_id_user_id: { project_id: projectId, user_id: userId } },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar_url: true },
        },
      },
    });
    return toResponse(member);
  } catch (error) {
    return handleOrmError(error, "Failed to update member");
  }
}

export async function removeMember(
  event: H3Event,
  projectId: string,
  userId: string,
): Promise<void> {
  try {
    const db = await getUserDb(event);

    const project = await rawDb.project.findUnique({
      where: { id: projectId },
      select: { created_by_id: true },
    });
    if (!project) {
      throw createError({ statusCode: 404, statusMessage: "Project not found" });
    }

    if (userId === project.created_by_id) {
      throw createError({
        statusCode: 403,
        statusMessage: "Cannot remove the project owner",
      });
    }

    await db.projectMember.delete({
      where: { project_id_user_id: { project_id: projectId, user_id: userId } },
    });
  } catch (error) {
    return handleOrmError(error, "Failed to remove member");
  }
}
