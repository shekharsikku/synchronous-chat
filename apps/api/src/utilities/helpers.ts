import type { GroupDocument, MessageDocument, UserDocument } from "#/models/index.js";

export interface UserInfo {
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  setup: boolean;
  gender?: string | null;
  image?: string | null;
  bio?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const toUserInfo = (user: UserDocument): UserInfo => {
  if (!user.setup) {
    return {
      id: user._id.toString(),
      email: user.email,
      setup: user.setup,
    };
  }

  return {
    id: user._id.toString(),
    email: user.email,
    setup: user.setup,
    name: user.name ?? null,
    username: user.username ?? null,
    gender: user.gender ?? null,
    image: user.image ?? null,
    bio: user.bio ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export interface GroupInfo {
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  admin: string;
  members: string[];
  interaction: Date;
}

export const toGroupInfo = (group: GroupDocument & { interaction?: Date }): GroupInfo => ({
  id: group._id.toString(),
  name: group.name,
  description: group.description,
  avatar: group.avatar ?? null,
  admin: group.admin.toString(),
  members: group.members.map((member) => member.toString()),
  interaction: group.interaction ?? group.updatedAt,
});

export interface MessageInfo {
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
  deletedAt: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export const toMessageInfo = (message: MessageDocument): MessageInfo => ({
  id: message._id.toString(),
  sender: message.sender.toString(),
  recipient: message.recipient?.toString() ?? undefined,
  group: message.group?.toString() ?? undefined,
  type: message.type,
  content: message.content,
  reply: message.reply?.toString() ?? undefined,
  deletedAt: message.deletedAt ?? undefined,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

export const toContactInfo = (contact: Record<string, any>) => {
  const { _id, ...rest } = contact;
  return { id: _id.toString(), ...rest };
};

export const hasEmptyField = (fields: Record<string, unknown>): boolean => {
  return Object.values(fields).some((value) => value == null || (typeof value === "string" && value.trim() === ""));
};

export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;

  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }

  return `${bytes.toFixed(2)} ${units[i]}`;
}

export function formatUptime(uptime = process.uptime()) {
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds.toFixed(2)}s`;
  }

  return `${minutes}m ${seconds.toFixed(2)}s`;
}
