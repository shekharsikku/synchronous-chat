import Peer from "peerjs";
import { createContext, useContext } from "react";
import { Socket } from "socket.io-client";

import type { Dispatch, SetStateAction, RefObject } from "react";

export interface SocketInterface {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: object;
}

export const SocketContext = createContext<SocketInterface | undefined>(undefined);

/** Custom hook for use socket.io context in app */

export const useSocket = (): SocketInterface => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

/** PeerInformation for connect user via peer-to-peer */

export type PeerInformation = {
  uid: string;
  name: string;
  pid: string;
} | null;

export type ResponseActions = "accept" | "reject" | "missed" | null;

export interface PeerInterface {
  peerRef?: RefObject<Peer | null>;

  localInfo: PeerInformation;
  setLocalInfo: Dispatch<SetStateAction<PeerInformation>>;

  remoteInfo: PeerInformation;
  setRemoteInfo: Dispatch<SetStateAction<PeerInformation>>;

  callingInfo: PeerInformation;
  setCallingInfo: Dispatch<SetStateAction<PeerInformation>>;

  localAudioRef: RefObject<HTMLAudioElement | null>;
  remoteAudioRef: RefObject<HTMLAudioElement | null>;

  callingResponse: ResponseActions;
  setCallingResponse: Dispatch<SetStateAction<ResponseActions>>;

  callingDialog: boolean;
  setCallingDialog: Dispatch<SetStateAction<boolean>>;

  callingActive: boolean;
  setCallingActive: Dispatch<SetStateAction<boolean>>;

  pendingRequest: boolean;
  setPendingRequest: Dispatch<SetStateAction<boolean>>;

  disconnectCalling: () => void;

  mediaStream: MediaStream | null;
  setMediaStream: Dispatch<SetStateAction<MediaStream | null>>;

  muteUser: boolean;
  setMuteUser: Dispatch<SetStateAction<boolean>>;

  remoteMute: boolean;
  setRemoteMute: Dispatch<SetStateAction<boolean>>;

  remoteMicOff: boolean;
  setRemoteMicOff: Dispatch<SetStateAction<boolean>>;

  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;

  mediaType: "audio" | "video";
  setMediaType: Dispatch<SetStateAction<"audio" | "video">>;

  openPeerShareModal: boolean;
  setOpenPeerShareModal: Dispatch<SetStateAction<boolean>>;
}

export const PeerContext = createContext<PeerInterface | undefined>(undefined);

/** Custom hook for use peerjs webrtc context in app */

export const usePeer = (): PeerInterface => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error("usePeer must be used within a PeerProvider");
  }
  return context;
};

/** Custom hook for access theme context in app */

export type Theme = "dark" | "light" | "system";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeState = {
  theme: "system",
  setTheme: () => null,
};

export const ThemeContext = createContext<ThemeState | undefined>(initialState);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
