import {
  useSocket,
  PeerContext,
  PeerInformation,
  ResponseActions,
} from "@/lib/context";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useId, ReactNode } from "react";
import { useAuthStore } from "@/zustand";
import { toast } from "sonner";
import Peer, { MediaConnection } from "peerjs";

const PeerProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { socket } = useSocket();
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
  const [mediaType, setMediaType] = useState<"audio" | "video">("audio");

  const callingToastId = useId();

  const cleanupPeer = () => {
    if (peerRef.current && !peerRef.current.destroyed) {
      peerRef.current.destroy();
      peerRef.current = null;
      console.log("🧹 Cleaned up old peer!");
      return true;
    }

    console.log("🚫 No active peer to clean up!");
    return false;
  };

  useEffect(() => {
    /** Function for initialize and manage peer connection. */
    const createPeerConnection = () => {
      const cleaned = cleanupPeer();
      if (cleaned) {
        console.log("✨ Peer cleanup done!");
      }

      if (userInfo?.setup) {
        console.log("🛠️ Creating peer connection!");

        const peer = new Peer();
        peerRef.current = peer;

        peer.on("open", (id) => {
          console.log("✅ Peer connected successfully!");

          if (import.meta.env.DEV) {
            console.log("🆔 Peer ID:", id);
          }

          setLocalInfo({
            uid: userInfo._id!,
            name: userInfo.name!,
            pid: id,
          });
          setIsPeerReady(true);
        });

        peer.on("error", (error) => {
          console.error("❌ Peer error:", error.message);
          setIsPeerReady(false);

          if (error.type === "network" && navigator.onLine) {
            console.log("🔁 Retrying connection in 5s!");
            setTimeout(() => {
              createPeerConnection();
            }, 5000);
          }
        });

        peer.on("disconnected", () => {
          console.log("⚠️ Peer disconnected!");
          setIsPeerReady(false);
        });

        peer.on("close", () => {
          console.log("🔚 Peer connection closed!");
          setIsPeerReady(false);
          peerRef.current = null;
        });
      }
    };

    const handleReconnect = () => {
      if (navigator.onLine && userInfo?.setup) {
        console.log("📶 Network reconnected!");

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          createPeerConnection();
        }, 5000);
      }
    };

    createPeerConnection();

    const handleOffline = () => {
      console.log("📴 Network went offline!");
      setIsPeerReady(false);
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
  }, [userInfo?._id, userInfo?.setup]);

  useEffect(() => {
    /** Handle incoming signaling events */
    const handleCallingRequest = ({
      callingDetails: details,
    }: {
      callingDetails: any;
    }) => {
      setRemoteInfo({
        uid: details.from,
        name: details.name,
        pid: details.pid,
      });

      setMediaType(details.type);
      const callType = details.type === "video" ? "Video" : "Voice";

      toast(`${callType} call form ${details?.name}?`, {
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

    /** Handling signaling for call request */
    socket?.on("after:callrequest", handleCallingRequest);
    /** Cleanup for signaling request */
    return () => {
      socket?.off("after:callrequest", handleCallingRequest);
    };
  }, [socket]);

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
          console.error("Error accessing media devices:", error.message);
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

  const responseCallingRequest = (action: ResponseActions) => {
    if (!remoteInfo?.pid) return;

    if (callingActive) {
      /** Notify the remote user when you busy */
      const callingActions = {
        from: localInfo?.uid,
        name: localInfo?.name,
        action: "busy",
        to: remoteInfo?.uid,
        pid: localInfo?.pid,
      };
      socket?.emit("before:callconnect", { callingActions });

      if (action === "accept") {
        toast.info("Can't response on another call currently!");
      }
      setRemoteInfo(callingInfo);
      return;
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
          const call = peerRef.current?.call(remoteInfo?.pid!, localStream);

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
          const callingActions = {
            from: localInfo?.uid,
            name: localInfo?.name,
            action: action,
            to: remoteInfo?.uid,
            pid: localInfo?.pid,
          };
          socket?.emit("before:callconnect", { callingActions });
        })
        .catch((error) => {
          console.error("Error accessing media devices:", error.message);
          toast.error("Camera or mic is already in use!");
        });
    } else {
      setCallingActive(false);
      setCallingDialog(false);

      /** Notify the remote user when missed */
      const callingActions = {
        from: localInfo?.uid,
        name: localInfo?.name,
        action: action,
        to: remoteInfo?.uid,
        pid: localInfo?.pid,
      };
      socket?.emit("before:callconnect", { callingActions });
    }
  };

  useEffect(() => {
    if (callingResponse) {
      responseCallingRequest(callingResponse);

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }

      if (callingResponse !== "accept" && !callingActive) {
        callTimeoutRef.current = setTimeout(() => {
          setCallingDialog(false);
          setCallingActive(false);
          setCallingResponse(null);
          setRemoteInfo(null);
          callTimeoutRef.current = null;
        }, 2000);
      }
    }
  }, [callingResponse]);

  /** Mount unmount for request/response action */
  useEffect(() => {
    const handleCallingActions = ({
      callingActions: response,
    }: {
      callingActions: any;
    }) => {
      if (response.action === "accept") {
        setRemoteInfo({
          uid: response.from,
          name: response.name,
          pid: response.pid,
        });
        setCallingInfo({
          uid: response.from,
          name: response.name,
          pid: response.pid,
        });
        setCallingActive(true);
        setCallingDialog(true);
        setPendingRequest(false);
        toast.success(`Call request ${response.action} by ${response.name}!`);
      } else {
        setPendingRequest(false);
        setCallingDialog(false);
        setCallingActive(false);
        setCallingResponse(null);
        setRemoteInfo(null);

        if (response.action === "busy") {
          toast.info(
            `${response.name} is currently ${response.action} on another call!`
          );
        } else {
          toast.info(`Call request ${response.action} by ${response.name}!`);
        }
      }
    };

    /** Handling signaling for call request */
    socket?.on("after:callconnect", handleCallingActions);
    /** Cleanup for signaling request */
    return () => {
      socket?.off("after:callconnect", handleCallingActions);
    };
  }, [socket]);

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

  const disconnectCalling = () => {
    /** Stop local/remote audio tracks */
    stopMediaTracks(localAudioRef);
    stopMediaTracks(remoteAudioRef);
    /** Stop local/remote video tracks */
    stopMediaTracks(localVideoRef);
    stopMediaTracks(remoteVideoRef);

    /** Notify the remote user */
    const callingActions = {
      from: localInfo?.uid,
      name: localInfo?.name,
      to: callingInfo?.uid,
      pid: localInfo?.pid,
    };
    socket?.emit("before:calldisconnect", { callingActions });

    /** Reset remote info state */
    setCallingDialog(false);
    setCallingActive(false);
    setCallingResponse(null);
    setPendingRequest(false);
    setCallingInfo(null);
  };

  useEffect(() => {
    const handleCallDisconnect = ({
      callingActions: response,
    }: {
      callingActions: any;
    }) => {
      /** Stop local/remote audio tracks */
      stopMediaTracks(localAudioRef);
      stopMediaTracks(remoteAudioRef);
      /** Stop local/remote video tracks */
      stopMediaTracks(localVideoRef);
      stopMediaTracks(remoteVideoRef);

      /** Reset remote info state */
      setCallingDialog(false);
      setCallingActive(false);
      setCallingResponse(null);
      setPendingRequest(false);
      setCallingInfo(null);

      toast.info(`Call disconnected from ${response.name}!`);
    };
    /** Handling signaling for call request */
    socket?.on("after:calldisconnect", handleCallDisconnect);
    /** Cleanup for signaling request */
    return () => {
      socket?.off("after:calldisconnect", handleCallDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    const microphoneAction = {
      to: callingInfo?.uid,
      mute: remoteMicOff,
    };
    socket?.emit("before:muteaction", { microphoneAction });
  }, [remoteMicOff]);

  useEffect(() => {
    const handleMicAction = ({
      microphoneAction: action,
    }: {
      microphoneAction: any;
    }) => {
      setRemoteMute(action.mute);
    };

    socket?.on("after:muteaction", handleMicAction);

    return () => {
      socket?.off("after:muteaction", handleMicAction);
    };
  }, [socket]);

  return (
    <PeerContext.Provider
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
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};

export default PeerProvider;
