-- AlterTable
ALTER TABLE "Project" ADD COLUMN "createdById" TEXT;

-- Backfill existing projects from their lead or first admin member.
UPDATE "Project"
SET "createdById" = COALESCE(
    "leadId",
    (
        SELECT "ProjectMember"."userId"
        FROM "ProjectMember"
        WHERE "ProjectMember"."projectId" = "Project"."id"
          AND "ProjectMember"."role" = 'admin'
          AND "ProjectMember"."isActive" = true
        ORDER BY "ProjectMember"."createdAt" ASC
        LIMIT 1
    )
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Project" WHERE "createdById" IS NULL) THEN
        RAISE EXCEPTION 'Cannot make Project.createdById required: at least one existing project has no lead or active admin member';
    END IF;
END $$;

ALTER TABLE "Project" ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
