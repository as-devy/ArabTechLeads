import { FEED_TOPIC_TAGS, INTERESTS, SKILLS, slugify } from "@/lib/constants/taxonomy";
import { prisma } from "@/lib/prisma";
import { FEED_CONFIG } from "./config";

let tagsReady = false;

export function catalogTagDefs() {
  const bySlug = new Map<string, { slug: string; name: string }>();
  for (const name of SKILLS) {
    bySlug.set(slugify(name), { slug: slugify(name), name });
  }
  for (const interest of INTERESTS) {
    bySlug.set(interest.slug, { slug: interest.slug, name: interest.nameEn });
  }
  for (const tag of FEED_TOPIC_TAGS) {
    bySlug.set(tag.slug, tag);
  }
  return [...bySlug.values()];
}

export async function ensureFeedTags() {
  if (tagsReady) return;
  const defs = catalogTagDefs();
  await Promise.all(
    defs.map((tag) =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: { name: tag.name },
        create: { slug: tag.slug, name: tag.name },
      }),
    ),
  );
  tagsReady = true;
}

export async function listFeedTags() {
  await ensureFeedTags();
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true },
  });
}

export function detectTagSlugs(text: string, language?: string | null) {
  const haystack = `${text} ${language ?? ""}`.toLowerCase();
  const matched = new Set<string>();
  for (const def of catalogTagDefs()) {
    const name = def.name.toLowerCase();
    const slug = def.slug.toLowerCase();
    if (haystack.includes(name) || haystack.includes(slug.replace(/-/g, " "))) {
      matched.add(def.slug);
    }
  }
  return [...matched].slice(0, FEED_CONFIG.maxTagsPerPost);
}

export async function resolveTagIds(slugs: string[]) {
  await ensureFeedTags();
  const unique = [...new Set(slugs.map((slug) => slugify(slug)).filter(Boolean))];
  if (unique.length === 0) return [];
  const tags = await prisma.tag.findMany({
    where: { slug: { in: unique } },
    select: { id: true, slug: true },
  });
  return tags.map((tag) => tag.id);
}

export async function attachPostTags(postId: string, slugs: string[]) {
  const tagIds = await resolveTagIds(slugs);
  if (tagIds.length === 0) return;
  await prisma.postTag.createMany({
    data: tagIds.map((tagId) => ({ postId, tagId })),
    skipDuplicates: true,
  });
}
