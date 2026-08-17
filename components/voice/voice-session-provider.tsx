"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RemoteParticipant, RemoteTrack, Room } from "livekit-client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { joinVoiceRoomAction, leaveVoiceRoomAction } from "@/lib/actions/voice";
import type { VoiceErrorCode, VoiceRole } from "@/lib/voice/types";

type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "failed";

type SpeakingMap = Record<string, boolean>;
type MuteMap = Record<string, boolean>;

type VoiceSessionValue = {
  roomId: string | null;
  roomName: string | null;
  role: VoiceRole | null;
  connection: ConnectionStatus;
  error: VoiceErrorCode | null;
  livekitReady: boolean;
  participantCount: number;
  speaking: SpeakingMap;
  muted: MuteMap;
  localMuted: boolean;
  connect: (input: {
    roomId: string;
    name: string;
    asSpeaker: boolean;
  }) => Promise<{ error?: VoiceErrorCode }>;
  reconnect: () => Promise<void>;
  leave: () => Promise<void>;
  setLocalMuted: (muted: boolean) => Promise<void>;
  setAudioDevice: (deviceId: string) => Promise<void>;
  audioPlaybackBlocked: boolean;
  enableAudioPlayback: () => Promise<void>;
};

const VoiceSessionContext = createContext<VoiceSessionValue | null>(null);

export function useVoiceSession() {
  const ctx = useContext(VoiceSessionContext);
  if (!ctx) {
    throw new Error("useVoiceSession must be used within VoiceSessionProvider");
  }
  return ctx;
}

export function useOptionalVoiceSession() {
  return useContext(VoiceSessionContext);
}

async function fetchToken(roomId: string) {
  const res = await fetch("/api/voice/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ roomId }),
  });
  const data = (await res.json()) as {
    token?: string;
    url?: string;
    role?: VoiceRole;
    error?: VoiceErrorCode;
  };
  if (!res.ok || !data.token || !data.url) {
    return { error: data.error ?? ("TOKEN_FAILED" as const) };
  }
  return data;
}

function attachRemoteAudio(track: RemoteTrack) {
  if (track.kind !== "audio") return;
  if (track.attachedElements.length > 0) return;
  const el = track.attach();
  el.autoplay = true;
  el.setAttribute("playsinline", "true");
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);
}

function detachRemoteAudio(track: RemoteTrack) {
  if (track.kind !== "audio") return;
  for (const el of track.detach()) {
    el.remove();
  }
}

function attachExistingRemoteAudio(room: Room) {
  for (const participant of room.remoteParticipants.values()) {
    for (const publication of participant.audioTrackPublications.values()) {
      if (publication.track) attachRemoteAudio(publication.track);
    }
  }
}

function livekitConnectError(error: unknown): VoiceErrorCode {
  const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
  const message = error instanceof Error ? error.message : "";
  if (status === 401 || /not allowed|unauthorized|invalid token/i.test(message)) {
    return "TOKEN_FAILED";
  }
  return "CONNECTION_FAILED";
}

export function VoiceSessionProvider({
  children,
  profileId,
}: {
  children: ReactNode;
  profileId: string;
}) {
  const roomRef = useRef<Room | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [role, setRole] = useState<VoiceRole | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<VoiceErrorCode | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [speaking, setSpeaking] = useState<SpeakingMap>({});
  const [muted, setMuted] = useState<MuteMap>({});
  const [localMuted, setLocalMutedState] = useState(true);
  const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);

  const detach = useCallback(async () => {
    const current = roomRef.current;
    roomRef.current = null;
    if (current) {
      for (const participant of current.remoteParticipants.values()) {
        for (const publication of participant.audioTrackPublications.values()) {
          if (publication.track) detachRemoteAudio(publication.track);
        }
      }
      current.removeAllListeners();
      await current.disconnect(true);
    }
    setAudioPlaybackBlocked(false);
  }, []);

  const bindRoom = useCallback((room: Room) => {
    const sync = () => {
      const nextMuted: MuteMap = {};
      const nextSpeaking: SpeakingMap = {};
      const locals = [room.localParticipant, ...Array.from(room.remoteParticipants.values())];
      for (const participant of locals) {
        nextMuted[participant.identity] = !participant.isMicrophoneEnabled;
        nextSpeaking[participant.identity] = participant.isSpeaking;
      }
      setMuted(nextMuted);
      setSpeaking(nextSpeaking);
      setParticipantCount(1 + room.remoteParticipants.size);
      setLocalMutedState(!room.localParticipant.isMicrophoneEnabled);
    };

    room.on("connectionStateChanged", (state) => {
      if (state === "connecting") setConnection("connecting");
      if (state === "connected") setConnection("connected");
      if (state === "reconnecting") setConnection("reconnecting");
      if (state === "disconnected") setConnection("disconnected");
      if (state === "signalReconnecting") setConnection("reconnecting");
    });
    room.on("disconnected", () => setConnection("disconnected"));
    room.on("reconnecting", () => setConnection("reconnecting"));
    room.on("reconnected", () => setConnection("connected"));
    room.on("participantConnected", sync);
    room.on("participantDisconnected", sync);
    room.on("trackMuted", sync);
    room.on("trackUnmuted", sync);
    room.on("trackSubscribed", (track) => {
      attachRemoteAudio(track);
      sync();
    });
    room.on("trackUnsubscribed", (track) => {
      detachRemoteAudio(track);
      sync();
    });
    room.on("audioPlaybackChanged", () => {
      setAudioPlaybackBlocked(!room.canPlaybackAudio);
    });
    room.on("activeSpeakersChanged", (speakers) => {
      setSpeaking((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) next[key] = false;
        for (const speaker of speakers) next[speaker.identity] = true;
        return next;
      });
    });
    room.on("localTrackPublished", sync);
    room.on("localTrackUnpublished", sync);
    sync();
  }, []);

  const connect = useCallback(
    async (input: { roomId: string; name: string; asSpeaker: boolean }) => {
      setError(null);
      setConnection("connecting");
      const joined = await joinVoiceRoomAction(input.roomId, input.asSpeaker);
      if ("error" in joined && joined.error) {
        setConnection("failed");
        setError(joined.error);
        return { error: joined.error as VoiceErrorCode };
      }
      const token = await fetchToken(input.roomId);
      if ("error" in token && token.error) {
        setConnection("failed");
        setError(token.error);
        return { error: token.error };
      }

      await detach();
      const { Room } = await import("livekit-client");
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      bindRoom(room);
      roomRef.current = room;
      try {
        await room.connect(token.url!, token.token!, { autoSubscribe: true });
        attachExistingRemoteAudio(room);
        try {
          await room.startAudio();
        } catch {
          // Browser autoplay policies can block until a later tap.
        }
        setAudioPlaybackBlocked(!room.canPlaybackAudio);
        const nextRole = ("role" in joined && joined.role) || token.role || "LISTENER";
        if (input.asSpeaker && nextRole !== "LISTENER") {
          try {
            await room.localParticipant.setMicrophoneEnabled(true);
          } catch {
            // Stay muted if the browser denies the microphone.
          }
        }
        setRoomId(input.roomId);
        setRoomName(input.name);
        setRole(nextRole);
        setConnection("connected");
        return {};
      } catch (error) {
        await detach();
        setConnection("failed");
        const code = livekitConnectError(error);
        setError(code);
        return { error: code };
      }
    },
    [bindRoom, detach],
  );

  const reconnect = useCallback(async () => {
    if (!roomId || !roomName) return;
    const token = await fetchToken(roomId);
    if ("error" in token && token.error) {
      setError(token.error);
      setConnection("failed");
      return;
    }
    const current = roomRef.current;
    if (!current) {
      await connect({ roomId, name: roomName, asSpeaker: role !== "LISTENER" });
      return;
    }
    try {
      setConnection("connecting");
      await current.connect(token.url!, token.token!);
      attachExistingRemoteAudio(current);
      try {
        await current.startAudio();
      } catch {
        // Browser autoplay policies can block until a later tap.
      }
      setAudioPlaybackBlocked(!current.canPlaybackAudio);
      setConnection("connected");
    } catch (error) {
      setConnection("failed");
      setError(livekitConnectError(error));
    }
  }, [connect, roomId, roomName, role]);

  const leave = useCallback(async () => {
    const id = roomId;
    await detach();
    setRoomId(null);
    setRoomName(null);
    setRole(null);
    setConnection("idle");
    setParticipantCount(0);
    if (id) await leaveVoiceRoomAction(id);
  }, [detach, roomId]);

  const setLocalMuted = useCallback(async (nextMuted: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(!nextMuted);
    setLocalMutedState(nextMuted);
  }, []);

  const setAudioDevice = useCallback(async (deviceId: string) => {
    const room = roomRef.current;
    if (!room) return;
    await room.switchActiveDevice("audioinput", deviceId);
  }, []);

  const enableAudioPlayback = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.startAudio();
    } catch {
      // Stay blocked until the browser allows playback.
    }
    setAudioPlaybackBlocked(!room.canPlaybackAudio);
  }, []);

  useEffect(() => {
    return () => {
      void detach();
    };
  }, [detach]);

  const value = useMemo<VoiceSessionValue>(
    () => ({
      roomId,
      roomName,
      role,
      connection,
      error,
      livekitReady: true,
      participantCount,
      speaking,
      muted,
      localMuted,
      connect,
      reconnect,
      leave,
      setLocalMuted,
      setAudioDevice,
      audioPlaybackBlocked,
      enableAudioPlayback,
    }),
    [
      roomId,
      roomName,
      role,
      connection,
      error,
      participantCount,
      speaking,
      muted,
      localMuted,
      connect,
      reconnect,
      leave,
      setLocalMuted,
      setAudioDevice,
      audioPlaybackBlocked,
      enableAudioPlayback,
    ],
  );

  return (
    <VoiceSessionContext.Provider value={value}>
      {children}
      <MiniVoiceBar profileId={profileId} />
    </VoiceSessionContext.Provider>
  );
}

function MiniVoiceBar({ profileId }: { profileId: string }) {
  const t = useTranslations("app.voice");
  const pathname = usePathname();
  const session = useVoiceSession();
  if (!session.roomId || session.connection === "idle") return null;
  if (pathname.startsWith(`/app/voice/${session.roomId}`)) return null;

  const speaking = session.speaking[profileId];

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 rounded-xl border border-border bg-surface p-3 shadow-lg lg:bottom-4 lg:end-4 lg:start-auto lg:w-[360px]">
      <p className="text-sm font-semibold">{session.roomName}</p>
      <p className="mt-0.5 text-xs text-muted">
        {t("participants", { count: session.participantCount })}
        {speaking ? ` · ${t("speaking")}` : ""}
        {session.connection === "reconnecting" ? ` · ${t("reconnecting")}` : ""}
      </p>
      {session.audioPlaybackBlocked ? (
        <Button size="sm" className="mt-3 w-full" onClick={() => void session.enableAudioPlayback()}>
          {t("enableAudio")}
        </Button>
      ) : null}
      <div className="mt-3 flex gap-2">
        <Link href={`/app/voice/${session.roomId}` as never} className="flex-1">
          <Button size="sm" className="w-full">
            {t("open")}
          </Button>
        </Link>
        <Button size="sm" variant="secondary" onClick={() => void session.leave()}>
          {t("leave")}
        </Button>
      </div>
    </div>
  );
}

export type LiveKitRemote = RemoteParticipant;
