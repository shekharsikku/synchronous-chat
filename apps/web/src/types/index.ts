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
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  setup: boolean;
  gender?: "Male" | "Female" | "Other";
  image?: string | null;
  bio?: string | null;
  createdAt?: TimeStamp;
  updatedAt?: TimeStamp;
  interaction?: TimeStamp;
}

export interface GroupInfo {
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  admin: string;
  members: string[];
  interaction: TimeStamp;
}

export interface Message {
  id: string;
  sender: string;
  recipient: string | undefined;
  group: string | undefined;
  type: "default" | "edited" | "deleted";
  content?: {
    type: "text" | "file";
    text?: string | null;
    file?: string | null;
    reactions?: {
      by?: string | null;
      emoji?: string | null;
    }[];
  };
  reply: string | undefined;
  deletedAt: TimeStamp | undefined;
  createdAt: TimeStamp;
  updatedAt: TimeStamp;
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
  notify: boolean;
  setNotify: (notify: boolean) => void;
};

export type AppStore = ThemeState & DeviceState;
