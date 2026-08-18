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
import type { LocalTrack, RemoteParticipant, RemoteTrack, Room, Track } from "livekit-client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { joinVoiceRoomAction, leaveVoiceRoomAction } from "@/lib/actions/voice";
import type { VoiceErrorCode, VoiceRole, VoiceVideoFeed } from "@/lib/voice/types";

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
  liveParticipants: { identity: string; name: string }[];
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
  localCamera: boolean;
  localScreenShare: boolean;
  videoFeeds: VoiceVideoFeed[];
  mediaError: VoiceErrorCode | null;
  canShareScreen: boolean;
  setCameraEnabled: (enabled: boolean) => Promise<void>;
  setScreenShareEnabled: (enabled: boolean) => Promise<void>;
  bindVideoElement: (trackSid: string, element: HTMLVideoElement | null) => void;
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

function livekitConnectError(error: unknown): VoiceErrorCode {
  const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
  const message = error instanceof Error ? error.message : "";
  if (status === 401 || /not allowed|unauthorized|invalid token/i.test(message)) {
    return "TOKEN_FAILED";
  }
  return "CONNECTION_FAILED";
}

function isMobileClient() {
  if (typeof navigator === "undefined") return false;
  return (
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches)
  );
}

function playbackBoost() {
  return isMobileClient() ? 2.2 : 1.25;
}

let playbackContext: AudioContext | null = null;

function getPlaybackContext() {
  if (playbackContext) return playbackContext;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  playbackContext = new Ctx({ latencyHint: "interactive" });
  return playbackContext;
}

function boostRemoteAudio(track: RemoteTrack) {
  if (track.kind !== "audio") return;
  if ("setVolume" in track && typeof track.setVolume === "function") {
    track.setVolume(1);
  }
  const ctx = getPlaybackContext();
  if (
    ctx &&
    "setWebAudioPlugins" in track &&
    typeof track.setWebAudioPlugins === "function"
  ) {
    const gain = ctx.createGain();
    gain.gain.value = playbackBoost();
    track.setWebAudioPlugins([gain]);
  }
}

function attachRemoteAudio(track: RemoteTrack) {
  if (track.kind !== "audio") return;
  if (track.attachedElements.length > 0) {
    boostRemoteAudio(track);
    return;
  }
  const el = track.attach();
  el.autoplay = true;
  el.volume = 1;
  el.muted = false;
  el.setAttribute("playsinline", "true");
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);
  boostRemoteAudio(track);
  void el.play().catch(() => undefined);
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

async function preferLoudspeaker(room: Room) {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const outputs = devices.filter((device) => device.kind === "audiooutput");
    if (outputs.length === 0) return;
    const speaker =
      outputs.find((device) => /speaker|loudspeaker/i.test(device.label)) ??
      outputs.find((device) => !/earpiece|headset|headphone|bluetooth|handset/i.test(device.label));
    if (speaker?.deviceId) {
      await room.switchActiveDevice("audiooutput", speaker.deviceId);
    }
  } catch {
    // setSinkId is missing on iOS; webAudioMix handles playback there.
  }
}

async function unlockPlayback(room: Room) {
  const ctx = getPlaybackContext();
  if (ctx?.state === "suspended") {
    await ctx.resume().catch(() => undefined);
  }
  try {
    await room.startAudio();
  } catch {
    // Browser autoplay policies can block until a later tap.
  }
  await preferLoudspeaker(room);
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
  const [liveParticipants, setLiveParticipants] = useState<
    { identity: string; name: string }[]
  >([]);
  const [localCamera, setLocalCamera] = useState(false);
  const [localScreenShare, setLocalScreenShare] = useState(false);
  const [videoFeeds, setVideoFeeds] = useState<VoiceVideoFeed[]>([]);
  const [mediaError, setMediaError] = useState<VoiceErrorCode | null>(null);
  const [canShareScreen, setCanShareScreen] = useState(false);
  const videoTracksRef = useRef(new Map<string, LocalTrack | RemoteTrack | Track>());
  const videoElsRef = useRef(new Map<string, HTMLVideoElement>());
  const connectOpRef = useRef<Promise<unknown> | null>(null);
  const abortedRef = useRef(false);
  const connectingLockRef = useRef(false);

  const resetMediaState = useCallback(() => {
    setAudioPlaybackBlocked(false);
    setLiveParticipants([]);
    setLocalCamera(false);
    setLocalScreenShare(false);
    setVideoFeeds([]);
    setMediaError(null);
    videoTracksRef.current.clear();
    videoElsRef.current.clear();
  }, []);

  const detach = useCallback(async () => {
    abortedRef.current = true;
    const pending = connectOpRef.current;
    if (pending) {
      await pending.catch(() => undefined);
    }
    const current = roomRef.current;
    roomRef.current = null;
    if (current) {
      for (const participant of current.remoteParticipants.values()) {
        for (const publication of participant.audioTrackPublications.values()) {
          if (publication.track) detachRemoteAudio(publication.track);
        }
      }
      try {
        await current.disconnect(true);
      } catch {
        // LiveKit rejects if disconnect races an in-flight connect.
      }
      current.removeAllListeners();
    }
    resetMediaState();
  }, [resetMediaState]);

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
      setLiveParticipants(
        locals.map((participant) => ({
          identity: participant.identity,
          name: participant.name || participant.identity,
        })),
      );
      setLocalCamera(room.localParticipant.isCameraEnabled);
      setLocalScreenShare(room.localParticipant.isScreenShareEnabled);
      const nextTracks = new Map<string, LocalTrack | RemoteTrack | Track>();
      const feeds: VoiceVideoFeed[] = [];
      for (const participant of locals) {
        for (const publication of participant.videoTrackPublications.values()) {
          if (!publication.track || publication.isMuted) continue;
          nextTracks.set(publication.trackSid, publication.track);
          feeds.push({
            identity: participant.identity,
            name: participant.name || participant.identity,
            source: publication.source === "screen_share" ? "screen" : "camera",
            trackSid: publication.trackSid,
            isLocal: participant.isLocal,
          });
        }
      }
      videoTracksRef.current = nextTracks;
      setVideoFeeds(feeds);
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
      if (connectingLockRef.current) return {};
      connectingLockRef.current = true;
      setError(null);
      setConnection("connecting");
      try {
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

      abortedRef.current = false;
      await detach();
      abortedRef.current = false;
      const { Room, AudioPresets, VideoPresets } = await import("livekit-client");
      const audioContext = getPlaybackContext();
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        disconnectOnPageLeave: false,
        webAudioMix: audioContext ? { audioContext } : true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          voiceIsolation: true,
        },
        videoCaptureDefaults: {
          facingMode: "user",
          resolution: VideoPresets.h540.resolution,
        },
        publishDefaults: {
          audioPreset: AudioPresets.speech,
          dtx: true,
          red: true,
          forceStereo: false,
          simulcast: true,
        },
      });
      bindRoom(room);
      roomRef.current = room;
      try {
        const connecting = room.connect(token.url!, token.token!, { autoSubscribe: true });
        connectOpRef.current = connecting;
        await connecting;
        connectOpRef.current = null;
        if (abortedRef.current || roomRef.current !== room) {
          try {
            await room.disconnect(true);
          } catch {
            // Already disconnected.
          }
          return {};
        }
        attachExistingRemoteAudio(room);
        await unlockPlayback(room);
        setAudioPlaybackBlocked(!room.canPlaybackAudio);
        const nextRole = ("role" in joined && joined.role) || token.role || "LISTENER";
        if (input.asSpeaker && nextRole !== "LISTENER") {
          try {
            await room.localParticipant.setMicrophoneEnabled(true);
          } catch {
            // Stay muted if the browser denies the microphone.
          }
          await preferLoudspeaker(room);
        }
        if (abortedRef.current || roomRef.current !== room) return {};
        setRoomId(input.roomId);
        setRoomName(input.name);
        setRole(nextRole);
        setConnection("connected");
        return {};
      } catch (error) {
        connectOpRef.current = null;
        if (abortedRef.current) return {};
        await detach();
        setConnection("failed");
        const code = livekitConnectError(error);
        setError(code);
        return { error: code };
      }
      } finally {
        connectingLockRef.current = false;
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
      const connecting = current.connect(token.url!, token.token!);
      connectOpRef.current = connecting;
      await connecting;
      connectOpRef.current = null;
      attachExistingRemoteAudio(current);
      await unlockPlayback(current);
      setAudioPlaybackBlocked(!current.canPlaybackAudio);
      setConnection("connected");
    } catch (error) {
      connectOpRef.current = null;
      if (abortedRef.current) return;
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
    if (!nextMuted) await preferLoudspeaker(room);
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
      await unlockPlayback(room);
    } catch {
      // Stay blocked until the browser allows playback.
    }
    setAudioPlaybackBlocked(!room.canPlaybackAudio);
  }, []);

  const setCameraEnabled = useCallback(async (enabled: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.setCameraEnabled(enabled);
      setLocalCamera(room.localParticipant.isCameraEnabled);
      setMediaError(null);
    } catch {
      setMediaError("CAMERA_FAILED");
    }
  }, []);

  const setScreenShareEnabled = useCallback(async (enabled: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    if (enabled && !navigator.mediaDevices?.getDisplayMedia) {
      setMediaError("SCREEN_SHARE_UNSUPPORTED");
      return;
    }
    try {
      await room.localParticipant.setScreenShareEnabled(enabled, enabled ? { audio: true } : undefined);
      setLocalScreenShare(room.localParticipant.isScreenShareEnabled);
      setMediaError(null);
    } catch {
      setMediaError("SCREEN_SHARE_FAILED");
    }
  }, []);

  const bindVideoElement = useCallback((trackSid: string, element: HTMLVideoElement | null) => {
    const track = videoTracksRef.current.get(trackSid);
    const previous = videoElsRef.current.get(trackSid);
    if (previous && track) {
      track.detach(previous);
      videoElsRef.current.delete(trackSid);
    }
    if (!element || !track) return;
    track.attach(element);
    element.playsInline = true;
    element.muted = true;
    element.autoplay = true;
    videoElsRef.current.set(trackSid, element);
    void element.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    setCanShareScreen(Boolean(navigator.mediaDevices && "getDisplayMedia" in navigator.mediaDevices));
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
      liveParticipants,
      connect,
      reconnect,
      leave,
      setLocalMuted,
      setAudioDevice,
      audioPlaybackBlocked,
      enableAudioPlayback,
      localCamera,
      localScreenShare,
      videoFeeds,
      mediaError,
      canShareScreen,
      setCameraEnabled,
      setScreenShareEnabled,
      bindVideoElement,
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
      liveParticipants,
      connect,
      reconnect,
      leave,
      setLocalMuted,
      setAudioDevice,
      audioPlaybackBlocked,
      enableAudioPlayback,
      localCamera,
      localScreenShare,
      videoFeeds,
      mediaError,
      canShareScreen,
      setCameraEnabled,
      setScreenShareEnabled,
      bindVideoElement,
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
