import { useSocket, PeerContext, PeerInformation, ResponseActions } from "@/lib/context";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useId, ReactNode } from "react";
import { useAuthStore } from "@/zustand";
import { toast } from "sonner";
import Peer from "peerjs";

const PeerProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { socket } = useSocket();
  const { userInfo } = useAuthStore();

  const [peer, setPeer] = useState<Peer | null>(null);

  const [localInfo, setLocalInfo] = useState<PeerInformation>(null);
  const [remoteInfo, setRemoteInfo] = useState<PeerInformation>(null);
  const [callingInfo, setCallingInfo] = useState<PeerInformation>(null);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [callingResponse, setCallingResponse] = useState<ResponseActions>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>(undefined);

  const [callingDialog, setCallingDialog] = useState(false);
  const [callingActive, setCallingActive] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);

  const callingToastId = useId();

  useEffect(() => {
    if (userInfo?.setup) {
      const peer = new Peer();

      setPeer(peer);

      peer.on("open", (id) => {
        setLocalInfo({ uid: userInfo._id!, name: userInfo.name!, pid: id });
      });

      peer.on("call", (call) => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((localStream) => {
          /** Answer the call with your audio stream */
          call.answer(localStream);
          localAudioRef.current!.srcObject = localStream;

          call.on("stream", (remoteStream) => {
            setMediaStream(remoteStream);
            remoteAudioRef.current!.srcObject = remoteStream;
          });
        });
      });

      /** Handle incoming signaling events */
      const handleCallingRequest = ({
        callingDetails: details
      }: {
        callingDetails: any
      }) => {
        setRemoteInfo({ uid: details.from, name: details.name, pid: details.pid });

        toast(`Request form ${details?.name}?`, {
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
      }

      /** Handling signaling for call request */
      socket?.on("after:callrequest", handleCallingRequest);
      /** Cleanup for signaling request */
      return () => {
        socket?.off("after:callrequest", handleCallingRequest);
      }
    }
  }, [userInfo?._id, socket]);

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
      }
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

      /** Streaming Local/Remote Audio */
      navigator.mediaDevices.getUserMedia({ audio: true }).then((localStream) => {
        localAudioRef.current!.srcObject = localStream;

        /** Call the remote user */
        const call = peer?.call(remoteInfo?.pid!, localStream);

        call?.on("stream", (remoteStream) => {
          setMediaStream(remoteStream);
          remoteAudioRef.current!.srcObject = remoteStream;
        });

        /** Notify the remote user when accept */
        const callingActions = {
          from: localInfo?.uid,
          name: localInfo?.name,
          action: action,
          to: remoteInfo?.uid,
          pid: localInfo?.pid,
        }
        socket?.emit("before:callconnect", { callingActions });
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
      }
      socket?.emit("before:callconnect", { callingActions });
    }
  }

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
      callingActions: response
    }: {
      callingActions: any
    }) => {
      if (response.action === "accept") {
        setRemoteInfo({ uid: response.from, name: response.name, pid: response.pid });
        setCallingInfo({ uid: response.from, name: response.name, pid: response.pid });
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
          toast.info(`${response.name} is currently ${response.action} on another call!`);
        } else {
          toast.info(`Call request ${response.action} by ${response.name}!`);
        }
      }
    }

    /** Handling signaling for call request */
    socket?.on("after:callconnect", handleCallingActions);
    /** Cleanup for signaling request */
    return () => {
      socket?.off("after:callconnect", handleCallingActions);
    }
  }, [socket]);

  const stopMediaTracks = (audioRef: any) => {
    if (audioRef.current) {
      const mediaStream = audioRef.current.srcObject as MediaStream;
      if (mediaStream?.getTracks) {
        mediaStream.getTracks().forEach((track) => {
          track.stop()
          mediaStream.removeTrack(track);
        });
      }
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }
  };

  const disconnectCalling = () => {
    /** Stop local/remote audio tracks */
    stopMediaTracks(localAudioRef);
    stopMediaTracks(remoteAudioRef);

    /** Notify the remote user */
    const callingActions = {
      from: localInfo?.uid,
      name: localInfo?.name,
      to: callingInfo?.uid,
      pid: localInfo?.pid,
    }
    socket?.emit("before:calldisconnect", { callingActions });

    /** Reset remote info state */
    setCallingDialog(false);
    setCallingActive(false);
    setCallingResponse(null);
    setPendingRequest(false);
    setCallingInfo(null);
  }

  useEffect(() => {
    const handleCallDisconnect = ({
      callingActions: response
    }: {
      callingActions: any
    }) => {
      /** Stop local/remote audio tracks */
      stopMediaTracks(localAudioRef);
      stopMediaTracks(remoteAudioRef);

      /** Reset remote info state */
      setCallingDialog(false);
      setCallingActive(false);
      setCallingResponse(null);
      setPendingRequest(false);
      setCallingInfo(null);

      toast.info(`Call disconnected from ${response.name}!`);
    }
    /** Handling signaling for call request */
    socket?.on("after:calldisconnect", handleCallDisconnect);
    /** Cleanup for signaling request */
    return () => {
      socket?.off("after:calldisconnect", handleCallDisconnect);
    }
  }, [socket]);

  return (
    <PeerContext.Provider value={{
      peer,
      setPeer,
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
    }}>
      {children}
    </PeerContext.Provider>
  )
}

export default PeerProvider;