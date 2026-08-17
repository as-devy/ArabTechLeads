import { cn } from "@/lib/utils";
import { CommunityMark } from "@/components/communities/community-mark";
import { resolveThemeColor } from "@/lib/communities/theme";

type Identity = {
  slug: string;
  name: string;
  themeColor?: string | null;
  imageUrl?: string | null;
};

export function CommunityAvatar({
  community,
  size = "md",
  className,
}: {
  community: Identity;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const color = resolveThemeColor(community.slug, community.themeColor);
  const box = {
    sm: "size-9",
    md: "size-11",
    lg: "size-16",
    xl: "size-24",
  }[size];

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-2xl shadow-sm ring-2 ring-background",
        box,
        className,
      )}
    >
      {community.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={community.imageUrl} alt={community.name} className="size-full object-cover" />
      ) : (
        <CommunityMark slug={community.slug} color={color} className="block size-full" />
      )}
    </span>
  );
}

export function CommunityBanner({
  community,
  className,
  compact = false,
}: {
  community: Identity;
  className?: string;
  compact?: boolean;
}) {
  const color = resolveThemeColor(community.slug, community.themeColor);
  return (
    <div
      className={cn("relative overflow-hidden", compact ? "h-24" : "h-40 sm:h-48", className)}
      style={{
        background: `linear-gradient(180deg, ${color} 0%, color-mix(in oklab, ${color} 82%, #0b1220) 100%)`,
      }}
    />
  );
}
