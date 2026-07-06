-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('urgent', 'high', 'medium', 'low', 'none');
CREATE TYPE "SprintStatus" AS ENUM ('planned', 'active', 'completed');

-- RenameTable (to plural snake_case via @@map)
ALTER TABLE IF EXISTS "User" RENAME TO "users";
ALTER TABLE IF EXISTS "Project" RENAME TO "projects";
ALTER TABLE IF EXISTS "ProjectMember" RENAME TO "project_members";
ALTER TABLE IF EXISTS "State" RENAME TO "states";

-- RenameColumn: users
ALTER TABLE "users" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "users" RENAME COLUMN "avatarUrl" TO "avatar_url";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";

-- RenameColumn: projects
ALTER TABLE "projects" RENAME COLUMN "createdById" TO "created_by_id";
ALTER TABLE "projects" RENAME COLUMN "leadId" TO "lead_id";
ALTER TABLE "projects" RENAME COLUMN "defaultStateId" TO "default_state_id";
ALTER TABLE "projects" RENAME COLUMN "archivedAt" TO "archived_at";
ALTER TABLE "projects" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "projects" RENAME COLUMN "updatedAt" TO "updated_at";

-- RenameColumn: project_members
ALTER TABLE "project_members" RENAME COLUMN "projectId" TO "project_id";
ALTER TABLE "project_members" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "project_members" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "project_members" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "project_members" RENAME COLUMN "updatedAt" TO "updated_at";

-- RenameColumn: states
ALTER TABLE "states" RENAME COLUMN "projectId" TO "project_id";
ALTER TABLE "states" RENAME COLUMN "isDefault" TO "is_default";
ALTER TABLE "states" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "states" RENAME COLUMN "updatedAt" TO "updated_at";

-- RenameIndex (match Prisma names from new field names)
ALTER INDEX "Project_defaultStateId_key" RENAME TO "Project_default_state_id_key";
ALTER INDEX "Project_archivedAt_idx" RENAME TO "Project_archived_at_idx";
ALTER INDEX "ProjectMember_projectId_role_idx" RENAME TO "ProjectMember_project_id_role_idx";
ALTER INDEX "ProjectMember_userId_idx" RENAME TO "ProjectMember_user_id_idx";
ALTER INDEX "State_projectId_sequence_idx" RENAME TO "State_project_id_sequence_idx";
ALTER INDEX "State_projectId_group_idx" RENAME TO "State_project_id_group_idx";
ALTER INDEX "State_projectId_name_key" RENAME TO "State_project_id_name_key";
ALTER INDEX "State_projectId_slug_key" RENAME TO "State_project_id_slug_key";

-- RenameForeignKey (match Prisma names from new field names)
ALTER TABLE "projects" RENAME CONSTRAINT "Project_createdById_fkey" TO "Project_created_by_id_fkey";
ALTER TABLE "projects" RENAME CONSTRAINT "Project_leadId_fkey" TO "Project_lead_id_fkey";
ALTER TABLE "projects" RENAME CONSTRAINT "Project_defaultStateId_fkey" TO "Project_default_state_id_fkey";
ALTER TABLE "project_members" RENAME CONSTRAINT "ProjectMember_projectId_fkey" TO "ProjectMember_project_id_fkey";
ALTER TABLE "project_members" RENAME CONSTRAINT "ProjectMember_userId_fkey" TO "ProjectMember_user_id_fkey";
ALTER TABLE "states" RENAME CONSTRAINT "State_projectId_fkey" TO "State_project_id_fkey";

-- CreateTable: Issue (@@map("issues"))
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "project_id" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "sprint_id" TEXT,
    "parent_id" TEXT,
    "sequence_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "IssuePriority" NOT NULL DEFAULT 'none',
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Sprint (@@map("sprints"))
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "project_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "SprintStatus" NOT NULL DEFAULT 'planned',
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Label (@@map("labels"))
CREATE TABLE "labels" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Comment (@@map("comments"))
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "project_id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: IssueAssignee (@@map("issue_assignees"))
CREATE TABLE "issue_assignees" (
    "issue_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "IssueAssignee_pkey" PRIMARY KEY ("issue_id", "user_id")
);

-- CreateTable: IssueLabel (@@map("issue_labels"))
CREATE TABLE "issue_labels" (
    "issue_id" TEXT NOT NULL,
    "label_id" TEXT NOT NULL,

    CONSTRAINT "IssueLabel_pkey" PRIMARY KEY ("issue_id", "label_id")
);

-- CreateIndex: Issue
CREATE UNIQUE INDEX "Issue_project_id_sequence_id_key" ON "issues"("project_id", "sequence_id");
CREATE INDEX "Issue_project_id_state_id_sort_order_idx" ON "issues"("project_id", "state_id", "sort_order");
CREATE INDEX "Issue_project_id_sprint_id_idx" ON "issues"("project_id", "sprint_id");
CREATE INDEX "Issue_project_id_priority_idx" ON "issues"("project_id", "priority");
CREATE INDEX "Issue_project_id_archived_at_idx" ON "issues"("project_id", "archived_at");
CREATE INDEX "Issue_created_by_id_idx" ON "issues"("created_by_id");

-- CreateIndex: Sprint
CREATE INDEX "Sprint_project_id_status_idx" ON "sprints"("project_id", "status");
CREATE INDEX "Sprint_project_id_start_date_end_date_idx" ON "sprints"("project_id", "start_date", "end_date");

-- CreateIndex: Label
CREATE UNIQUE INDEX "Label_project_id_name_key" ON "labels"("project_id", "name");

-- AddForeignKey: Issue
ALTER TABLE "issues" ADD CONSTRAINT "Issue_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "Issue_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "Issue_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "Issue_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "issues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "Issue_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "Issue_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Sprint
ALTER TABLE "sprints" ADD CONSTRAINT "Sprint_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sprints" ADD CONSTRAINT "Sprint_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Label
ALTER TABLE "labels" ADD CONSTRAINT "Label_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Comment
ALTER TABLE "comments" ADD CONSTRAINT "Comment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "Comment_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "Comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: IssueAssignee
ALTER TABLE "issue_assignees" ADD CONSTRAINT "IssueAssignee_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_assignees" ADD CONSTRAINT "IssueAssignee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: IssueLabel
ALTER TABLE "issue_labels" ADD CONSTRAINT "IssueLabel_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_labels" ADD CONSTRAINT "IssueLabel_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
