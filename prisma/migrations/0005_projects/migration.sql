-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('OPEN_SOURCE', 'STARTUP', 'PORTFOLIO', 'LEARNING', 'RESEARCH', 'HACKATHON', 'COMMUNITY', 'OTHER');
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'PAUSED');
CREATE TYPE "ProjectVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "CollaborationStatus" AS ENUM ('LOOKING', 'COMPLETE', 'NOT_LOOKING');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_INVITATION';
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_JOIN_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'JOIN_REQUEST_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'JOIN_REQUEST_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_MEMBER_JOINED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_DISCUSSION';

ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "project_id" UUID;

CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "project_type" "ProjectType" NOT NULL DEFAULT 'OPEN_SOURCE',
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PUBLIC',
    "collaboration_status" "CollaborationStatus" NOT NULL DEFAULT 'LOOKING',
    "github_url" TEXT,
    "website_url" TEXT,
    "demo_url" TEXT,
    "figma_url" TEXT,
    "github_owner" TEXT,
    "github_repo" TEXT,
    "showcase" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");
CREATE INDEX "projects_owner_id_created_at_idx" ON "projects"("owner_id", "created_at" DESC);
CREATE INDEX "projects_status_collaboration_status_idx" ON "projects"("status", "collaboration_status");
CREATE INDEX "projects_project_type_idx" ON "projects"("project_type");

CREATE TABLE "project_roles" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "required_skills" TEXT[],
    "positions" INTEGER NOT NULL DEFAULT 1,
    "filled_positions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_roles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_roles_project_id_idx" ON "project_roles"("project_id");

CREATE TABLE "project_members" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "role_name" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "project_members_project_id_profile_id_key" ON "project_members"("project_id", "profile_id");
CREATE INDEX "project_members_profile_id_idx" ON "project_members"("profile_id");

CREATE TABLE "project_technologies" (
    "project_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    CONSTRAINT "project_technologies_pkey" PRIMARY KEY ("project_id","skill_id")
);
CREATE INDEX "project_technologies_skill_id_idx" ON "project_technologies"("skill_id");

CREATE TABLE "project_invitations" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "role_name" TEXT NOT NULL,
    "message" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_invitations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_invitations_project_id_status_idx" ON "project_invitations"("project_id", "status");
CREATE INDEX "project_invitations_recipient_id_status_idx" ON "project_invitations"("recipient_id", "status");

CREATE TABLE "project_join_requests" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "role_name" TEXT NOT NULL,
    "message" TEXT,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_join_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_join_requests_project_id_status_idx" ON "project_join_requests"("project_id", "status");
CREATE INDEX "project_join_requests_profile_id_status_idx" ON "project_join_requests"("profile_id", "status");

CREATE TABLE "project_tasks" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "assignee_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_tasks_project_id_status_idx" ON "project_tasks"("project_id", "status");
CREATE INDEX "project_tasks_assignee_id_idx" ON "project_tasks"("assignee_id");

CREATE TABLE "project_task_comments" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_task_comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_task_comments_task_id_created_at_idx" ON "project_task_comments"("task_id", "created_at");

CREATE TABLE "project_discussions" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_discussions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_discussions_project_id_created_at_idx" ON "project_discussions"("project_id", "created_at" DESC);

CREATE TABLE "project_discussion_comments" (
    "id" UUID NOT NULL,
    "discussion_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_discussion_comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_discussion_comments_discussion_id_created_at_idx" ON "project_discussion_comments"("discussion_id", "created_at");

CREATE TABLE "project_activity" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "actor_id" UUID,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_activity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_activity_project_id_created_at_idx" ON "project_activity"("project_id", "created_at" DESC);

CREATE TABLE "project_showcases" (
    "profile_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_showcases_pkey" PRIMARY KEY ("profile_id","project_id")
);
CREATE INDEX "project_showcases_project_id_idx" ON "project_showcases"("project_id");

CREATE TABLE "github_accounts" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "github_username" TEXT NOT NULL,
    "github_profile_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "github_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "github_accounts_profile_id_key" ON "github_accounts"("profile_id");

ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_roles" ADD CONSTRAINT "project_roles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_join_requests" ADD CONSTRAINT "project_join_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_join_requests" ADD CONSTRAINT "project_join_requests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_task_comments" ADD CONSTRAINT "project_task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_task_comments" ADD CONSTRAINT "project_task_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_discussions" ADD CONSTRAINT "project_discussions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_discussions" ADD CONSTRAINT "project_discussions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_discussion_comments" ADD CONSTRAINT "project_discussion_comments_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "project_discussions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_discussion_comments" ADD CONSTRAINT "project_discussion_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_activity" ADD CONSTRAINT "project_activity_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_activity" ADD CONSTRAINT "project_activity_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_showcases" ADD CONSTRAINT "project_showcases_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_showcases" ADD CONSTRAINT "project_showcases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "github_accounts" ADD CONSTRAINT "github_accounts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
