import Peer, { type MediaConnection } from "peerjs";
import { useCallback, useEffect, useState, useRef, useId, useEffectEvent, type PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PeerInformation, ResponseActions, CallType } from "@/types";
import { PeerShare } from "@/components/chat";
import { useSocket, PeerContext } from "@/lib/context";
import env from "@/lib/env";
import { getDeviceId, getTimeoutDelay } from "@/lib/utils";
import { useAuthStore } from "@/lib/zustand";

/** These errors are unrecoverable — don't retry. */
const fatalErrors = new Set(["unavailable-id", "invalid-id", "ssl-unavailable"]);

/** Only reconnect on network issues when online. */
const retryableErrors = new Set(["network", "server-error", "socket-error", "socket-closed"]);

/** To stop media track for both clients. */
const stopMediaTracks = (mediaRef: any) => {
  if (mediaRef.current) {
    const mediaStream = mediaRef.current.srcObject as MediaStream;
    if (mediaStream?.getTracks) {
      mediaStream.getTracks().forEach((track) => {
        track.stop();
        mediaStream.removeTrack(track);
      });
    }
    mediaRef.current.srcObject = null;
    mediaRef.current = null;
  }
};

const PeerProvider = ({ children, ...props }: PropsWithChildren) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { socket, isConnected } = useSocket();
  const { userInfo } = useAuthStore();

  const peerRef = useRef<Peer | null>(null);
  const [isPeerReady, setIsPeerReady] = useState(false);

  const [localInfo, setLocalInfo] = useState<PeerInformation>(null);
  const [remoteInfo, setRemoteInfo] = useState<PeerInformation>(null);
  const [callingInfo, setCallingInfo] = useState<PeerInformation>(null);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);

  const [callingResponse, setCallingResponse] = useState<ResponseActions>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const [callingDialog, setCallingDialog] = useState(false);
  const [callingActive, setCallingActive] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);

  const [muteUser, setMuteUser] = useState(false);
  const [remoteMute, setRemoteMute] = useState(false);
  const [remoteMicOff, setRemoteMicOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaType, setMediaType] = useState<CallType>("audio");

  const [openPeerShareModal, setOpenPeerShareModal] = useState(false);

  const callingToastId = useId();

  const cleanupPeer = useCallback(() => {
    const currentPeer = peerRef.current;

    if (!currentPeer || currentPeer.destroyed) {
      console.info("[Peer] No active peer to clean up.");
      return false;
    }

    /** Remove all listeners before destroying to prevent ghost callbacks. */
    currentPeer.removeAllListeners();
    currentPeer.destroy();
    peerRef.current = null;

    console.info("[Peer] Cleaned up successfully.");
    return true;
  }, []);

  useEffect(() => {
    if (!userInfo?._id || !userInfo?.setup || !isConnected) {
      console.info("[Peer] User not ready or disconnected.");
      return;
    }

    /** Function for initialize and manage peer connection. */
    const createPeerConnection = () => {
      const cleaned = cleanupPeer();

      if (cleaned) {
        console.info("[Peer] Previous peer cleaned up.");
      }

      console.info("[Peer] Creating new connection...");

      const deviceId = getDeviceId();

      const peer = new Peer(deviceId, {
        host: env.peerHost,
        port: env.peerPort,
        path: env.peerPath,
        secure: env.isProd,
      });

      peerRef.current = peer;

      peer.on("open", (id) => {
        reconnectCountRef.current = 0;
        console.info("[Peer] Connected successfully.");

        if (env.isDev) {
          console.info("[Peer] ID:", id);
        }

        setLocalInfo({ uid: userInfo._id!, name: userInfo.name!, pid: id, sid: socket?.id! });
        setIsPeerReady(true);
      });

      peer.on("error", (error) => {
        console.error("[Peer] Error:", error.message);
        setIsPeerReady(false);

        if (!navigator.onLine) {
          console.warn("[Peer] Offline, waiting for network.");
          return;
        }

        const reconnectDelay = getTimeoutDelay(reconnectCountRef.current);
        reconnectCountRef.current++;

        console.log(`[Peer] Reconnecting in ${(reconnectDelay / 1000).toFixed(1)} sec...`);
        console.log(`[Peer] Reconnecting attempt ${reconnectCountRef.current}`);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          console.info("[Peer] Reconnecting now...");

          if (peer.destroyed) {
            console.warn("[Peer] Destroyed, recreating:", error.type);
            createPeerConnection();
            return;
          }

          if (retryableErrors.has(error.type)) {
            console.info("[Peer] Reusing instance:", error.type);
            peer.reconnect();
            return;
          }

          if (fatalErrors.has(error.type)) {
            console.error("[Peer] Fatal error, recreating:", error.type);
            peer.destroy();
            createPeerConnection();
            return;
          }

          console.warn("[Peer] Unknown error, recreating:", error.type);
          createPeerConnection();
        }, reconnectDelay);
      });

      peer.on("disconnected", () => {
        console.warn("[Peer] Disconnected.");
        setIsPeerReady(false);
      });

      peer.on("close", () => {
        console.info("[Peer] Connection closed.");
        setIsPeerReady(false);
        peerRef.current = null;
      });
    };

    const handleReconnect = () => {
      if (navigator.onLine && userInfo?.setup) {
        console.info("[Peer] Network restored, scheduling reconnect...");

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          const peer = peerRef.current;

          if (!peer || peer.destroyed) {
            console.info("[Peer] Creating new instance after network restore.");
            createPeerConnection();
          } else {
            console.info("[Peer] Reconnecting existing instance.");
            peer.reconnect();
          }
        }, 5000);
      }
    };

    createPeerConnection();

    const handleOffline = () => {
      console.warn("[Peer] Network went offline.");
      setIsPeerReady(false);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    window.addEventListener("online", handleReconnect);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleReconnect);
      window.removeEventListener("offline", handleOffline);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      cleanupPeer();
    };
  }, [userInfo?._id, userInfo?.setup, userInfo?.name, isConnected]);

  useEffect(() => {
    if (!isPeerReady || !peerRef.current) return;

    const handleCall = (call: MediaConnection) => {
      const isVideoCall = mediaType === "video";

      navigator.mediaDevices
        .getUserMedia({ audio: true, video: isVideoCall })
        .then((localStream) => {
          /** Answer the call with your audio or video stream */
          call.answer(localStream);

          if (isVideoCall) {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
            }
          } else {
            if (localAudioRef.current) {
              localAudioRef.current.srcObject = localStream;
            }
          }

          call.on("stream", (remoteStream) => {
            setMediaStream(remoteStream);

            /** Set remote stream to video or audio element */
            if (isVideoCall) {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
            } else {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
              }
            }
          });
        })
        .catch((error) => {
          console.error("[Media] Failed to access media devices:", error.message);
          toast.error("Camera or mic is already in use!");
        });
    };

    peerRef.current.on("call", handleCall);

    return () => {
      peerRef.current?.off("call", handleCall);
    };
  }, [isPeerReady, mediaType]);

  useEffect(() => {
    if (pendingRequest) {
      toast.info("Waiting for pending call response!", {
        id: callingToastId,
        duration: 30000,
      });
    } else {
      toast.dismiss(callingToastId);
    }
  }, [pendingRequest, callingToastId]);

  const responseCallingRequest = useEffectEvent((action: ResponseActions) => {
    if (!remoteInfo) return;

    /** Clear any existing timeout before doing anything */
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (callingActive) {
      /** Notify the remote user when you busy */
      socket?.emit("call:response", {
        target: {
          uid: remoteInfo?.uid,
          sid: remoteInfo?.sid,
        },
        details: localInfo,
        action: "busy",
      });

      if (action === "accept") {
        toast.info("Can't response on another call currently!");
      }
      setRemoteInfo(callingInfo);
      return;
    }

    if (!callingActive && action !== "accept") {
      callTimeoutRef.current = setTimeout(() => {
        setCallingDialog(false);
        setCallingActive(false);
        setCallingResponse(null);
        setRemoteInfo(null);
        callTimeoutRef.current = null;
      }, 2000);
    }

    if (action === "accept") {
      if (location.pathname !== "/chat") {
        navigate("/chat", { replace: true });
      }

      setCallingActive(true);
      setCallingDialog(true);
      setCallingInfo(remoteInfo);

      const isVideoCall = mediaType === "video";

      /** Streaming Local/Remote Audio or Video */
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: isVideoCall })
        .then((localStream) => {
          if (isVideoCall) {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
            }
          } else {
            if (localAudioRef.current) {
              localAudioRef.current.srcObject = localStream;
            }
          }

          /** Call the remote user */
          const call = peerRef.current?.call(remoteInfo?.pid, localStream);

          call?.on("stream", (remoteStream) => {
            setMediaStream(remoteStream);

            /** Set remote stream to Video or Audio element */
            if (isVideoCall) {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
            } else {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
              }
            }
          });

          /** Notify the remote user when accept */
          socket?.emit("call:response", {
            target: {
              uid: remoteInfo?.uid,
              sid: remoteInfo?.sid,
            },
            details: localInfo,
            action,
          });
        })
        .catch((error) => {
          console.error("[Media] Failed to access media devices:", error.message);
          toast.error("Camera or mic is already in use!");
        });
    } else {
      setCallingActive(false);
      setCallingDialog(false);

      /** Notify the remote user when missed */
      socket?.emit("call:response", {
        target: {
          uid: remoteInfo?.uid,
          sid: remoteInfo?.sid,
        },
        details: localInfo,
        action,
      });
    }
  });

  useEffect(() => {
    if (callingResponse) {
      responseCallingRequest(callingResponse);
    }
  }, [callingResponse]);

  const disconnectCalling = () => {
    stopMediaTracks(localAudioRef);
    stopMediaTracks(remoteAudioRef);
    stopMediaTracks(localVideoRef);
    stopMediaTracks(remoteVideoRef);

    socket?.emit("call:ended", {
      target: {
        uid: callingInfo?.uid,
        sid: callingInfo?.sid,
      },
      details: localInfo,
    });

    setCallingDialog(false);
    setCallingActive(false);
    setCallingResponse(null);
    setPendingRequest(false);
    setCallingInfo(null);
    setMuteUser(false);
    setRemoteMute(false);
    setRemoteMicOff(false);
  };

  useEffect(() => {
    if (!socket) return;

    const handleCallRequest = ({ details, type }: { details: PeerInformation; type: CallType }) => {
      setRemoteInfo(details);
      setMediaType(type);

      toast(`${type === "video" ? "Video" : "Voice"} call form ${details?.name}?`, {
        description: "Accept to connect via WebRTC?",
        action: {
          label: "Accept",
          onClick: () => setCallingResponse("accept"),
        },
        duration: 30000,
        onDismiss: () => setCallingResponse("reject"),
        onAutoClose: () => setCallingResponse("missed"),
        unstyled: false,
        classNames: {
          actionButton: "h-8 w-16 justify-center hover:opacity-80",
        },
      });
    };

    const handleCallResponse = ({ details, action }: { details: PeerInformation; action: ResponseActions }) => {
      if (action === "accept") {
        setRemoteInfo(details);
        setCallingInfo(details);
        setCallingActive(true);
        setCallingDialog(true);
        setPendingRequest(false);
        toast.success(`Call request ${action} by ${details?.name}!`);
      } else {
        setPendingRequest(false);
        setCallingDialog(false);
        setCallingActive(false);
        setCallingResponse(null);
        setRemoteInfo(null);

        if (action === "busy") {
          toast.info(`${details?.name} is currently ${action} on another call!`);
        } else {
          toast.info(`Call request ${action} by ${details?.name}!`);
        }
      }
    };

    const handleCallDisconnect = ({ details }: { details: PeerInformation }) => {
      stopMediaTracks(localAudioRef);
      stopMediaTracks(remoteAudioRef);
      stopMediaTracks(localVideoRef);
      stopMediaTracks(remoteVideoRef);

      setCallingDialog(false);
      setCallingActive(false);
      setCallingResponse(null);
      setPendingRequest(false);
      setCallingInfo(null);
      setMuteUser(false);
      setRemoteMute(false);
      setRemoteMicOff(false);

      toast.info(`Call disconnected from ${details?.name}!`);
    };

    const handleMuteAction = ({ mute }: { mute: boolean }) => {
      setRemoteMute(mute);
    };

    const handleTargetInvalid = ({ code }: { code: string }) => {
      if (code === "TARGET_INVALID") {
        toast.error("The target device is no longer available!");
      }
    };

    const events: [string, (...args: any[]) => void][] = [
      ["call:request", handleCallRequest],
      ["call:response", handleCallResponse],
      ["call:ended", handleCallDisconnect],
      ["call:mute", handleMuteAction],
      ["target:invalid", handleTargetInvalid],
    ];

    events.forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      events.forEach(([event, handler]) => socket.on(event, handler));
    };
  }, [socket]);

  return (
    <PeerContext.Provider
      {...props}
      value={{
        localInfo,
        setLocalInfo,
        remoteInfo,
        setRemoteInfo,
        callingInfo,
        setCallingInfo,
        localAudioRef,
        remoteAudioRef,
        callingResponse,
        setCallingResponse,
        callingDialog,
        setCallingDialog,
        callingActive,
        setCallingActive,
        pendingRequest,
        setPendingRequest,
        disconnectCalling,
        mediaStream,
        setMediaStream,
        remoteMute,
        setRemoteMute,
        remoteMicOff,
        setRemoteMicOff,
        muteUser,
        setMuteUser,
        localVideoRef,
        remoteVideoRef,
        mediaType,
        setMediaType,
        peerRef,
        openPeerShareModal,
        setOpenPeerShareModal,
      }}
    >
      {children}
      <PeerShare />
    </PeerContext.Provider>
  );
};

export default PeerProvider;
