"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireProfile } from "@/lib/auth/session";
import { ASSESSMENT_SKILLS, getPublicQuestions, scoreAttempt } from "@/lib/assessments/bank";
import { recordReputationEvent } from "@/lib/reputation/events";
import { isBlockedPair } from "@/lib/trust/moderation";
import { prisma } from "@/lib/prisma";

async function notify(
  recipientId: string,
  actorId: string,
  type:
    | "ENDORSEMENT"
    | "RECOMMENDATION"
    | "SKILL_VERIFIED"
    | "HACKATHON_RESULT"
    | "MODERATION",
) {
  if (recipientId === actorId) return;
  await prisma.notification.create({
    data: { recipientId, actorId, type },
  });
}

export async function endorseSkillAction(recipientId: string, skillId: string, projectId?: string) {
  const me = await requireProfile();
  if (me.id === recipientId) return { error: "self" };
  if (await isBlockedPair(me.id, recipientId)) return { error: "blocked" };

  try {
    await prisma.skillEndorsement.create({
      data: {
        endorserId: me.id,
        recipientId,
        skillId,
        projectId: projectId || null,
      },
    });
  } catch {
    return { error: "duplicate" };
  }
  await recordReputationEvent(recipientId, "endorsement_received", `${me.id}:${skillId}`);
  await notify(recipientId, me.id, "ENDORSEMENT");
  revalidatePath("/app/developers");
  return { ok: true };
}

export async function writeRecommendationAction(recipientId: string, formData: FormData) {
  const me = await requireProfile();
  if (me.id === recipientId) return { error: "self" };
  if (await isBlockedPair(me.id, recipientId)) return { error: "blocked" };
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 20) return { error: "short" };
  const projectId = String(formData.get("projectId") ?? "") || null;

  await prisma.professionalRecommendation.create({
    data: {
      authorId: me.id,
      recipientId,
      body,
      projectId,
    },
  });
  await notify(recipientId, me.id, "RECOMMENDATION");
  revalidatePath("/app/developers");
  return { ok: true };
}

export async function respondRecommendationAction(
  id: string,
  status: "ACCEPTED" | "DECLINED" | "HIDDEN",
) {
  const me = await requireProfile();
  const rec = await prisma.professionalRecommendation.findUnique({ where: { id } });
  if (!rec || rec.recipientId !== me.id) return;
  await prisma.professionalRecommendation.update({ where: { id }, data: { status } });
  if (status === "ACCEPTED") {
    await recordReputationEvent(me.id, "recommendation_accepted", id);
  }
  revalidatePath("/app/developers");
}

export async function startAssessmentAction(skillSlug: string) {
  const me = await requireProfile();
  if (!ASSESSMENT_SKILLS.includes(skillSlug)) return { error: "unknown" };
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const attempts = await prisma.assessmentAttempt.count({
    where: { profileId: me.id, skillSlug, startedAt: { gte: dayAgo } },
  });
  if (attempts >= 3) return { error: "limit" };
  return { questions: getPublicQuestions(skillSlug) };
}

export async function submitAssessmentAction(skillSlug: string, answers: Record<string, number>) {
  const me = await requireProfile();
  const result = scoreAttempt(skillSlug, answers);
  if (!result) return { error: "unknown" };

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const attempts = await prisma.assessmentAttempt.count({
    where: { profileId: me.id, skillSlug, startedAt: { gte: dayAgo } },
  });
  if (attempts >= 3) return { error: "limit" };

  await prisma.assessmentAttempt.create({
    data: {
      profileId: me.id,
      skillSlug,
      score: result.score,
      passed: result.passed,
      completedAt: new Date(),
    },
  });

  if (result.passed) {
    const skill = await prisma.skill.findUnique({ where: { slug: skillSlug } });
    if (skill) {
      await prisma.skillVerification.upsert({
        where: { profileId_skillId: { profileId: me.id, skillId: skill.id } },
        update: { score: result.score },
        create: { profileId: me.id, skillId: skill.id, score: result.score },
      });
      await recordReputationEvent(me.id, "skill_verified", skill.id);
      const badge = await prisma.achievement.upsert({
        where: { slug: "verified-skill" },
        update: {},
        create: {
          slug: "verified-skill",
          nameAr: "مهارة موثّقة",
          nameEn: "Verified skill",
        },
      });
      await prisma.userAchievement.upsert({
        where: {
          profileId_achievementId: { profileId: me.id, achievementId: badge.id },
        },
        update: {},
        create: { profileId: me.id, achievementId: badge.id },
      });
    }
  }

  revalidatePath("/app/verification");
  return result;
}

export async function blockUserAction(targetId: string) {
  const me = await requireProfile();
  if (me.id === targetId) return;
  await prisma.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId: me.id, blockedId: targetId } },
    update: {},
    create: { blockerId: me.id, blockedId: targetId },
  });
  revalidatePath("/app/developers");
}

export async function muteEntityAction(entityType: string, entityId: string) {
  const me = await requireProfile();
  await prisma.userMute.upsert({
    where: {
      profileId_entityType_entityId: { profileId: me.id, entityType, entityId },
    },
    update: {},
    create: { profileId: me.id, entityType, entityId },
  });
  revalidatePath("/app");
}

export async function createMilestoneAction(projectId: string, formData: FormData) {
  const me = await requireProfile();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== me.id) return;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await prisma.projectMilestone.create({
    data: {
      projectId,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
    },
  });
  revalidatePath(`/app/projects/${project.slug}/workspace`);
}

export async function createIssueAction(projectId: string, formData: FormData) {
  const me = await requireProfile();
  const member = await prisma.projectMember.findUnique({
    where: { projectId_profileId: { projectId, profileId: me.id } },
  });
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || (!member && project.ownerId !== me.id)) return;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) return;
  await prisma.projectIssue.create({
    data: {
      projectId,
      creatorId: me.id,
      title,
      description,
      priority: (String(formData.get("priority") || "MEDIUM") as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"),
    },
  });
  revalidatePath(`/app/projects/${project.slug}/workspace`);
}

export async function commentIssueAction(issueId: string, formData: FormData) {
  const me = await requireProfile();
  const issue = await prisma.projectIssue.findUnique({
    where: { id: issueId },
    include: { project: true },
  });
  if (!issue) return;
  const member = await prisma.projectMember.findUnique({
    where: { projectId_profileId: { projectId: issue.projectId, profileId: me.id } },
  });
  if (!member && issue.project.ownerId !== me.id) return;
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await prisma.projectIssueComment.create({
    data: { issueId, profileId: me.id, body },
  });
  revalidatePath(`/app/projects/${issue.project.slug}/workspace`);
}

export async function createReleaseAction(projectId: string, formData: FormData) {
  const me = await requireProfile();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== me.id) return;
  const version = String(formData.get("version") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!version || !title || !description) return;
  await prisma.projectRelease.create({
    data: {
      projectId,
      version,
      title,
      description,
      githubUrl: String(formData.get("githubUrl") ?? "").trim() || null,
    },
  });
  revalidatePath(`/app/projects/${project.slug}`);
}

export async function saveProjectDocAction(projectId: string, formData: FormData) {
  const me = await requireProfile();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== me.id) return;
  const section = String(formData.get("section") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!section || !body) return;
  await prisma.projectDoc.upsert({
    where: { projectId_section: { projectId, section } },
    update: { body },
    create: { projectId, section, body },
  });
  revalidatePath(`/app/projects/${project.slug}/workspace`);
}

export async function submitHackathonProjectAction(hackathonId: string, formData: FormData) {
  const me = await requireProfile();
  const projectId = String(formData.get("projectId") ?? "");
  const member = await prisma.projectMember.findUnique({
    where: { projectId_profileId: { projectId, profileId: me.id } },
  });
  if (!member) return;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) return;
  await prisma.hackathonSubmission.upsert({
    where: { hackathonId_projectId: { hackathonId, projectId } },
    update: {
      title,
      description,
      demoUrl: String(formData.get("demoUrl") ?? "") || null,
      repoUrl: String(formData.get("repoUrl") ?? "") || null,
      presentationUrl: String(formData.get("presentationUrl") ?? "") || null,
      status: "SUBMITTED",
    },
    create: {
      hackathonId,
      projectId,
      title,
      description,
      demoUrl: String(formData.get("demoUrl") ?? "") || null,
      repoUrl: String(formData.get("repoUrl") ?? "") || null,
      presentationUrl: String(formData.get("presentationUrl") ?? "") || null,
      status: "SUBMITTED",
    },
  });
  await recordReputationEvent(me.id, "hackathon_participation", hackathonId);
  revalidatePath("/app/hackathons");
}

export async function awardFirstPlaceAction(submissionId: string) {
  await publishHackathonResultAction(submissionId, 1);
}

export async function publishHackathonResultAction(
  submissionId: string,
  place: number,
  award?: string,
) {
  const me = await requireProfile();
  const sub = await prisma.hackathonSubmission.findUnique({
    where: { id: submissionId },
    include: { hackathon: true, project: { include: { members: true } } },
  });
  if (!sub || sub.hackathon.organizerId !== me.id) return;
  await prisma.hackathonSubmission.update({
    where: { id: submissionId },
    data: {
      place,
      award: award || null,
      status: place === 1 ? "WINNER" : "FINALIST",
    },
  });
  const badge = await prisma.achievement.upsert({
    where: { slug: "hackathon-winner" },
    update: {},
    create: {
      slug: "hackathon-winner",
      nameAr: "فائز في هاكاثون",
      nameEn: "Hackathon winner",
    },
  });
  if (place === 1) {
    for (const m of sub.project.members) {
      await prisma.userAchievement.upsert({
        where: {
          profileId_achievementId: { profileId: m.profileId, achievementId: badge.id },
        },
        update: {},
        create: { profileId: m.profileId, achievementId: badge.id },
      });
      await notify(m.profileId, me.id, "HACKATHON_RESULT");
    }
  }
  revalidatePath("/app/hackathons");
}

export async function reportEntityAction(entityType: string, entityId: string, formData: FormData) {
  const me = await requireProfile();
  await prisma.report.create({
    data: {
      reporterId: me.id,
      entityType,
      entityId,
      reason: String(formData.get("reason") ?? "other"),
      description: String(formData.get("description") ?? "").trim() || null,
    },
  });
}

export async function adminResolveReportAction(reportId: string, status: "RESOLVED" | "DISMISSED") {
  const admin = await requireAdmin();
  await prisma.report.update({ where: { id: reportId }, data: { status } });
  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: `report_${status.toLowerCase()}`,
      target: reportId,
    },
  });
  revalidatePath("/admin");
}

export async function adminSuspendUserAction(profileId: string, reason: string) {
  const admin = await requireAdmin();
  await prisma.profile.update({
    where: { id: profileId },
    data: { suspendedAt: new Date() },
  });
  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: "suspend_user",
      target: profileId,
      reason,
    },
  });
  await prisma.notification.create({
    data: {
      recipientId: profileId,
      actorId: admin.id,
      type: "MODERATION",
    },
  });
  revalidatePath("/admin");
}

export async function adminUnsuspendUserAction(profileId: string) {
  const admin = await requireAdmin();
  await prisma.profile.update({
    where: { id: profileId },
    data: { suspendedAt: null },
  });
  await prisma.adminAuditLog.create({
    data: { adminId: admin.id, action: "unsuspend_user", target: profileId },
  });
  revalidatePath("/admin");
}

export async function trackAnalyticsEvent(profileId: string, kind: string) {
  await prisma.analyticsEvent.create({ data: { profileId, kind } });
}

export async function createProjectFromTemplateAction(template: string) {
  const me = await requireProfile();
  const presets: Record<string, { type: "OPEN_SOURCE" | "STARTUP" | "HACKATHON" | "LEARNING" | "PORTFOLIO"; name: string }> = {
    oss: { type: "OPEN_SOURCE", name: "Open Source Project" },
    mvp: { type: "STARTUP", name: "Startup MVP" },
    hack: { type: "HACKATHON", name: "Hackathon Project" },
    learn: { type: "LEARNING", name: "Learning Project" },
    portfolio: { type: "PORTFOLIO", name: "Portfolio Project" },
  };
  const preset = presets[template];
  if (!preset) return;
  const slug = `${template}-${me.username ?? "dev"}-${Date.now().toString(36)}`;
  const project = await prisma.project.create({
    data: {
      ownerId: me.id,
      name: preset.name,
      slug,
      shortDescription: preset.name,
      description: preset.name,
      projectType: preset.type,
      members: { create: { profileId: me.id, roleName: "owner" } },
    },
  });
  await prisma.projectTask.createMany({
    data: [
      { projectId: project.id, creatorId: me.id, title: "Define scope" },
      { projectId: project.id, creatorId: me.id, title: "Set up repository" },
      { projectId: project.id, creatorId: me.id, title: "Publish first milestone" },
    ],
  });
  revalidatePath("/app/projects");
  redirect(`/app/projects/${project.slug}`);
}
