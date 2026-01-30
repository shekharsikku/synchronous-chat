import { groupAvatar } from "@/assets/images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getAvatar } from "@/lib/utils";
import { type ChatType } from "@/lib/zustand";

interface ContactElementProps {
  contact: any;
  selectedChatData: any;
  onlineUsers: object;
  handleSelectChat: (chatType: ChatType, chatData: any) => void;
}

export const ContactElement: React.FC<ContactElementProps> = ({
  contact,
  selectedChatData,
  onlineUsers,
  handleSelectChat,
}) => {
  return (
    <div
      key={contact?._id}
      className={cn(
        "w-full flex items-center justify-between cursor-pointer transition-[transform,opacity,box-shadow] duration-0 rounded border py-2 px-4 xl:px-6 hover:transition-colors hover:duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-100/5 dark:hover:border-gray-700",
        selectedChatData?._id === contact._id &&
          "bg-gray-100/80 dark:bg-gray-100/5 border-gray-300 dark:border-gray-700",
        contact?.setup === false && "disabled"
      )}
      onClick={() => handleSelectChat("contact", contact)}
      role="button"
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-8 rounded-full overflow-hidden cursor-pointer border-2">
          <AvatarImage src={getAvatar(contact)} alt="profile" className="object-cover size-full" />
          <AvatarFallback
            className={`uppercase h-full w-full text-xl border text-center font-medium transition-all duration-300`}
          >
            {(contact?.name ?? contact?.username ?? contact?.email)?.charAt(0) ?? ""}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h5 className="heading-name">{contact?.name}</h5>
          <h6 className="heading-uname">{contact?.username}</h6>
        </div>
      </div>
      {onlineUsers.hasOwnProperty(contact?._id!) && <span className="size-2 rounded-full bg-green-500" />}
    </div>
  );
};

interface GroupElementProps {
  group: any;
  selectedChatData: any;
  handleSelectChat: (chatType: ChatType, chatData: any) => void;
}

export const GroupElement: React.FC<GroupElementProps> = ({ group, selectedChatData, handleSelectChat }) => {
  return (
    <div
      key={group?._id}
      className={cn(
        "w-full flex items-center justify-between cursor-pointer transition-[transform,opacity,box-shadow] duration-0 rounded border py-2 px-4 xl:px-6 hover:transition-colors hover:duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-100/5 dark:hover:border-gray-700",
        selectedChatData?._id === group._id && "bg-gray-100/80 dark:bg-gray-100/5 border-gray-300 dark:border-gray-700"
      )}
      onClick={() => handleSelectChat("group", group)}
      role="button"
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-8 rounded-full overflow-hidden cursor-pointer border-2">
          <AvatarImage src={group.avatar || groupAvatar} alt="profile" className="object-cover size-full" />
          <AvatarFallback
            className={`uppercase h-full w-full text-xl border text-center font-medium transition-all duration-300`}
          >
            {group.name?.charAt(0) ?? ""}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h5 className="heading-name">{group?.name}</h5>
          <h6 className="heading-uname">
            {`${group?.members?.length ?? 0} ${group?.members?.length === 1 ? "member" : "members"}`}
          </h6>
        </div>
      </div>
    </div>
  );
};
