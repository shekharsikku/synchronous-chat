import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContacts } from "@/hooks";
import { cn, getAvatar } from "@/lib/utils";
import { useAuthStore } from "@/lib/zustand";

interface GroupMembersProps {
  selectedChatData: any;
}

const GroupMembersList: React.FC<GroupMembersProps> = ({ selectedChatData }) => {
  const { contacts } = useContacts();
  const { userInfo } = useAuthStore();

  const getMemberDetails = (member: any) => {
    if (member === userInfo?._id) {
      return {
        id: userInfo?._id,
        name: userInfo?.name,
        image: getAvatar(userInfo),
        bio: userInfo?.bio,
      };
    }

    const detail = contacts?.find((contact) => contact._id === member);

    return {
      id: detail?._id,
      name: detail?.name,
      image: getAvatar(detail),
      gender: detail?.gender,
      bio: detail?.bio,
    };
  };

  const sortedMembers = selectedChatData?.members.sort((a: any, b: any) => {
    if (a === userInfo?._id) return -1;
    if (b === userInfo?._id) return 1;

    if (a === selectedChatData.admin) return -1;
    if (b === selectedChatData.admin) return 1;

    return 0;
  });

  return (
    <div className="min-h-36 max-h-60 py-1 overflow-y-scroll scrollbar-hide">
      <ScrollArea className="min-h-20 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-4">
          {sortedMembers.map((current: any) => {
            const details = getMemberDetails(current);
            const isYou = userInfo?._id === details.id;
            const isAdmin = selectedChatData.admin === details.id;

            return (
              <div
                key={details.id}
                className={cn(
                  "w-full flex items-center gap-4 px-3 py-2 border rounded",
                  isAdmin && isYou && "border-gray-300 dark:border-gray-700"
                )}
              >
                <div className="flex-none size-max">
                  <img
                    src={details.image}
                    alt={details.name}
                    className="size-8 rounded-full object-cover border border-border"
                  />
                </div>
                <div className="w-full flex justify-between items-center">
                  <div className="flex flex-col">
                    <h6 className="text-sm">{details.name}</h6>
                    <p
                      className={cn(
                        "text-xs inline-block align-middle truncate",
                        isAdmin && isYou ? "max-w-24 md:max-w-36" : "max-w-32 md:max-w-44 "
                      )}
                    >
                      {details.bio}
                    </p>
                  </div>

                  {(isAdmin || isYou) && (
                    <Badge variant="secondary">{isAdmin && isYou ? "Admin • You" : isAdmin ? "Admin" : "You"}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export { GroupMembersList };
