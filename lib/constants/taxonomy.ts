export const ROLES = [
  { id: "frontend_developer", nameAr: "مطور واجهات", nameEn: "Frontend Developer" },
  { id: "backend_developer", nameAr: "مطور خلفية", nameEn: "Backend Developer" },
  { id: "fullstack_developer", nameAr: "مطور كامل", nameEn: "Full Stack Developer" },
  { id: "mobile_developer", nameAr: "مطور تطبيقات جوال", nameEn: "Mobile Developer" },
  { id: "software_engineer", nameAr: "مهندس برمجيات", nameEn: "Software Engineer" },
  { id: "devops_engineer", nameAr: "مهندس DevOps", nameEn: "DevOps Engineer" },
  { id: "cloud_engineer", nameAr: "مهندس سحابة", nameEn: "Cloud Engineer" },
  { id: "cybersecurity_engineer", nameAr: "مهندس أمن سيبراني", nameEn: "Cybersecurity Engineer" },
  { id: "ai_engineer", nameAr: "مهندس ذكاء اصطناعي", nameEn: "AI / Machine Learning Engineer" },
  { id: "data_engineer", nameAr: "مهندس بيانات", nameEn: "Data Engineer" },
  { id: "uiux_designer", nameAr: "مصمم UI/UX", nameEn: "UI/UX Designer" },
  { id: "qa_engineer", nameAr: "مهندس جودة", nameEn: "QA Engineer" },
  { id: "technical_writer", nameAr: "كاتب تقني", nameEn: "Technical Writer" },
  { id: "tech_entrepreneur", nameAr: "رائد أعمال تقني", nameEn: "Tech Entrepreneur" },
  { id: "student", nameAr: "طالب", nameEn: "Student" },
  { id: "other", nameAr: "أخرى", nameEn: "Other" },
] as const;

export const SKILLS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C#",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Kotlin",
  "Swift",
  "C++",
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Svelte",
  "Flutter",
  "React Native",
  "Node.js",
  "Django",
  "Laravel",
  "Spring",
  "Express",
  "NestJS",
  "FastAPI",
  "PostgreSQL",
  "MongoDB",
  "MySQL",
  "Redis",
  "Supabase",
  "Firebase",
  "Prisma",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Linux",
  "Git",
  "GraphQL",
  "Tailwind CSS",
  "Figma",
] as const;

export const SKILL_CATEGORY_ORDER = [
  "languages",
  "frontend",
  "backend",
  "database",
  "devops",
  "other",
] as const;

export type SkillCategoryId = (typeof SKILL_CATEGORY_ORDER)[number];

export const SKILL_CATEGORIES: Record<
  Exclude<SkillCategoryId, "other">,
  readonly string[]
> = {
  languages: [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C#",
    "Go",
    "Rust",
    "PHP",
  ],
  frontend: ["React", "Next.js", "Flutter"],
  backend: ["Node.js", "Django", "Laravel"],
  database: ["PostgreSQL", "MongoDB", "Supabase"],
  devops: ["Docker", "AWS"],
};

export const POPULAR_SKILL_NAMES = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
] as const;

export function getSkillCategory(name: string): SkillCategoryId {
  const normalized = name.trim();
  for (const id of SKILL_CATEGORY_ORDER) {
    if (id === "other") continue;
    if (SKILL_CATEGORIES[id].some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      return id;
    }
  }
  return "other";
}

export const INTERESTS = [
  { slug: "ai", nameAr: "الذكاء الاصطناعي", nameEn: "Artificial Intelligence" },
  { slug: "cybersecurity", nameAr: "الأمن السيبراني", nameEn: "Cybersecurity" },
  { slug: "web-development", nameAr: "تطوير الويب", nameEn: "Web Development" },
  { slug: "cloud", nameAr: "Cloud", nameEn: "Cloud" },
  { slug: "devops", nameAr: "DevOps", nameEn: "DevOps" },
  { slug: "open-source", nameAr: "Open Source", nameEn: "Open Source" },
  { slug: "startups", nameAr: "Startups", nameEn: "Startups" },
  { slug: "uiux", nameAr: "UI/UX", nameEn: "UI/UX" },
  { slug: "mobile", nameAr: "تطوير الجوال", nameEn: "Mobile Development" },
] as const;

export const ARAB_COUNTRIES = [
  { code: "EG", nameAr: "مصر", nameEn: "Egypt" },
  { code: "SA", nameAr: "السعودية", nameEn: "Saudi Arabia" },
  { code: "AE", nameAr: "الإمارات", nameEn: "United Arab Emirates" },
  { code: "QA", nameAr: "قطر", nameEn: "Qatar" },
  { code: "KW", nameAr: "الكويت", nameEn: "Kuwait" },
  { code: "BH", nameAr: "البحرين", nameEn: "Bahrain" },
  { code: "OM", nameAr: "عمان", nameEn: "Oman" },
  { code: "JO", nameAr: "الأردن", nameEn: "Jordan" },
  { code: "LB", nameAr: "لبنان", nameEn: "Lebanon" },
  { code: "SY", nameAr: "سوريا", nameEn: "Syria" },
  { code: "IQ", nameAr: "العراق", nameEn: "Iraq" },
  { code: "PS", nameAr: "فلسطين", nameEn: "Palestine" },
  { code: "YE", nameAr: "اليمن", nameEn: "Yemen" },
  { code: "SD", nameAr: "السودان", nameEn: "Sudan" },
  { code: "LY", nameAr: "ليبيا", nameEn: "Libya" },
  { code: "TN", nameAr: "تونس", nameEn: "Tunisia" },
  { code: "DZ", nameAr: "الجزائر", nameEn: "Algeria" },
  { code: "MA", nameAr: "المغرب", nameEn: "Morocco" },
  { code: "MR", nameAr: "موريتانيا", nameEn: "Mauritania" },
  { code: "SO", nameAr: "الصومال", nameEn: "Somalia" },
  { code: "DJ", nameAr: "جيبوتي", nameEn: "Djibouti" },
  { code: "KM", nameAr: "جزر القمر", nameEn: "Comoros" },
] as const;

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[#.+]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
