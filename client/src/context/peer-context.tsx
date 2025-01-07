import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/zustand";
import { useSocket } from "@/context";
import { toast } from "sonner";
import Peer from "peerjs";

type PeerInformation = {
  uid: string;
  name: string;
  pid: string;
} | null;

type ResponseActions = "accept" | "reject" | "missed" | null;

interface PeerContextType {
  peer: Peer | null;

  localInfo: PeerInformation;
  setLocalInfo: React.Dispatch<React.SetStateAction<PeerInformation>>;

  remoteInfo: PeerInformation;
  setRemoteInfo: React.Dispatch<React.SetStateAction<PeerInformation>>;

  localAudioRef: React.RefObject<HTMLAudioElement | null>;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;

  callingResponse: ResponseActions;
  setCallingResponse: React.Dispatch<React.SetStateAction<ResponseActions>>;

  openStreamDialog: boolean;
  setOpenStreamDialog: React.Dispatch<React.SetStateAction<boolean>>;

  isStreamActive: boolean;
  setIsStreamActive: React.Dispatch<React.SetStateAction<boolean>>;

  disconnectStream: () => void;
}

const PeerContext = createContext<PeerContextType | undefined>(undefined);

const usePeer = (): PeerContextType => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error("usePeer must be used within a PeerProvider");
  }
  return context;
}

const PeerProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { socket } = useSocket();
  const { userInfo } = useAuthStore();

  const [peer, setPeer] = useState<Peer | null>(null);

  const [localInfo, setLocalInfo] = useState<PeerInformation>(null);
  const [remoteInfo, setRemoteInfo] = useState<PeerInformation>(null);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [callingResponse, setCallingResponse] = useState<ResponseActions>(null);

  const [openStreamDialog, setOpenStreamDialog] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);

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
            label: <span className="bg-gray-900 text-white rounded px-3 py-2">Accept</span>,
            onClick: () => setCallingResponse("accept"),
          },
          duration: 30000,
          onDismiss: () => setCallingResponse("reject"),
          onAutoClose: () => setCallingResponse("missed"),
        })
      }

      /** Handling signaling for call request */
      socket?.on("after:callrequest", handleCallingRequest);
      /** Cleanup for signaling request */
      return () => {
        socket?.off("after:callrequest", handleCallingRequest);
      }
    }
  }, [userInfo, socket]);

  const responseCallingRequest = (action: ResponseActions) => {
    if (!remoteInfo?.pid) return;

    if (isStreamActive) {
      toast.info("Can't connect another stream!");
      return;
    }

    if (action === "accept") {
      if (location.pathname !== "/chat") {
        navigate("/chat");
      }

      setIsStreamActive(true);
      setOpenStreamDialog(true);

      /** Streaming Local/Remote Audio */
      navigator.mediaDevices.getUserMedia({ audio: true }).then((localStream) => {
        localAudioRef.current!.srcObject = localStream;

        /** Call the remote user */
        const call = peer?.call(remoteInfo?.pid!, localStream);

        call?.on("stream", (remoteStream) => {
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
      setIsStreamActive(false);
      setOpenStreamDialog(false);

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

      if (callingResponse !== "accept" && !isStreamActive) {
        callTimeoutRef.current = setTimeout(() => {
          setOpenStreamDialog(false);
          setIsStreamActive(false);
          setCallingResponse(null);
          setRemoteInfo(null);
          callTimeoutRef.current = null;
        }, 10000);
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
        setIsStreamActive(true);
        setOpenStreamDialog(true);
        toast.success(`Call request ${response.action} by ${response.name}!`);
      } else {
        setOpenStreamDialog(false);
        setIsStreamActive(false);
        setCallingResponse(null);
        setRemoteInfo(null);
        toast.info(`Call request ${response.action} by ${response.name}!`);
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

  const disconnectStream = () => {
    /** Stop local/remote audio tracks */
    stopMediaTracks(localAudioRef);
    stopMediaTracks(remoteAudioRef);

    /** Reset remote info state */
    setOpenStreamDialog(false);
    setIsStreamActive(false);
    setCallingResponse(null);
    setRemoteInfo(null);

    /** Notify the remote user */
    const callingActions = {
      from: localInfo?.uid,
      name: localInfo?.name,
      to: remoteInfo?.uid,
      pid: localInfo?.pid,
    }
    socket?.emit("before:calldisconnect", { callingActions });
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
      setOpenStreamDialog(false);
      setIsStreamActive(false);
      setCallingResponse(null);
      setRemoteInfo(null);

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
      localInfo,
      setLocalInfo,
      remoteInfo,
      setRemoteInfo,
      localAudioRef,
      remoteAudioRef,
      callingResponse,
      setCallingResponse,
      openStreamDialog,
      setOpenStreamDialog,
      isStreamActive,
      setIsStreamActive,
      disconnectStream,
    }}>
      {children}
    </PeerContext.Provider>
  )
}

export { usePeer, PeerProvider };
