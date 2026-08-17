"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/constants/taxonomy";
import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

async function uniqueSlug(model: "job" | "freelance" | "event" | "hackathon" | "company", base: string) {
  let slug = slugify(base) || `${model}-${randomUUID().slice(0, 8)}`;
  for (let n = 0; n < 20; n++) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const exists =
      model === "job"
        ? await prisma.job.findUnique({ where: { slug: candidate } })
        : model === "freelance"
          ? await prisma.freelanceOpportunity.findUnique({ where: { slug: candidate } })
          : model === "event"
            ? await prisma.event.findUnique({ where: { slug: candidate } })
            : model === "hackathon"
              ? await prisma.hackathon.findUnique({ where: { slug: candidate } })
              : await prisma.company.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
  }
  return `${slug}-${randomUUID().slice(0, 6)}`;
}

export async function applyToJobAction(jobId: string, formData: FormData) {
  const profile = await requireProfile();
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "PUBLISHED") return;
  await prisma.jobApplication.upsert({
    where: { jobId_profileId: { jobId, profileId: profile.id } },
    update: {
      coverMessage: String(formData.get("coverMessage") ?? "").trim() || null,
      resumeUrl: String(formData.get("resumeUrl") ?? profile.resumeUrl ?? "") || null,
      portfolioUrl: String(formData.get("portfolioUrl") ?? profile.portfolioUrl ?? "") || null,
    },
    create: {
      jobId,
      profileId: profile.id,
      coverMessage: String(formData.get("coverMessage") ?? "").trim() || null,
      resumeUrl: String(formData.get("resumeUrl") ?? profile.resumeUrl ?? "") || null,
      portfolioUrl: String(formData.get("portfolioUrl") ?? profile.portfolioUrl ?? "") || null,
    },
  });
  await prisma.notification.create({
    data: {
      recipientId: job.createdById,
      actorId: profile.id,
      type: "JOB_APPLICATION",
    },
  });
  revalidatePath("/app/jobs");
}

export async function submitFreelanceProposalAction(opportunityId: string, formData: FormData) {
  const profile = await requireProfile();
  const gig = await prisma.freelanceOpportunity.findUnique({ where: { id: opportunityId } });
  if (!gig) return;
  await prisma.freelanceProposal.upsert({
    where: { opportunityId_profileId: { opportunityId, profileId: profile.id } },
    update: { message: String(formData.get("message") ?? "").trim() },
    create: {
      opportunityId,
      profileId: profile.id,
      message: String(formData.get("message") ?? "").trim() || "Proposal",
      estimatedPrice: Number(formData.get("estimatedPrice") || 0) || null,
      estimatedDuration: String(formData.get("estimatedDuration") ?? "") || null,
    },
  });
  revalidatePath("/app/freelance");
}

export async function requestMentorshipAction(mentorId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.id === mentorId) return;
  const existing = await prisma.mentorshipRequest.findFirst({
    where: { mentorId, menteeId: profile.id, status: "PENDING" },
  });
  if (existing) return;
  await prisma.mentorshipRequest.create({
    data: {
      mentorId,
      menteeId: profile.id,
      topic: String(formData.get("topic") ?? "").trim() || "Mentorship",
      message: String(formData.get("message") ?? "").trim() || "",
      preferredTime: String(formData.get("preferredTime") ?? "") || null,
    },
  });
  await prisma.notification.create({
    data: { recipientId: mentorId, actorId: profile.id, type: "MENTORSHIP_REQUEST" },
  });
  revalidatePath("/app/mentorship");
}

export async function respondMentorshipAction(id: string, status: "ACCEPTED" | "REJECTED") {
  const profile = await requireProfile();
  await prisma.mentorshipRequest.updateMany({
    where: { id, mentorId: profile.id, status: "PENDING" },
    data: { status },
  });
  revalidatePath("/app/mentorship");
}

export async function registerEventAction(eventId: string) {
  const profile = await requireProfile();
  await prisma.eventRegistration.upsert({
    where: { eventId_profileId: { eventId, profileId: profile.id } },
    update: {},
    create: { eventId, profileId: profile.id },
  });
  revalidatePath("/app/events");
}

export async function unregisterEventAction(eventId: string) {
  const profile = await requireProfile();
  await prisma.eventRegistration.deleteMany({
    where: { eventId, profileId: profile.id },
  });
  revalidatePath("/app/events");
}

export async function createHackathonTeamAction(hackathonId: string, formData: FormData) {
  const profile = await requireProfile();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.hackathonTeam.create({
    data: {
      hackathonId,
      creatorId: profile.id,
      name,
      description: String(formData.get("description") ?? "") || null,
      members: { create: { profileId: profile.id, role: "owner" } },
    },
  });
  revalidatePath("/app/hackathons");
}

export async function requestHackathonTeamAction(teamId: string, formData: FormData) {
  const profile = await requireProfile();
  await prisma.hackathonTeamRequest.create({
    data: {
      teamId,
      profileId: profile.id,
      message: String(formData.get("message") ?? "") || null,
    },
  });
  revalidatePath("/app/hackathons");
}

export async function createCompanyAction(formData: FormData) {
  const profile = await requireProfile();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const slug = await uniqueSlug("company", name);
  await prisma.company.create({
    data: {
      name,
      slug,
      description: String(formData.get("description") ?? "") || null,
      industry: String(formData.get("industry") ?? "") || null,
      location: String(formData.get("location") ?? "") || null,
      website: String(formData.get("website") ?? "") || null,
      createdById: profile.id,
      members: { create: { profileId: profile.id, role: "owner" } },
    },
  });
  redirect(`/app/companies/${slug}`);
}

export async function createJobAction(formData: FormData) {
  const profile = await requireProfile();
  const title = String(formData.get("title") ?? "").trim();
  const companyId = String(formData.get("companyId") ?? "");
  if (!title || !companyId) return;
  const member = await prisma.companyMember.findUnique({
    where: { companyId_profileId: { companyId, profileId: profile.id } },
  });
  if (!member) return;
  const slug = await uniqueSlug("job", title);
  await prisma.job.create({
    data: {
      companyId,
      createdById: profile.id,
      title,
      slug,
      description: String(formData.get("description") ?? "").trim() || title,
      employmentType: (String(formData.get("employmentType") || "FULL_TIME") as never),
      workMode: (String(formData.get("workMode") || "REMOTE") as never),
      location: String(formData.get("location") ?? "") || null,
      experienceLevel: String(formData.get("experienceLevel") ?? "") || null,
      applicationUrl: String(formData.get("applicationUrl") ?? "") || null,
    },
  });
  redirect(`/app/jobs/${slug}`);
}

export async function createFreelanceAction(formData: FormData) {
  const profile = await requireProfile();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const slug = await uniqueSlug("freelance", title);
  await prisma.freelanceOpportunity.create({
    data: {
      creatorId: profile.id,
      title,
      slug,
      description: String(formData.get("description") ?? "").trim() || title,
      budgetType: (String(formData.get("budgetType") || "FIXED") as never),
      budgetMin: Number(formData.get("budgetMin") || 0) || null,
      budgetMax: Number(formData.get("budgetMax") || 0) || null,
      duration: String(formData.get("duration") ?? "") || null,
    },
  });
  redirect(`/app/freelance/${slug}`);
}

export async function createEventAction(formData: FormData) {
  const profile = await requireProfile();
  const title = String(formData.get("title") ?? "").trim();
  const startAt = String(formData.get("startAt") ?? "");
  if (!title || !startAt) return;
  const slug = await uniqueSlug("event", title);
  await prisma.event.create({
    data: {
      organizerId: profile.id,
      title,
      slug,
      description: String(formData.get("description") ?? "").trim() || title,
      startAt: new Date(startAt),
      location: String(formData.get("location") ?? "") || null,
      isOnline: String(formData.get("isOnline") ?? "") === "yes",
    },
  });
  redirect(`/app/events/${slug}`);
}

export async function updateCareerSettingsAction(formData: FormData) {
  const profile = await requireProfile();
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      headline: String(formData.get("headline") ?? "") || null,
      resumeUrl: String(formData.get("resumeUrl") ?? "") || null,
      openToWork: formData.get("openToWork") === "on",
      openToFreelance: formData.get("openToFreelance") === "on",
      openToMentorship: formData.get("openToMentorship") === "on",
      employmentPreference: String(formData.get("employmentPreference") ?? "") || null,
      workModePreference: String(formData.get("workModePreference") ?? "") || null,
    },
  });
  if (formData.get("openToMentorship") === "on") {
    await prisma.mentorProfile.upsert({
      where: { profileId: profile.id },
      update: { isActive: true, bio: String(formData.get("mentorBio") ?? "") || null },
      create: {
        profileId: profile.id,
        isActive: true,
        bio: String(formData.get("mentorBio") ?? "") || null,
        topics: ["Next.js", "TypeScript"],
        languages: ["العربية", "English"],
      },
    });
  }
  revalidatePath("/app/settings");
}

export async function addCertificationAction(formData: FormData) {
  const profile = await requireProfile();
  const name = String(formData.get("certName") ?? "").trim();
  const issuer = String(formData.get("certIssuer") ?? "").trim();
  if (!name || !issuer) return;
  await prisma.certification.create({
    data: { profileId: profile.id, name, issuer, credentialUrl: String(formData.get("certUrl") ?? "") || null },
  });
  revalidatePath("/app/settings");
}

export async function updateApplicationStatusAction(id: string, status: "REVIEWING" | "SHORTLISTED" | "REJECTED" | "ACCEPTED") {
  const profile = await requireProfile();
  const app = await prisma.jobApplication.findUnique({
    where: { id },
    include: { job: true },
  });
  if (!app || app.job.createdById !== profile.id) return;
  await prisma.jobApplication.update({ where: { id }, data: { status } });
  revalidatePath("/app/employer");
}
