-- AlterTable
ALTER TABLE "comments" RENAME CONSTRAINT "Comment_pkey" TO "comments_pkey";

-- AlterTable
ALTER TABLE "issue_assignees" RENAME CONSTRAINT "IssueAssignee_pkey" TO "issue_assignees_pkey";

-- AlterTable
ALTER TABLE "issue_labels" RENAME CONSTRAINT "IssueLabel_pkey" TO "issue_labels_pkey";

-- AlterTable
ALTER TABLE "issues" RENAME CONSTRAINT "Issue_pkey" TO "issues_pkey";

-- AlterTable
ALTER TABLE "labels" RENAME CONSTRAINT "Label_pkey" TO "labels_pkey";

-- AlterTable
ALTER TABLE "project_members" RENAME CONSTRAINT "ProjectMember_pkey" TO "project_members_pkey";

-- AlterTable
ALTER TABLE "projects" RENAME CONSTRAINT "Project_pkey" TO "projects_pkey";

-- AlterTable
ALTER TABLE "sprints" RENAME CONSTRAINT "Sprint_pkey" TO "sprints_pkey";

-- AlterTable
ALTER TABLE "states" RENAME CONSTRAINT "State_pkey" TO "states_pkey";

-- AlterTable
ALTER TABLE "users" RENAME CONSTRAINT "User_pkey" TO "users_pkey";

-- RenameForeignKey
ALTER TABLE "comments" RENAME CONSTRAINT "Comment_author_id_fkey" TO "comments_author_id_fkey";

-- RenameForeignKey
ALTER TABLE "comments" RENAME CONSTRAINT "Comment_issue_id_fkey" TO "comments_issue_id_fkey";

-- RenameForeignKey
ALTER TABLE "comments" RENAME CONSTRAINT "Comment_project_id_fkey" TO "comments_project_id_fkey";

-- RenameForeignKey
ALTER TABLE "issue_assignees" RENAME CONSTRAINT "IssueAssignee_issue_id_fkey" TO "issue_assignees_issue_id_fkey";

-- RenameForeignKey
ALTER TABLE "issue_assignees" RENAME CONSTRAINT "IssueAssignee_user_id_fkey" TO "issue_assignees_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "issue_labels" RENAME CONSTRAINT "IssueLabel_issue_id_fkey" TO "issue_labels_issue_id_fkey";

-- RenameForeignKey
ALTER TABLE "issue_labels" RENAME CONSTRAINT "IssueLabel_label_id_fkey" TO "issue_labels_label_id_fkey";

-- RenameForeignKey
ALTER TABLE "issues" RENAME CONSTRAINT "Issue_created_by_id_fkey" TO "issues_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "issues" RENAME CONSTRAINT "Issue_parent_id_fkey" TO "issues_parent_id_fkey";

-- RenameForeignKey
ALTER TABLE "issues" RENAME CONSTRAINT "Issue_project_id_fkey" TO "issues_project_id_fkey";

-- RenameForeignKey
ALTER TABLE "issues" RENAME CONSTRAINT "Issue_sprint_id_fkey" TO "issues_sprint_id_fkey";

-- RenameForeignKey
ALTER TABLE "issues" RENAME CONSTRAINT "Issue_state_id_fkey" TO "issues_state_id_fkey";

-- RenameForeignKey
ALTER TABLE "issues" RENAME CONSTRAINT "Issue_updated_by_id_fkey" TO "issues_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "labels" RENAME CONSTRAINT "Label_project_id_fkey" TO "labels_project_id_fkey";

-- RenameForeignKey
ALTER TABLE "project_members" RENAME CONSTRAINT "ProjectMember_project_id_fkey" TO "project_members_project_id_fkey";

-- RenameForeignKey
ALTER TABLE "project_members" RENAME CONSTRAINT "ProjectMember_user_id_fkey" TO "project_members_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "projects" RENAME CONSTRAINT "Project_created_by_id_fkey" TO "projects_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "projects" RENAME CONSTRAINT "Project_default_state_id_fkey" TO "projects_default_state_id_fkey";

-- RenameForeignKey
ALTER TABLE "projects" RENAME CONSTRAINT "Project_lead_id_fkey" TO "projects_lead_id_fkey";

-- RenameForeignKey
ALTER TABLE "sprints" RENAME CONSTRAINT "Sprint_owner_id_fkey" TO "sprints_owner_id_fkey";

-- RenameForeignKey
ALTER TABLE "sprints" RENAME CONSTRAINT "Sprint_project_id_fkey" TO "sprints_project_id_fkey";

-- RenameForeignKey
ALTER TABLE "states" RENAME CONSTRAINT "State_project_id_fkey" TO "states_project_id_fkey";

-- RenameIndex
ALTER INDEX "Issue_created_by_id_idx" RENAME TO "issues_created_by_id_idx";

-- RenameIndex
ALTER INDEX "Issue_project_id_archived_at_idx" RENAME TO "issues_project_id_archived_at_idx";

-- RenameIndex
ALTER INDEX "Issue_project_id_priority_idx" RENAME TO "issues_project_id_priority_idx";

-- RenameIndex
ALTER INDEX "Issue_project_id_sequence_id_key" RENAME TO "issues_project_id_sequence_id_key";

-- RenameIndex
ALTER INDEX "Issue_project_id_sprint_id_idx" RENAME TO "issues_project_id_sprint_id_idx";

-- RenameIndex
ALTER INDEX "Issue_project_id_state_id_sort_order_idx" RENAME TO "issues_project_id_state_id_sort_order_idx";

-- RenameIndex
ALTER INDEX "Label_project_id_name_key" RENAME TO "labels_project_id_name_key";

-- RenameIndex
ALTER INDEX "ProjectMember_project_id_role_idx" RENAME TO "project_members_project_id_role_idx";

-- RenameIndex
ALTER INDEX "ProjectMember_user_id_idx" RENAME TO "project_members_user_id_idx";

-- RenameIndex
ALTER INDEX "Project_archived_at_idx" RENAME TO "projects_archived_at_idx";

-- RenameIndex
ALTER INDEX "Project_default_state_id_key" RENAME TO "projects_default_state_id_key";

-- RenameIndex
ALTER INDEX "Project_identifier_key" RENAME TO "projects_identifier_key";

-- RenameIndex
ALTER INDEX "Sprint_project_id_start_date_end_date_idx" RENAME TO "sprints_project_id_start_date_end_date_idx";

-- RenameIndex
ALTER INDEX "Sprint_project_id_status_idx" RENAME TO "sprints_project_id_status_idx";

-- RenameIndex
ALTER INDEX "State_project_id_group_idx" RENAME TO "states_project_id_group_idx";

-- RenameIndex
ALTER INDEX "State_project_id_name_key" RENAME TO "states_project_id_name_key";

-- RenameIndex
ALTER INDEX "State_project_id_sequence_idx" RENAME TO "states_project_id_sequence_idx";

-- RenameIndex
ALTER INDEX "State_project_id_slug_key" RENAME TO "states_project_id_slug_key";

-- RenameIndex
ALTER INDEX "User_email_key" RENAME TO "users_email_key";
