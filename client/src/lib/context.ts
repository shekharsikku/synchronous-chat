import {
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
  RefObject,
} from "react";
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
  setPeer: Dispatch<SetStateAction<Peer | null>>;

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

  mediaStream: MediaStream | undefined;
  setMediaStream: Dispatch<SetStateAction<MediaStream | undefined>>;
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
