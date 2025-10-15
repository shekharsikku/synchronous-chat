import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const ContactElement = ({
  contact,
  selectedChatData,
  onlineUsers,
  useAvatar,
  onSelectContact,
}: {
  contact: any;
  selectedChatData: any;
  onlineUsers: object;
  useAvatar: (info: any) => any;
  onSelectContact: (contact: any) => void;
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
      onClick={() => onSelectContact(contact)}
      role="button"
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-8 rounded-full overflow-hidden cursor-pointer border-2">
          <AvatarImage src={useAvatar(contact)} alt="profile" className="object-cover size-full" />
          <AvatarFallback
            className={`uppercase h-full w-full text-xl border text-center font-medium transition-all duration-300`}
          >
            {contact?.username?.split("").shift() || contact?.email?.split("").shift()}
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

export const GroupElement = ({
  group,
  selectedChatData,
  fallbackAvatar,
  onSelectGroup,
}: {
  group: any;
  selectedChatData: any;
  fallbackAvatar: string;
  onSelectGroup: (group: any) => void;
}) => {
  return (
    <div
      key={group?._id}
      className={cn(
        "w-full flex items-center justify-between cursor-pointer transition-[transform,opacity,box-shadow] duration-0 rounded border py-2 px-4 xl:px-6 hover:transition-colors hover:duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-100/5 dark:hover:border-gray-700",
        selectedChatData?._id === group._id && "bg-gray-100/80 dark:bg-gray-100/5 border-gray-300 dark:border-gray-700"
      )}
      onClick={() => onSelectGroup(group)}
      role="button"
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-8 rounded-full overflow-hidden cursor-pointer border-2">
          <AvatarImage src={group.avatar || fallbackAvatar} alt="profile" className="object-cover size-full" />
          <AvatarFallback
            className={`uppercase h-full w-full text-xl border text-center font-medium transition-all duration-300`}
          >
            {group.name?.split("").shift()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h5 className="heading-name">{group?.name}</h5>
          <h6 className="heading-uname">
            {group?.members && group.members.length > 1
              ? `You + ${group.members.length - 1} ${group.members.length - 1 === 1 ? "member" : "members"}`
              : "Just you"}
          </h6>
        </div>
      </div>
    </div>
  );
};
