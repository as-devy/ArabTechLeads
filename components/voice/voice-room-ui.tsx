"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVoiceSession } from "@/components/voice/voice-session-provider";
import { reportEntityAction } from "@/lib/actions/stage5";
import {
  endVoiceRoomAction,
  inviteToVoiceRoomAction,
  lockVoiceRoomAction,
  muteParticipantAction,
  raiseHandAction,
  removeParticipantAction,
  setVoiceReminderAction,
  setVoiceRoleAction,
  startVoiceRoomAction,
} from "@/lib/actions/voice";
import type { VoiceErrorCode, VoiceMemberPreview, VoiceRole, VoiceRoomState } from "@/lib/voice/types";
import { MODERATOR_ROLES, SPEAKING_ROLES } from "@/lib/voice/types";
import { cn } from "@/lib/utils";

type MicPermission = "unknown" | "granted" | "denied" | "unavailable";

export function VoiceRoomExperience({
  initial,
  profileId,
  livekitConfigured,
  locale,
}: {
  initial: VoiceRoomState;
  profileId: string;
  livekitConfigured: boolean;
  locale: string;
}) {
  const session = useVoiceSession();
  const inThisRoom = session.roomId === initial.id && session.connection !== "idle";
  if (inThisRoom) {
    return (
      <LiveRoomView
        initial={initial}
        profileId={profileId}
        locale={locale}
      />
    );
  }
  return (
    <PreJoinScreen
      room={initial}
      profileId={profileId}
      livekitConfigured={livekitConfigured}
      locale={locale}
    />
  );
}

function PreJoinScreen({
  room,
  profileId,
  livekitConfigured,
  locale,
}: {
  room: VoiceRoomState;
  profileId: string;
  livekitConfigured: boolean;
  locale: string;
}) {
  const t = useTranslations("app.voice");
  const session = useVoiceSession();
  const [error, setError] = useState<VoiceErrorCode | null>(session.error);
  const [permission, setPermission] = useState<MicPermission>("unknown");
  const [level, setLevel] = useState(0);
  const [pending, start] = useTransition();

  const join = (asSpeaker: boolean) => {
    start(async () => {
      setError(null);
      const result = await session.connect({ roomId: room.id, name: room.name, asSpeaker });
      if (result.error) setError(result.error);
    });
  };

  if (room.status === "ENDED") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <h1 className="text-2xl font-semibold">{room.name}</h1>
        <p className="mt-3 text-sm text-secondary">{t("roomEnded")}</p>
        <HistoryMeta room={room} locale={locale} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <p className="text-xs font-semibold text-accent">{t("joinTitle")}</p>
      <h1 className="mt-2 text-2xl font-semibold">{room.name}</h1>
      {room.description ? <p className="mt-2 text-sm text-secondary">{room.description}</p> : null}
      <p className="mt-4 text-sm text-muted">
        {t("hostedBy")} {room.createdBy.fullName}
      </p>
      <p className="mt-1 text-sm text-secondary">
        {t("peopleInRoom", { count: room.participantCount })}
      </p>
      {room.locked ? <p className="mt-3 text-sm text-error">{t("lockedHint")}</p> : null}
      {!livekitConfigured ? (
        <p className="mt-4 rounded-lg border border-border bg-accent-muted/40 p-3 text-sm text-secondary">
          {t("livekitMissing")}
        </p>
      ) : null}
      <MicPreview permission={permission} setPermission={setPermission} level={level} setLevel={setLevel} />
      {error ? <p className="mt-3 text-sm text-error">{t(`errors.${error}`)}</p> : null}
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending || !livekitConfigured || room.status === "SCHEDULED"}
          onClick={() => join(false)}
        >
          {t("joinListener")}
        </Button>
        <Button type="button" disabled={pending || !livekitConfigured || room.status === "SCHEDULED"} onClick={() => join(true)}>
          {t("joinSpeaker")}
        </Button>
      </div>
      {room.status === "SCHEDULED" ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-secondary">{t("waitingHost")}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => start(() => void setVoiceReminderAction(room.id, !room.reminderSet))}
          >
            {room.reminderSet ? t("removeReminder") : t("setReminder")}
          </Button>
          {room.createdBy.id === profileId || room.myRole === "OWNER" || room.myRole === "MODERATOR" ? (
            <Button type="button" variant="secondary" onClick={() => start(() => void startVoiceRoomAction(room.id))}>
              {t("startRoom")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MicPreview({
  permission,
  setPermission,
  level,
  setLevel,
}: {
  permission: MicPermission;
  setPermission: (value: MicPermission) => void;
  level: number;
  setLevel: (value: number) => void;
}) {
  const t = useTranslations("app.voice");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!testing) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let ctx: AudioContext | null = null;
    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setPermission("unavailable");
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermission("granted");
        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const value of data) {
            const v = (value - 128) / 128;
            sum += v * v;
          }
          setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        setPermission(name === "NotAllowedError" ? "denied" : "unavailable");
      }
    })();
    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
      void ctx?.close();
    };
  }, [testing, setLevel, setPermission]);

  return (
    <div className="mt-6 rounded-xl border border-border p-4">
      <p className="text-sm font-medium">{t("microphone")}</p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => setTesting(true)}
      >
        {t("testMic")}
      </Button>
      {permission === "denied" ? <p className="mt-3 text-sm text-error">{t("micDenied")}</p> : null}
      {permission === "unavailable" ? <p className="mt-3 text-sm text-error">{t("micUnavailable")}</p> : null}
      {testing && permission === "granted" ? (
        <div className="mt-3" aria-label={t("inputLevel")}>
          <p className="text-xs text-muted">{t("inputLevel")}</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-accent-muted">
            <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.round(level * 100)}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LiveRoomView({
  initial,
  profileId,
}: {
  initial: VoiceRoomState;
  profileId: string;
  locale: string;
}) {
  const t = useTranslations("app.voice");
  const session = useVoiceSession();
  const [state, setState] = useState(initial);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const res = await fetch(`/api/voice/state?roomId=${initial.id}`, { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { state?: VoiceRoomState };
      if (data.state) setState(data.state);
      if (data.state?.status === "ENDED") {
        await session.leave();
      }
      if (data.state?.myStatus === "REMOVED" || data.state?.myStatus === "BANNED") {
        await session.leave();
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [initial.id, session]);

  useEffect(() => {
    void navigator.mediaDevices?.enumerateDevices().then((list) => {
      setDevices(list.filter((d) => d.kind === "audioinput"));
    });
  }, []);

  const grouped = useMemo(() => {
    const mods = state.members.filter((m) => m.role === "OWNER" || m.role === "MODERATOR");
    const speakers = state.members.filter((m) => m.role === "SPEAKER");
    const listeners = state.members.filter((m) => m.role === "LISTENER");
    return { mods, speakers, listeners };
  }, [state.members]);

  const canModerate = Boolean(state.myRole && MODERATOR_ROLES.includes(state.myRole));
  const canSpeak = Boolean(state.myRole && SPEAKING_ROLES.includes(state.myRole));
  const raised = state.members.filter((m) => m.handRaised && m.role === "LISTENER");

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-5xl flex-col px-4 py-4 lg:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold">{state.name}</h1>
          <p className="mt-1 text-xs text-muted">
            {t("participants", { count: Math.max(state.participantCount, session.participantCount) })}
            {state.locked ? ` · ${t("locked")}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-error/10 px-2.5 py-1 text-[11px] font-semibold text-error">
          ● {t("live")}
        </span>
      </header>

      {session.connection === "connecting" ? <p className="mt-4 text-sm text-secondary">{t("connecting")}</p> : null}
      {session.connection === "reconnecting" ? <p className="mt-4 text-sm text-accent">{t("reconnecting")}</p> : null}
      {session.connection === "failed" || session.connection === "disconnected" ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="text-sm text-error">{t("connectionLost")}</p>
          <Button size="sm" onClick={() => void session.reconnect()}>
            {t("reconnect")}
          </Button>
        </div>
      ) : null}

      <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-6">
          <MemberSection roomId={state.id} title={t("moderators")} members={grouped.mods} profileId={profileId} canModerate={canModerate} />
          <MemberSection roomId={state.id} title={t("speakers")} members={grouped.speakers} profileId={profileId} canModerate={canModerate} />
          <MemberSection roomId={state.id} title={t("listeners")} members={grouped.listeners} profileId={profileId} canModerate={canModerate} />
        </div>
        <aside className="space-y-4">
          {canModerate && raised.length > 0 ? (
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">{t("raisedHands")}</p>
              <ul className="mt-2 space-y-2">
                {raised.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{m.profile.fullName}</span>
                    <span className="flex gap-1">
                      <button
                        type="button"
                        className="text-xs text-accent"
                        onClick={() => start(() => void setVoiceRoleAction(state.id, m.profileId, "SPEAKER"))}
                      >
                        {t("inviteSpeak")}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-muted"
                        onClick={() => start(() => void raiseHandAction(state.id, false, m.profileId))}
                      >
                        {t("dismiss")}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {canModerate ? (
            <ModeratorPanel
              roomId={state.id}
              locked={state.locked}
              confirm={confirm}
              setConfirm={setConfirm}
              pending={pending}
              start={start}
            />
          ) : null}
          {devices.length > 1 && canSpeak ? (
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted">{t("microphone")}</span>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
                onChange={(e) => void session.setAudioDevice(e.target.value)}
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || t("defaultMic")}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <form
            className="space-y-2 rounded-xl border border-border p-3"
            action={(fd) => {
              start(() => {
                void reportEntityAction("voice_room", state.id, fd);
              });
            }}
          >
            <p className="text-xs font-semibold">{t("report")}</p>
            <textarea name="description" rows={2} className="w-full rounded-md border border-border p-2 text-xs" />
            <input type="hidden" name="reason" value="voice_room" />
            <Button type="submit" size="sm" variant="outline">
              {t("report")}
            </Button>
          </form>
        </aside>
      </div>

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border bg-background py-4 lg:static">
        <Button
          type="button"
          variant={state.myHandRaised ? "secondary" : "outline"}
          className="min-h-12 min-w-28"
          aria-label={t("raiseHand")}
          onClick={() => start(() => void raiseHandAction(state.id, !state.myHandRaised))}
        >
          {state.myHandRaised ? t("lowerHand") : t("raiseHand")}
        </Button>
        {canSpeak ? (
          <Button
            type="button"
            variant={session.localMuted ? "secondary" : "primary"}
            className="min-h-12 min-w-28"
            aria-label={session.localMuted ? t("unmute") : t("mute")}
            disabled={!canSpeak}
            onClick={() => void session.setLocalMuted(!session.localMuted)}
          >
            {session.localMuted ? t("unmute") : t("mute")}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="min-h-12 min-w-28"
          aria-label={t("leave")}
          onClick={() => void session.leave()}
        >
          {t("leave")}
        </Button>
      </div>
    </div>
  );
}

function MemberSection({
  roomId,
  title,
  members,
  profileId,
  canModerate,
}: {
  roomId: string;
  title: string;
  members: VoiceMemberPreview[];
  profileId: string;
  canModerate: boolean;
}) {
  const session = useVoiceSession();
  if (members.length === 0) return null;
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {members.map((m) => (
          <ParticipantTile
            key={m.id}
            roomId={roomId}
            member={m}
            speaking={Boolean(session.speaking[m.profileId])}
            micMuted={session.muted[m.profileId] ?? true}
            isSelf={m.profileId === profileId}
            canModerate={canModerate}
          />
        ))}
      </ul>
    </section>
  );
}

function ParticipantTile({
  roomId,
  member,
  speaking,
  micMuted,
  isSelf,
  canModerate,
}: {
  roomId: string;
  member: VoiceMemberPreview;
  speaking: boolean;
  micMuted: boolean;
  isSelf: boolean;
  canModerate: boolean;
}) {
  const t = useTranslations("app.voice");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const verified = Boolean(member.profile.githubUrl || member.profile.isAdmin);

  useEffect(() => {
    if (!open) return;

    const close = () => setOpen(false);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && menuRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const run = (action: () => Promise<unknown>) => {
    setOpen(false);
    start(() => {
      void action();
    });
  };

  return (
    <li
      className={cn(
        "rounded-xl border p-3 text-center",
        speaking ? "border-accent shadow-[0_0_0_1px_var(--color-accent)]" : "border-border",
      )}
    >
      <div className="flex justify-center">
        <span className={cn("rounded-full", speaking && "ring-2 ring-accent ring-offset-2 ring-offset-background")}>
          <Avatar name={member.profile.fullName} src={member.profile.avatarUrl} size="lg" />
        </span>
      </div>
      <p className="mt-2 truncate text-sm font-medium">
        {member.profile.fullName}
        {verified ? <span className="ms-1 text-accent" title={t("verified")}>✓</span> : null}
      </p>
      <p className="text-[11px] text-muted">{t(`roles.${member.role}`)}</p>
      <p className="mt-1 text-[11px] text-secondary">
        {speaking ? t("speaking") : micMuted || member.forceMuted ? t("muted") : t("micOn")}
      </p>
      {canModerate && !isSelf ? (
        <div className="relative mt-2" ref={menuRef}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((v) => !v)}
          >
            {t("moderate")}
          </Button>
          {open ? (
            <div
              role="menu"
              className="absolute z-10 mt-1 w-40 rounded-lg border border-border bg-surface p-1 text-start shadow-md"
            >
              {(["SPEAKER", "LISTENER", "MODERATOR"] as VoiceRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  role="menuitem"
                  disabled={pending}
                  className="block w-full rounded-md px-2 py-1.5 text-xs hover:bg-accent-muted"
                  onClick={() => run(() => setVoiceRoleAction(roomId, member.profileId, role))}
                >
                  {t(`make.${role}`)}
                </button>
              ))}
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                className="block w-full rounded-md px-2 py-1.5 text-xs hover:bg-accent-muted"
                onClick={() => run(() => muteParticipantAction(roomId, member.profileId, true))}
              >
                {t("mute")}
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                className="block w-full rounded-md px-2 py-1.5 text-xs hover:bg-accent-muted"
                onClick={() => run(() => removeParticipantAction(roomId, member.profileId, false))}
              >
                {t("remove")}
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                className="block w-full rounded-md px-2 py-1.5 text-xs text-error hover:bg-accent-muted"
                onClick={() => run(() => removeParticipantAction(roomId, member.profileId, true))}
              >
                {t("ban")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function ModeratorPanel({
  roomId,
  locked,
  confirm,
  setConfirm,
  pending,
  start,
}: {
  roomId: string;
  locked: boolean;
  confirm: string | null;
  setConfirm: (value: string | null) => void;
  pending: boolean;
  start: (fn: () => void) => void;
}) {
  const t = useTranslations("app.voice");
  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <p className="text-sm font-semibold">{t("moderation")}</p>
      <form action={(fd) => start(() => void inviteToVoiceRoomAction(roomId, fd))} className="space-y-2">
        <Input name="username" placeholder="@username" className="h-9 dir-ltr" />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {t("invite")}
        </Button>
      </form>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => start(() => void lockVoiceRoomAction(roomId, !locked))}
      >
        {locked ? t("unlock") : t("lock")}
      </Button>
      {confirm === "end" ? (
        <div className="space-y-2 rounded-md bg-accent-muted p-2">
          <p className="text-xs">{t("endConfirm")}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => start(() => void endVoiceRoomAction(roomId))}>
              {t("endRoom")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
              {t("dismiss")}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={() => setConfirm("end")}>
          {t("endRoom")}
        </Button>
      )}
    </div>
  );
}

function HistoryMeta({ room, locale }: { room: VoiceRoomState; locale: string }) {
  const t = useTranslations("app.voice");
  const started = room.startedAt ? new Date(room.startedAt) : room.scheduledAt ? new Date(room.scheduledAt) : null;
  const ended = room.endedAt ? new Date(room.endedAt) : null;
  const duration =
    started && ended
      ? Math.max(1, Math.round((ended.getTime() - started.getTime()) / 60000))
      : null;
  return (
    <dl className="mt-6 space-y-1 text-sm text-secondary">
      <div>
        {t("hostedBy")} {room.createdBy.fullName}
      </div>
      {started ? (
        <div>
          {new Intl.DateTimeFormat(locale.startsWith("ar") ? "ar" : "en", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(started)}
        </div>
      ) : null}
      {duration ? <div>{t("duration", { minutes: duration })}</div> : null}
      <div>{t("participants", { count: room.participantCount })}</div>
    </dl>
  );
}
