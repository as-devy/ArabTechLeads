import type { ReactNode } from "react";

type MarkProps = { color: string };

function Frame({ color, children }: { color: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 80 80" className="size-full" aria-hidden>
      <rect width="80" height="80" rx="22" fill={color} />
      <circle cx="24" cy="18" r="28" fill="#fff" opacity="0.18" />
      {children}
    </svg>
  );
}

function ReactMark({ color }: MarkProps) {
  return (
    <Frame color={color}>
      <ellipse cx="40" cy="40" rx="22" ry="8" fill="none" stroke="#fff" strokeWidth="2.2" />
      <ellipse cx="40" cy="40" rx="22" ry="8" fill="none" stroke="#fff" strokeWidth="2.2" transform="rotate(60 40 40)" />
      <ellipse cx="40" cy="40" rx="22" ry="8" fill="none" stroke="#fff" strokeWidth="2.2" transform="rotate(-60 40 40)" />
      <circle cx="40" cy="40" r="4.5" fill="#fff" />
    </Frame>
  );
}

function NextMark({ color }: MarkProps) {
  return (
    <Frame color={color}>
      <path d="M22 58V22h8.4l18.2 26.6V22H58v36h-8.2L31.4 31.2V58H22Z" fill="#fff" />
    </Frame>
  );
}

function ServerMark({ color }: MarkProps) {
  return (
    <Frame color={color}>
      <rect x="18" y="20" width="44" height="12" rx="3" fill="#fff" opacity="0.95" />
      <rect x="18" y="34" width="44" height="12" rx="3" fill="#fff" opacity="0.8" />
      <rect x="18" y="48" width="44" height="12" rx="3" fill="#fff" opacity="0.65" />
      <circle cx="26" cy="26" r="2" fill={color} />
      <circle cx="26" cy="40" r="2" fill={color} />
      <circle cx="26" cy="54" r="2" fill={color} />
    </Frame>
  );
}

function ShieldMark({ color }: MarkProps) {
  return (
    <Frame color={color}>
      <path
        d="M40 16l22 8v16c0 14-9.4 22.8-22 26-12.6-3.2-22-12-22-26V24l22-8Z"
        fill="#fff"
      />
      <path d="M40 28v22" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M32 40h16" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  );
}

function NeuralMark({ color }: MarkProps) {
  return (
    <Frame color={color}>
      <circle cx="24" cy="26" r="5" fill="#fff" />
      <circle cx="56" cy="26" r="5" fill="#fff" />
      <circle cx="40" cy="40" r="6" fill="#fff" />
      <circle cx="24" cy="56" r="5" fill="#fff" />
      <circle cx="56" cy="56" r="5" fill="#fff" />
      <path d="M28 28l8 9M52 28l-8 9M28 54l8-9M52 54l-8-9" stroke="#fff" strokeWidth="2" />
    </Frame>
  );
}

function CloudMark({ color }: MarkProps) {
  return (
    <Frame color={color}>
      <path
        d="M28 52h28a12 12 0 0 0 0-24 16 16 0 0 0-30.4 5A10 10 0 0 0 28 52Z"
        fill="#fff"
      />
    </Frame>
  );
}

function PaletteMark({ color }: MarkProps) {
  return (
    <Frame color={color}>
      <rect x="20" y="22" width="28" height="36" rx="4" fill="#fff" opacity="0.45" transform="rotate(-8 34 40)" />
      <rect x="28" y="22" width="28" height="36" rx="4" fill="#fff" opacity="0.7" transform="rotate(4 42 40)" />
      <rect x="24" y="20" width="28" height="36" rx="4" fill="#fff" />
    </Frame>
  );
}

function GitMark({ color }: MarkProps) {
  return (
    <Frame color={color}>
      <circle cx="28" cy="28" r="6" fill="#fff" />
      <circle cx="52" cy="28" r="6" fill="#fff" />
      <circle cx="40" cy="54" r="6" fill="#fff" />
      <path d="M28 28h24M40 34v14" stroke="#fff" strokeWidth="3" />
    </Frame>
  );
}

function PhoneMark({ color }: MarkProps) {
  return (
    <Frame color={color}>
      <rect x="28" y="16" width="24" height="48" rx="5" fill="#fff" />
      <rect x="32" y="22" width="16" height="28" rx="1.5" fill={color} />
      <circle cx="40" cy="56" r="2.2" fill={color} />
    </Frame>
  );
}

function PythonMark({ color }: MarkProps) {
  return (
    <Frame color={color}>
      <path
        d="M28 22h16a8 8 0 0 1 8 8v8H36a8 8 0 0 0-8 8v2a8 8 0 0 1-8-8V30a8 8 0 0 1 8-8Z"
        fill="#fff"
      />
      <path
        d="M52 58H36a8 8 0 0 1-8-8v-8h16a8 8 0 0 0 8-8v-2a8 8 0 0 1 8 8v10a8 8 0 0 1-8 8Z"
        fill="#fff"
        opacity="0.75"
      />
    </Frame>
  );
}

function GeometricMark({ color, seed }: MarkProps & { seed: string }) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = 18 + (h % 12);
  const b = 48 + ((h >> 4) % 10);
  return (
    <Frame color={color}>
      <circle cx={a + 10} cy="28" r="10" fill="#fff" opacity="0.95" />
      <rect x={b - 8} y="36" width="22" height="22" rx="6" fill="#fff" opacity="0.7" />
      <circle cx="40" cy="50" r="8" fill="#fff" opacity="0.5" />
    </Frame>
  );
}

const MARKS: Record<string, (props: MarkProps) => ReactNode> = {
  react: ReactMark,
  nextjs: NextMark,
  backend: ServerMark,
  cybersecurity: ShieldMark,
  "ai-ml": NeuralMark,
  devops: CloudMark,
  uiux: PaletteMark,
  "open-source": GitMark,
  flutter: PhoneMark,
  python: PythonMark,
};

export function CommunityMark({
  slug,
  color,
  className,
}: {
  slug: string;
  color: string;
  className?: string;
}) {
  const Mark = MARKS[slug] ?? ((props: MarkProps) => <GeometricMark {...props} seed={slug} />);
  return (
    <span className={className}>
      <Mark color={color} />
    </span>
  );
}
