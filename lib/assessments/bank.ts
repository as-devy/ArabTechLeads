export type PublicQuestion = {
  id: string;
  prompt: string;
  choices: string[];
};

type BankQuestion = PublicQuestion & { correct: number };

function pack(slug: string, rows: Array<[string, string[], number]>): BankQuestion[] {
  return rows.map(([prompt, choices, correct], i) => ({
    id: `${slug}-${i}`,
    prompt,
    choices,
    correct,
  }));
}

const BANKS: Record<string, BankQuestion[]> = {
  javascript: pack("javascript", [
    ["What does `===` compare?", ["Value only", "Value and type", "Memory address", "Prototype"], 1],
    ["Which creates an array?", ["{}", "[]", "()", "<>"], 1],
    ["`const` bindings are:", ["Reassignable", "Not reassignable", "Always frozen objects", "Global only"], 1],
    ["Promises settle with:", ["then/catch", "goto", "include", "defer"], 0],
    ["`map` returns:", ["The same array mutated", "A new array", "An object", "A Set"], 1],
    ["`null` typeof is:", ["null", "object", "undefined", "void"], 1],
    ["Event loop handles:", ["GPU shaders", "Async callbacks", "SQL indexes", "CSS cascade"], 1],
    ["`JSON.parse` throws on:", ["Valid JSON", "Invalid JSON", "Empty object", "Arrays"], 1],
  ]),
  typescript: pack("typescript", [
    ["TypeScript adds:", ["Runtime types", "Static types", "A new VM", "CSS types"], 1],
    ["`interface` vs `type`:", ["Identical always", "Both describe shapes", "Interfaces are runtime", "Types cannot union"], 1],
    ["`unknown` is safer than:", ["never", "any", "void", "object"], 1],
    ["Generics parameterize:", ["CSS", "Types", "Ports", "Files"], 1],
    ["`as const` makes:", ["Mutable tuples", "Narrow literal types", "Any", "Enums"], 1],
    ["Discriminated unions use:", ["A shared tag field", "Two classes", "CSS", "JSON Schema only"], 0],
    ["`satisfies` checks:", ["Runtime equality", "That a value matches a type", "SQL", "HTTP"], 1],
    ["`.d.ts` files are:", ["Runtime code", "Declaration files", "CSS", "SQL"], 1],
  ]),
  react: pack("react", [
    ["Components should be:", ["Pure when possible", "Always class-based", "Global", "Mutating props"], 0],
    ["State updates are:", ["Always sync", "Scheduled", "SQL", "CSS"], 1],
    ["`useEffect` runs:", ["During render only", "After paint by default", "On the GPU", "In CSS"], 1],
    ["Keys help React:", ["Style CSS", "Reconcile lists", "Query SQL", "Auth"], 1],
    ["Props are:", ["Mutable by child", "Read-only input", "Global store", "Cookies"], 1],
    ["Context avoids:", ["All rerenders", "Prop drilling", "Types", "HTTP"], 1],
    ["Hooks cannot be used:", ["In components", "Conditionally", "In custom hooks", "At top level"], 1],
    ["`memo` helps with:", ["Network", "Skipping rerenders", "SQL", "Fonts"], 1],
  ]),
  "next-js": pack("next-js", [
    ["App Router uses:", ["pages/ only", "app/ directory", "webpack.config required", "PHP"], 1],
    ["Server Components run:", ["Only in the browser", "On the server by default", "In CSS", "In SQL"], 1],
    ["`use client` marks:", ["A database", "A Client Component boundary", "RLS", "A cookie"], 1],
    ["`generateMetadata` is for:", ["SQL", "SEO metadata", "CSS", "WebGL"], 1],
    ["Route handlers live in:", ["route.ts", "hooks.ts", "prisma.ts", "proxy only"], 0],
    ["Streaming improves:", ["TTF of UI", "GPU clocks", "SQL vacuum", "DNSSEC"], 0],
    ["`revalidatePath` is:", ["Client-only", "Cache invalidation", "A CSS reset", "Auth"], 1],
    ["Default fetching in RSC can be:", ["Cached", "Always WebSocket", "FTP", "SMTP"], 0],
  ]),
  "node-js": pack("node-js", [
    ["Node.js is:", ["A browser", "A JS runtime", "A CSS engine", "A SQL dialect"], 1],
    ["`fs` is used for:", ["HTTP cookies", "Filesystem", "GPU", "DNS only"], 1],
    ["EventEmitter pattern is:", ["Pub/sub-like events", "SQL joins", "CSS grid", "TLS only"], 0],
    ["`process.env` holds:", ["Environment variables", "CSS vars", "Prisma models", "JWT only"], 0],
    ["Streams help with:", ["Large I/O", "Fonts", "Flexbox", "SEO titles"], 0],
    ["npm is:", ["A package manager", "A database", "A CSS preprocessor", "A CDN for images only"], 0],
    ["CommonJS `require` is:", ["Browser-only", "A module loader", "SQL", "HTML"], 1],
    ["`async/await` sits on:", ["Promises", "CSS animations", "UDP only", "XML"], 0],
  ]),
  python: pack("python", [
    ["Python blocks use:", ["Braces", "Indentation", "XML", "GOTO"], 1],
    ["Lists are:", ["Immutable", "Mutable sequences", "SQL tables", "CSS"], 1],
    ["`dict` keys must be:", ["Hashable", "Lists", "Sets", "Files"], 0],
    ["`venv` is for:", ["Virtual environments", "CSS", "HTTP/2", "GPU"], 0],
    ["List comprehensions create:", ["New lists", "SQL views", "Threads", "Sockets"], 0],
    ["`None` is:", ["0", "A null-like singleton", "False always in identity", "NaN"], 1],
    ["`pip` installs:", ["Packages", "Kernels", "Fonts", "TLS certs only"], 0],
    ["`with` manages:", ["Context managers", "CSS", "DNS", "Flex"], 0],
  ]),
  sql: pack("sql", [
    ["`SELECT` retrieves:", ["Rows", "CSS", "GPU buffers", "TLS keys"], 0],
    ["`JOIN` combines:", ["Tables", "CSS files", "Git commits", "JSON only"], 0],
    ["Primary keys:", ["Must be unique", "Can duplicate", "Are optional always", "Are CSS"], 0],
    ["`WHERE` filters:", ["Before grouping typically", "CSS", "TLS", "Fonts"], 0],
    ["Indexes speed:", ["Lookups", "Monitor Hz", "Flexbox", "DNS"], 0],
    ["`NULL` means:", ["0", "Unknown/absent", "Empty string", "False"], 1],
    ["Transactions provide:", ["ACID properties", "CSS cascade", "JWT", "Sitemaps"], 0],
    ["`GROUP BY` is for:", ["Aggregates", "Flex wrap", "Git rebase", "SMTP"], 0],
  ]),
  git: pack("git", [
    ["`git commit` records:", ["A snapshot", "A CSS file", "SQL vacuum", "DNS"], 0],
    ["Branches are:", ["Pointers to commits", "Databases", "CSS layers", "IPs"], 0],
    ["`git merge` combines:", ["Histories", "SQL schemas", "Fonts", "TLS"], 0],
    ["`.gitignore` excludes:", ["Tracked secrets ideally listed", "The entire repo always", "Commits", "Remotes"], 0],
    ["`git pull` typically:", ["Fetches and integrates", "Drops the DB", "Restarts nginx", "Compiles C"], 0],
    ["A remote is:", ["Another repository", "A CSS unit", "A JWT", "A GPU"], 0],
    ["`git rebase` rewrites:", ["Commit history", "SQL WAL", "DNS", "HTML"], 0],
    ["PRs are for:", ["Reviewing changes", "CSS minification", "SMTP", "RAID"], 0],
  ]),
  docker: pack("docker", [
    ["A container is:", ["An isolated process set", "A VM hypervisor always", "A CSS grid", "A SQL index"], 0],
    ["Dockerfile defines:", ["Image build steps", "Kubernetes only", "DNS zones", "JWT"], 0],
    ["Images are:", ["Layered filesystems", "SQL dumps", "Fonts", "TLS CAs"], 0],
    ["`docker compose` orchestrates:", ["Multi-container apps", "CSS", "Git LFS", "SMTP"], 0],
    ["Volumes persist:", ["Data", "CPU caches only", "DNS", "Flex"], 0],
    ["`EXPOSE` documents:", ["Ports", "SQL ports only", "CSS", "GPU"], 0],
    ["Registries store:", ["Images", "Commits", "Sitemaps", "Fonts"], 0],
    ["PID 1 in a container is:", ["The main process", "systemd always", "cron", "sshd"], 0],
  ]),
  html: pack("html", [
    ["HTML describes:", ["Document structure", "GPU shaders", "SQL plans", "TLS"], 0],
    ["Semantic tags help:", ["Accessibility and meaning", "Database indexes", "Git", "RAID"], 0],
    ["`alt` on images is for:", ["Accessible text", "SEO cookies", "SQL", "WebGL"], 0],
    ["Forms submit via:", ["HTTP methods", "SSH", "SMTP only", "FTP only"], 0],
    ["`label` should:", ["Associate with controls", "Replace CSS", "Store JWT", "Index SQL"], 0],
    ["Landmarks include:", ["header/nav/main", "div only", "span only", "table only"], 0],
    ["`lang` attribute helps:", ["Screen readers and i18n", "SQL collation only", "GPU", "DNS"], 0],
    ["Buttons in forms should have:", ["type specified", "SQL", "TLS", "Flex"], 0],
  ]),
  css: pack("css", [
    ["CSS cascade means:", ["Origin/specificity/order", "SQL joins", "Git merge", "TLS"], 0],
    ["Flexbox is for:", ["One-dimensional layout", "3D shaders", "SQL", "DNS"], 0],
    ["Grid is for:", ["Two-dimensional layout", "Auth", "SMTP", "RAID"], 0],
    ["`rem` is relative to:", ["Root font size", "Parent always", "Viewport only", "GPU"], 0],
    ["Media queries adapt:", ["Viewport conditions", "SQL", "Git", "JWT"], 0],
    ["`dir: rtl` affects:", ["Inline direction", "SQL ORDER", "Git", "TLS"], 0],
    ["Specificity ranks:", ["Selectors", "Commits", "Pods", "MX records"], 0],
    ["`clamp()` helps:", ["Fluid sizing", "SQL", "SSH", "SMTP"], 0],
  ]),
};

export const ASSESSMENT_SKILLS = Object.keys(BANKS);

export function getPublicQuestions(slug: string): PublicQuestion[] | null {
  const bank = BANKS[slug];
  if (!bank) return null;
  return bank.map(({ id, prompt, choices }) => ({ id, prompt, choices }));
}

export function scoreAttempt(slug: string, answers: Record<string, number>) {
  const bank = BANKS[slug];
  if (!bank) return null;
  let score = 0;
  for (const q of bank) {
    if (answers[q.id] === q.correct) score += 1;
  }
  const total = bank.length;
  const passed = score / total >= 0.7;
  return { score, total, passed };
}
