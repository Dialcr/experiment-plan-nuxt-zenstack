import { z } from "zod";
import type { H3Event } from "h3";
import { createError } from "h3";
import { getUserDb } from "./zenstack";
import { handleOrmError } from "./error";
import type { Label } from "../../zenstack/models";

export const createLabelSchema = z.object({
  name: z.string().trim().min(1, "Label name is required"),
  color: z.string().trim().min(1).default("#6366f1"),
});

export const updateLabelSchema = z.object({
  name: z.string().trim().min(1).optional(),
  color: z.string().trim().min(1).optional(),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;

export type LabelResponse = {
  id: string;
  name: string;
  color: string;
};

function toResponse(label: Label): LabelResponse {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
  };
}

export async function listLabels(
  event: H3Event,
  projectId: string,
): Promise<LabelResponse[]> {
  try {
    const db = await getUserDb(event);
    const labels = await db.label.findMany({
      where: { project_id: projectId },
      orderBy: { name: "asc" },
    });
    return labels.map(toResponse);
  } catch (error) {
    return handleOrmError(error, "Failed to list labels");
  }
}

export async function createLabel(
  event: H3Event,
  projectId: string,
  data: CreateLabelInput,
): Promise<LabelResponse> {
  try {
    const db = await getUserDb(event);
    const existing = await db.label.findUnique({
      where: { project_id_name: { project_id: projectId, name: data.name } },
    });
    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: "A label with this name already exists",
      });
    }
    const label = await db.label.create({
      data: {
        project_id: projectId,
        name: data.name,
        color: data.color,
      },
    });
    return toResponse(label);
  } catch (error) {
    return handleOrmError(error, "Failed to create label");
  }
}

export async function updateLabel(
  event: H3Event,
  projectId: string,
  labelId: string,
  data: UpdateLabelInput,
): Promise<LabelResponse> {
  try {
    const db = await getUserDb(event);
    const label = await db.label.update({
      where: { id: labelId },
      data,
    });
    return toResponse(label);
  } catch (error) {
    return handleOrmError(error, "Failed to update label");
  }
}

export async function deleteLabel(
  event: H3Event,
  projectId: string,
  labelId: string,
): Promise<void> {
  try {
    const db = await getUserDb(event);
    await db.label.delete({ where: { id: labelId } });
  } catch (error) {
    return handleOrmError(error, "Failed to delete label");
  }
}
