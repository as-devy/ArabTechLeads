"use client";

import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  BrainCircuit,
  Cloud,
  Code2,
  Database,
  Lock,
  Palette,
  Server,
  Shield,
  Smartphone,
  Terminal,
} from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";

type Point = { x: number; y: number };

function polar(cx: number, cy: number, radius: number, angleDeg: number): Point {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

const CX = 50;
const CY = 50;

const skills: Array<{
  id: string;
  label: string;
  angle: number;
  icon: LucideIcon;
  x: number;
  y: number;
}> = [
  { id: "react", label: "React", angle: 0, icon: Code2 },
  { id: "next", label: "Next.js", angle: 45, icon: Boxes },
  { id: "ts", label: "TypeScript", angle: 90, icon: Code2 },
  { id: "node", label: "Node.js", angle: 135, icon: Server },
  { id: "python", label: "Python", angle: 180, icon: Terminal },
  { id: "ai", label: "AI", angle: 225, icon: BrainCircuit },
  { id: "cloud", label: "Cloud", angle: 270, icon: Cloud },
  { id: "security", label: "Security", angle: 315, icon: Shield },
].map((skill) => ({
  ...skill,
  ...polar(CX, CY, 37, skill.angle),
}));

const people: Array<{
  id: string;
  initials: string;
  role: string;
  angle: number;
  icon: LucideIcon;
  x: number;
  y: number;
}> = [
  { id: "sa", initials: "SA", role: "Frontend", angle: 20, icon: Code2 },
  { id: "ym", initials: "YM", role: "Backend", angle: 80, icon: Server },
  { id: "nk", initials: "NK", role: "Security", angle: 140, icon: Lock },
  { id: "ar", initials: "AR", role: "AI", angle: 200, icon: BrainCircuit },
  { id: "hz", initials: "HZ", role: "Mobile", angle: 260, icon: Smartphone },
  { id: "ln", initials: "LN", role: "Design", angle: 320, icon: Palette },
].map((person) => ({
  ...person,
  ...polar(CX, CY, 23, person.angle),
}));

const communities: Array<{
  id: string;
  label: string;
  angle: number;
  icon: LucideIcon;
  x: number;
  y: number;
}> = [
  { id: "web", label: "Web", angle: 22, icon: Boxes },
  { id: "data", label: "Data", angle: 112, icon: Database },
  { id: "ops", label: "DevOps", angle: 202, icon: Cloud },
  { id: "ux", label: "UI/UX", angle: 292, icon: Palette },
].map((item) => ({
  ...item,
  ...polar(CX, CY, 44.5, item.angle),
}));

function curvePath(from: Point, to: Point, bend = 0.12) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

export function AuthNetworkScene() {
  return (
    <div
      className="auth-constellation relative mx-auto hidden aspect-square w-full max-w-[560px] xl:block xl:max-w-[620px]"
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-[6%] rounded-full bg-accent/[0.05] blur-3xl" />
      <div className="auth-ring auth-ring-outer absolute inset-[3%] rounded-full border border-accent/18" />
      <div className="auth-ring auth-ring-mid absolute inset-[14%] rounded-full border border-dashed border-accent/14" />
      <div className="auth-ring auth-ring-inner absolute inset-[28%] rounded-full border border-accent/10" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle
          cx={CX}
          cy={CY}
          r="37"
          stroke="var(--accent)"
          strokeOpacity="0.08"
          strokeWidth="0.25"
        />
        <circle
          cx={CX}
          cy={CY}
          r="23"
          stroke="var(--accent)"
          strokeOpacity="0.12"
          strokeWidth="0.25"
          strokeDasharray="1.2 1.8"
          className="auth-dash-spin"
        />
        <circle
          cx={CX}
          cy={CY}
          r="44.5"
          stroke="var(--accent)"
          strokeOpacity="0.06"
          strokeWidth="0.2"
        />

        {skills.map((skill) => (
          <path
            key={`hub-${skill.id}`}
            d={curvePath({ x: CX, y: CY }, skill, 0.1)}
            stroke="var(--accent)"
            strokeOpacity="0.26"
            strokeWidth="0.32"
            className="auth-link-flow"
          />
        ))}

        {skills.map((skill, index) => {
          const next = skills[(index + 1) % skills.length];
          return (
            <path
              key={`ring-${skill.id}`}
              d={curvePath(skill, next, 0.08)}
              stroke="var(--accent)"
              strokeOpacity="0.1"
              strokeWidth="0.22"
            />
          );
        })}

        {people.map((person) => {
          const nearest = skills.reduce((best, skill) => {
            const d = (skill.x - person.x) ** 2 + (skill.y - person.y) ** 2;
            const bd = (best.x - person.x) ** 2 + (best.y - person.y) ** 2;
            return d < bd ? skill : best;
          });
          return (
            <line
              key={`person-link-${person.id}`}
              x1={person.x}
              y1={person.y}
              x2={nearest.x}
              y2={nearest.y}
              stroke="var(--accent)"
              strokeOpacity="0.16"
              strokeWidth="0.22"
            />
          );
        })}

        {communities.map((community) => {
          const nearest = skills.reduce((best, skill) => {
            const d =
              (skill.x - community.x) ** 2 + (skill.y - community.y) ** 2;
            const bd =
              (best.x - community.x) ** 2 + (best.y - community.y) ** 2;
            return d < bd ? skill : best;
          });
          return (
            <line
              key={`community-link-${community.id}`}
              x1={community.x}
              y1={community.y}
              x2={nearest.x}
              y2={nearest.y}
              stroke="var(--accent)"
              strokeOpacity="0.14"
              strokeWidth="0.2"
              strokeDasharray="0.8 1.2"
            />
          );
        })}
      </svg>

      <div className="auth-hub absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center">
        <div className="relative flex items-center justify-center shadow-[0_0_50px_var(--glow)]">
          <BrandMark size={96} />
          <span className="pointer-events-none absolute -inset-2 rounded-full border border-accent/10 auth-hub-pulse" />
        </div>
        <span className="mt-2.5 flex items-center gap-1.5">
          <span className="h-px w-3 bg-accent/45" />
          <span className="font-mono text-[9px] font-medium tracking-[0.22em] text-muted uppercase">
            Network
          </span>
        </span>
      </div>

      {skills.map((skill, index) => {
        const Icon = skill.icon;
        return (
          <div
            key={skill.id}
            className="auth-skill-node absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${skill.x}%`,
              top: `${skill.y}%`,
              animationDelay: `${index * 0.12}s`,
            }}
          >
            <div className="dir-ltr flex items-center gap-1.5 rounded-full border border-border/70 bg-surface-elevated/92 px-2.5 py-1.5 text-[10px] font-medium tracking-tight text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md sm:text-[11px]">
              <Icon className="size-3 text-accent sm:size-3.5" strokeWidth={1.85} />
              {skill.label}
            </div>
          </div>
        );
      })}

      {people.map((person, index) => {
        const Icon = person.icon;
        return (
          <div
            key={person.id}
            className="auth-person-node absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${person.x}%`,
              top: `${person.y}%`,
              animationDelay: `${0.08 + index * 0.15}s`,
            }}
          >
            <div className="flex items-center gap-1 rounded-full border border-accent/30 bg-background/90 p-1 pe-2 shadow-md backdrop-blur-sm">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent-muted text-[9px] font-semibold text-accent">
                {person.initials}
              </span>
              <Icon className="size-3 text-muted" strokeWidth={1.8} />
            </div>
          </div>
        );
      })}

      {communities.map((community, index) => {
        const Icon = community.icon;
        return (
          <div
            key={community.id}
            className="auth-skill-node absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${community.x}%`,
              top: `${community.y}%`,
              animationDelay: `${0.2 + index * 0.2}s`,
            }}
          >
            <div
              className="dir-ltr flex size-9 flex-col items-center justify-center rounded-xl border border-border/60 bg-surface/85 text-accent shadow-sm backdrop-blur-md"
              title={community.label}
            >
              <Icon className="size-3.5" strokeWidth={1.8} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
