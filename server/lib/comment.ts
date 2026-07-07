import { z } from "zod";
import type { H3Event } from "h3";
import { getCurrentUser, getUserDb } from "./zenstack";
import { handleOrmError } from "./error";
import type { Comment } from "../../zenstack/models";

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment body is required"),
});

export const updateCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment body is required"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

export type CommentResponse = {
  id: string;
  body: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  created_at: string;
  updated_at: string;
};

type CommentWithAuthor = Comment & {
  author: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
};

function toResponse(comment: CommentWithAuthor): CommentResponse {
  return {
    id: comment.id,
    body: comment.body,
    author: {
      id: comment.author.id,
      name: comment.author.name,
      email: comment.author.email,
      avatar_url: comment.author.avatar_url ?? null,
    },
    created_at: comment.created_at.toISOString(),
    updated_at: comment.updated_at.toISOString(),
  };
}

export async function listComments(
  event: H3Event,
  issueId: string,
): Promise<CommentResponse[]> {
  try {
    const db = await getUserDb(event);
    const comments = await db.comment.findMany({
      where: { issue_id: issueId },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar_url: true },
        },
      },
      orderBy: { created_at: "asc" },
    });
    return comments.map(toResponse);
  } catch (error) {
    return handleOrmError(error, "Failed to list comments");
  }
}

export async function createComment(
  event: H3Event,
  projectId: string,
  issueId: string,
  data: CreateCommentInput,
): Promise<CommentResponse> {
  try {
    const user = await getCurrentUser(event);
    const db = await getUserDb(event);
    const comment = await db.comment.create({
      data: {
        project_id: projectId,
        issue_id: issueId,
        author_id: user.id,
        body: data.body,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar_url: true },
        },
      },
    });
    return toResponse(comment);
  } catch (error) {
    return handleOrmError(error, "Failed to create comment");
  }
}

export async function updateComment(
  event: H3Event,
  commentId: string,
  data: UpdateCommentInput,
): Promise<CommentResponse> {
  try {
    const db = await getUserDb(event);
    const comment = await db.comment.update({
      where: { id: commentId },
      data: { body: data.body },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar_url: true },
        },
      },
    });
    return toResponse(comment);
  } catch (error) {
    return handleOrmError(error, "Failed to update comment");
  }
}

export async function deleteComment(
  event: H3Event,
  commentId: string,
): Promise<void> {
  try {
    const db = await getUserDb(event);
    await db.comment.delete({ where: { id: commentId } });
  } catch (error) {
    return handleOrmError(error, "Failed to delete comment");
  }
}
