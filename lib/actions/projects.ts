"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CollaborationStatus,
  ProjectStatus,
  ProjectType,
  ProjectVisibility,
  TaskPriority,
  TaskStatus,
} from "@/lib/generated/prisma/client";
import { requireProfile } from "@/lib/auth/session";
import { slugify } from "@/lib/constants/taxonomy";
import { prisma } from "@/lib/prisma";
import { getMembership, isOwnerOrMaintainer } from "@/lib/projects/access";

async function uniqueSlug(base: string) {
  let slug = slugify(base) || `project-${randomUUID().slice(0, 8)}`;
  let n = 0;
  while (await prisma.project.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${slugify(base) || "project"}-${n}`;
  }
  return slug;
}

async function logActivity(
  projectId: string,
  actorId: string,
  type: string,
  message: string,
) {
  await prisma.projectActivity.create({
    data: { projectId, actorId, type, message },
  });
}

export async function createProjectAction(formData: FormData) {
  const profile = await requireProfile();
  const name = String(formData.get("name") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name || !shortDescription) return;

  const slug = await uniqueSlug(String(formData.get("slug") || name));
  const looking = String(formData.get("looking") ?? "yes") === "yes";
  const skillNames = String(formData.get("technologies") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const roleNames = String(formData.get("roles") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const skills = skillNames.length
    ? await prisma.skill.findMany({ where: { name: { in: skillNames } } })
    : [];

  const githubUrl = String(formData.get("githubUrl") ?? "").trim() || null;
  let githubOwner: string | null = null;
  let githubRepo: string | null = null;
  if (githubUrl) {
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
    if (match) {
      githubOwner = match[1];
      githubRepo = match[2].replace(/\.git$/, "");
    }
  }

  const project = await prisma.project.create({
    data: {
      ownerId: profile.id,
      name,
      slug,
      shortDescription,
      description: description || shortDescription,
      projectType: (String(formData.get("projectType") || "OPEN_SOURCE") as ProjectType),
      status: (String(formData.get("status") || "PLANNING") as ProjectStatus),
      visibility: (String(formData.get("visibility") || "PUBLIC") as ProjectVisibility),
      collaborationStatus: looking
        ? CollaborationStatus.LOOKING
        : CollaborationStatus.NOT_LOOKING,
      githubUrl,
      websiteUrl: String(formData.get("websiteUrl") ?? "").trim() || null,
      demoUrl: String(formData.get("demoUrl") ?? "").trim() || null,
      figmaUrl: String(formData.get("figmaUrl") ?? "").trim() || null,
      githubOwner,
      githubRepo,
      members: {
        create: { profileId: profile.id, roleName: "owner" },
      },
      roles: {
        create: roleNames.map((name) => ({ name, positions: 1 })),
      },
      technologies: {
        create: skills.map((s) => ({ skillId: s.id })),
      },
      showcases: {
        create: { profileId: profile.id, pinned: true },
      },
      activities: {
        create: {
          actorId: profile.id,
          type: "created",
          message: "created the project",
        },
      },
    },
  });

  redirect(`/app/projects/${project.slug}`);
}

export async function requestJoinProjectAction(projectId: string, formData: FormData) {
  const profile = await requireProfile();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId === profile.id) return;
  const existing = await prisma.projectJoinRequest.findFirst({
    where: { projectId, profileId: profile.id, status: "PENDING" },
  });
  if (existing) return;

  await prisma.projectJoinRequest.create({
    data: {
      projectId,
      profileId: profile.id,
      roleName: String(formData.get("roleName") || "Member"),
      message: String(formData.get("message") ?? "").trim() || null,
    },
  });
  await prisma.notification.create({
    data: {
      recipientId: project.ownerId,
      actorId: profile.id,
      type: "PROJECT_JOIN_REQUEST",
      projectId,
    },
  });
  revalidatePath(`/app/projects/${project.slug}`);
}

export async function respondJoinRequestAction(
  requestId: string,
  status: "ACCEPTED" | "REJECTED",
) {
  const profile = await requireProfile();
  const req = await prisma.projectJoinRequest.findUnique({
    where: { id: requestId },
    include: { project: true },
  });
  if (!req || req.project.ownerId !== profile.id) return;

  await prisma.projectJoinRequest.update({
    where: { id: requestId },
    data: { status },
  });

  if (status === "ACCEPTED") {
    await prisma.projectMember.upsert({
      where: {
        projectId_profileId: {
          projectId: req.projectId,
          profileId: req.profileId,
        },
      },
      update: { roleName: req.roleName },
      create: {
        projectId: req.projectId,
        profileId: req.profileId,
        roleName: req.roleName,
      },
    });
    await prisma.projectShowcase.upsert({
      where: {
        profileId_projectId: { profileId: req.profileId, projectId: req.projectId },
      },
      update: {},
      create: { profileId: req.profileId, projectId: req.projectId },
    });
    await logActivity(req.projectId, req.profileId, "joined", "joined the project");
  }

  await prisma.notification.create({
    data: {
      recipientId: req.profileId,
      actorId: profile.id,
      type: status === "ACCEPTED" ? "JOIN_REQUEST_ACCEPTED" : "JOIN_REQUEST_REJECTED",
      projectId: req.projectId,
    },
  });
  revalidatePath(`/app/projects/${req.project.slug}`);
}

export async function inviteToProjectAction(projectId: string, formData: FormData) {
  const profile = await requireProfile();
  const membership = await getMembership(projectId, profile.id);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;
  if (project.ownerId !== profile.id && !isOwnerOrMaintainer(membership?.roleName)) {
    return;
  }

  const username = String(formData.get("username") ?? "").replace(/^@/, "").trim();
  const recipient = await prisma.profile.findUnique({ where: { username } });
  if (!recipient || recipient.id === profile.id) return;

  const pending = await prisma.projectInvitation.findFirst({
    where: { projectId, recipientId: recipient.id, status: "PENDING" },
  });
  if (pending) return;

  await prisma.projectInvitation.create({
    data: {
      projectId,
      senderId: profile.id,
      recipientId: recipient.id,
      roleName: String(formData.get("roleName") || "Member"),
      message: String(formData.get("message") ?? "").trim() || null,
    },
  });
  await prisma.notification.create({
    data: {
      recipientId: recipient.id,
      actorId: profile.id,
      type: "PROJECT_INVITATION",
      projectId,
    },
  });
  revalidatePath(`/app/projects/${project.slug}`);
}

export async function respondInvitationAction(
  invitationId: string,
  status: "ACCEPTED" | "DECLINED",
) {
  const profile = await requireProfile();
  const invite = await prisma.projectInvitation.findUnique({
    where: { id: invitationId },
    include: { project: true },
  });
  if (!invite || invite.recipientId !== profile.id) return;

  await prisma.projectInvitation.update({
    where: { id: invitationId },
    data: { status },
  });

  if (status === "ACCEPTED") {
    await prisma.projectMember.upsert({
      where: {
        projectId_profileId: {
          projectId: invite.projectId,
          profileId: profile.id,
        },
      },
      update: { roleName: invite.roleName },
      create: {
        projectId: invite.projectId,
        profileId: profile.id,
        roleName: invite.roleName,
      },
    });
    await prisma.projectShowcase.upsert({
      where: {
        profileId_projectId: { profileId: profile.id, projectId: invite.projectId },
      },
      update: {},
      create: { profileId: profile.id, projectId: invite.projectId },
    });
    await logActivity(invite.projectId, profile.id, "joined", "joined the project");
    await prisma.notification.create({
      data: {
        recipientId: invite.project.ownerId,
        actorId: profile.id,
        type: "PROJECT_MEMBER_JOINED",
        projectId: invite.projectId,
      },
    });
  }
  revalidatePath(`/app/projects/${invite.project.slug}`);
  revalidatePath("/app/notifications");
}

export async function createTaskAction(projectId: string, formData: FormData) {
  const profile = await requireProfile();
  const membership = await getMembership(projectId, profile.id);
  if (!membership) return;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;

  await prisma.projectTask.create({
    data: {
      projectId,
      creatorId: profile.id,
      assigneeId,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      priority: (String(formData.get("priority") || "MEDIUM") as TaskPriority),
    },
  });
  if (assigneeId && assigneeId !== profile.id) {
    await prisma.notification.create({
      data: {
        recipientId: assigneeId,
        actorId: profile.id,
        type: "TASK_ASSIGNED",
        projectId,
      },
    });
  }
  await logActivity(projectId, profile.id, "task", `created task: ${title}`);
  revalidatePath(`/app/projects/${project?.slug}/workspace`);
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const profile = await requireProfile();
  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task) return;
  const membership = await getMembership(task.projectId, profile.id);
  if (!membership) return;
  if (
    task.assigneeId !== profile.id &&
    task.creatorId !== profile.id &&
    !isOwnerOrMaintainer(membership.roleName)
  ) {
    return;
  }

  await prisma.projectTask.update({ where: { id: taskId }, data: { status } });
  if (status === "DONE") {
    await logActivity(task.projectId, profile.id, "task", `completed: ${task.title}`);
    const { recordReputationEvent } = await import("@/lib/reputation/events");
    await recordReputationEvent(profile.id, "task_completed", task.id);
  }
  revalidatePath(`/app/projects/${task.project.slug}/workspace`);
}

export async function createDiscussionAction(projectId: string, formData: FormData) {
  const profile = await requireProfile();
  const membership = await getMembership(projectId, profile.id);
  if (!membership) return;
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title || !content) return;
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  await prisma.projectDiscussion.create({
    data: { projectId, authorId: profile.id, title, content },
  });
  await logActivity(projectId, profile.id, "discussion", `opened: ${title}`);
  revalidatePath(`/app/projects/${project?.slug}/workspace`);
}

export async function commentDiscussionAction(discussionId: string, formData: FormData) {
  const profile = await requireProfile();
  const discussion = await prisma.projectDiscussion.findUnique({
    where: { id: discussionId },
    include: { project: true },
  });
  if (!discussion) return;
  const membership = await getMembership(discussion.projectId, profile.id);
  if (!membership) return;
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  await prisma.projectDiscussionComment.create({
    data: { discussionId, authorId: profile.id, content },
  });
  if (discussion.authorId !== profile.id) {
    await prisma.notification.create({
      data: {
        recipientId: discussion.authorId,
        actorId: profile.id,
        type: "PROJECT_DISCUSSION",
        projectId: discussion.projectId,
      },
    });
  }
  revalidatePath(`/app/projects/${discussion.project.slug}/workspace`);
}

export async function updateProjectSettingsAction(projectId: string, formData: FormData) {
  const profile = await requireProfile();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== profile.id) return;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: String(formData.get("name") ?? project.name).trim() || project.name,
      shortDescription:
        String(formData.get("shortDescription") ?? project.shortDescription).trim() ||
        project.shortDescription,
      description: String(formData.get("description") ?? project.description),
      status: String(formData.get("status") || project.status) as ProjectStatus,
      collaborationStatus: String(
        formData.get("collaborationStatus") || project.collaborationStatus,
      ) as CollaborationStatus,
      githubUrl: String(formData.get("githubUrl") ?? "") || null,
    },
  });
  revalidatePath(`/app/projects/${project.slug}`);
}

export async function deleteProjectAction(projectId: string) {
  const profile = await requireProfile();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== profile.id) return;
  await prisma.project.delete({ where: { id: projectId } });
  redirect("/app/projects");
}
