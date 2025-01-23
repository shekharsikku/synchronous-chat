import { createContext, useContext } from "react";
import { Socket } from "socket.io-client";
import Peer from "peerjs";

export interface SocketInterface {
  socket: Socket | null;
  onlineUsers: object;
}

export const SocketContext = createContext<SocketInterface | undefined>(
  undefined
);

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
  peer: Peer | null;

  localInfo: PeerInformation;
  setLocalInfo: React.Dispatch<React.SetStateAction<PeerInformation>>;

  remoteInfo: PeerInformation;
  setRemoteInfo: React.Dispatch<React.SetStateAction<PeerInformation>>;

  callingInfo: PeerInformation;
  setCallingInfo: React.Dispatch<React.SetStateAction<PeerInformation>>;

  localAudioRef: React.RefObject<HTMLAudioElement | null>;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;

  callingResponse: ResponseActions;
  setCallingResponse: React.Dispatch<React.SetStateAction<ResponseActions>>;

  callingDialog: boolean;
  setCallingDialog: React.Dispatch<React.SetStateAction<boolean>>;

  callingActive: boolean;
  setCallingActive: React.Dispatch<React.SetStateAction<boolean>>;

  pendingRequest: boolean;
  setPendingRequest: React.Dispatch<React.SetStateAction<boolean>>;

  disconnectCalling: () => void;

  mediaStream: MediaStream | undefined;
  setMediaStream: React.Dispatch<React.SetStateAction<MediaStream | undefined>>;
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
