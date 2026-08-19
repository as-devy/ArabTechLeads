export type FeedPost = {
  id: string;
  content: string;
  code: string | null;
  language: string | null;
  createdAt: Date | string;
  authorId: string;
  author: {
    username: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    role: { nameAr: string; nameEn: string } | null;
  };
  community?: {
    slug: string;
    nameAr: string;
    nameEn: string;
    themeColor: string;
    imageUrl: string | null;
  } | null;
  tags: { tag: { name: string } }[];
  _count: { likes: number; comments: number };
  comments: {
    id: string;
    content: string;
    createdAt: Date | string;
    authorId: string;
    author: { username: string | null; fullName: string | null; avatarUrl: string | null };
  }[];
  liked: boolean;
  saved: boolean;
};

export const feedPostInclude = (profileId: string) =>
  ({
    author: { include: { role: true } },
    community: {
      select: { slug: true, nameAr: true, nameEn: true, themeColor: true, imageUrl: true },
    },
    tags: { include: { tag: true } },
    comments: {
      orderBy: { createdAt: "asc" as const },
      take: 8,
      include: { author: true },
    },
    _count: { select: { likes: true, comments: true } },
    likes: { where: { profileId }, select: { profileId: true } },
    savedBy: { where: { profileId }, select: { profileId: true } },
  }) as const;

type FeedPostSource = {
  id: string;
  content: string;
  code: string | null;
  language: string | null;
  createdAt: Date | string;
  authorId: string;
  author: FeedPost["author"];
  community?: FeedPost["community"];
  tags: { tag: { name: string } }[];
  _count: { likes: number; comments: number };
  comments: {
    id: string;
    content: string;
    createdAt: Date | string;
    authorId: string;
    author: { username: string | null; fullName: string | null; avatarUrl: string | null };
  }[];
  likes?: unknown[];
  savedBy?: unknown[];
  liked?: boolean;
  saved?: boolean;
};

function asIso(value: Date | string) {
  return typeof value === "string" ? value : value.toISOString();
}

export function toFeedPost(post: FeedPostSource): FeedPost {
  return {
    id: post.id,
    content: post.content,
    code: post.code,
    language: post.language,
    createdAt: asIso(post.createdAt),
    authorId: post.authorId,
    author: {
      username: post.author.username,
      fullName: post.author.fullName,
      avatarUrl: post.author.avatarUrl,
      role: post.author.role,
    },
    community: post.community ?? null,
    tags: post.tags.map((item) => ({ tag: { name: item.tag.name } })),
    _count: { likes: post._count.likes, comments: post._count.comments },
    comments: post.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: asIso(comment.createdAt),
      authorId: comment.authorId,
      author: {
        username: comment.author.username,
        fullName: comment.author.fullName,
        avatarUrl: comment.author.avatarUrl,
      },
    })),
    liked: post.liked ?? Boolean(post.likes?.length),
    saved: post.saved ?? Boolean(post.savedBy?.length),
  };
}
