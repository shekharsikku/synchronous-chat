import Peer from "peerjs";
import { Socket } from "socket.io-client";
import type { Dispatch, SetStateAction, RefObject } from "react";

export type SocketState = {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Record<string, any>;
};

export type PeerInformation = {
  uid: string;
  name: string;
  pid: string;
  sid: string;
} | null;

export type CallType = "audio" | "video";

export type ResponseActions = "accept" | "reject" | "busy" | "missed" | null;

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
  mediaType: CallType;
  setMediaType: Dispatch<SetStateAction<CallType>>;
  openPeerShareModal: boolean;
  setOpenPeerShareModal: Dispatch<SetStateAction<boolean>>;
}

export type TimeStamp = Date | string;

export interface UserInfo {
  _id?: string;
  name?: string;
  email?: string;
  username?: string;
  gender?: "Male" | "Female" | "Other";
  image?: string;
  bio?: string;
  setup?: boolean;
  createdAt?: TimeStamp;
  updatedAt?: TimeStamp;
  __v?: number;
  interaction?: TimeStamp;
}

export interface GroupInfo {
  _id?: string;
  name?: string;
  description?: string;
  avatar?: string;
  admin?: string;
  members?: string[];
  createdAt?: TimeStamp;
  updatedAt?: TimeStamp;
  __v?: number;
  interaction?: TimeStamp;
}

export interface Message {
  _id: string;
  sender: string;
  recipient?: string;
  group?: string;
  type: "default" | "edited" | "deleted";
  content?: {
    type: "text" | "file";
    text?: string;
    file?: string;
    reactions?: {
      by: string;
      emoji: string;
    }[];
  };
  reply?: string;
  deletedAt?: TimeStamp;
  createdAt?: TimeStamp;
  updatedAt?: TimeStamp;
  __v?: number;
}

export interface MessageData {
  type: "text" | "file";
  text?: string;
  file?: string;
  reply?: string;
}

export interface AuthStore {
  userInfo: UserInfo | null;
  setUserInfo: (userInfo: UserInfo | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  isAuthResolved: boolean;
  setIsAuthResolved: (isAuthResolved: boolean) => void;
  getUserInfo: () => Promise<UserInfo | null>;
}

export type ChatType = "contact" | "group" | null;

export type AllChatItem = (UserInfo & { type: "contact" }) | (GroupInfo & { type: "group" });

export interface ChatStore {
  selectedChatType: ChatType;
  setSelectedChatType: (selectedChatType: ChatType) => void;
  selectedChatData: any;
  setSelectedChatData: (selectedChatData: UserInfo | GroupInfo) => void;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  closeChat: () => void;
  isPartnerTyping: boolean;
  setIsPartnerTyping: (isPartnerTyping: boolean) => void;
  language: string;
  setLanguage: (translateLanguage: string) => void;
  editDialog: boolean;
  setEditDialog: (editDialog: boolean) => void;
  groupDialog: boolean;
  setGroupDialog: (groupDialog: boolean) => void;
  messageForEdit: { id: string; text: string };
  setMessageForEdit: (id: string, text: string) => void;
  replyTo: Message | null;
  setReplyTo: (replyTo: Message | null) => void;
  messageStats: { sent: number; received: number };
  setMessageStats: (messages: Message[], selectedChatId: string) => void;
  groupSettingDialog: boolean;
  setGroupSettingDialog: (editDialog: boolean) => void;
}

export type DetailsState = {
  name: string;
  description: string;
};

export type MemberUpdateState = {
  add: string[];
  remove: string[];
};

export interface GroupMemberManageProps {
  contacts?: UserInfo[];
  getMemberStatus: (userId: string) => "none" | "member" | "remove" | "add";
  toggleMember: (userId: string) => void;
  tooltipMap: {
    member: string;
    remove: string;
    add: string;
    none: string;
  };
}

type Theme = "dark" | "light" | "system";

export type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

type DeviceState = {
  deviceId: string | null;
  initDeviceId: () => string;
  isAllow: boolean;
  setIsAllow: (isAllow: boolean) => void;
};

export type AppStore = ThemeState & DeviceState;
