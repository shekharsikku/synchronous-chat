import { MemberDetails } from "@/components/chat/member-details";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContacts } from "@/hooks";
import { useAuthStore } from "@/lib/zustand";

interface GroupMembersProps {
  selectedChatData: any;
}

const GroupMembersList: React.FC<GroupMembersProps> = ({ selectedChatData }) => {
  const { contacts } = useContacts();
  const { userInfo } = useAuthStore();
  const adminId = selectedChatData.admin;

  const sortedMembers = selectedChatData?.members.sort((a: any, b: any) => {
    if (a === userInfo?._id) return -1;
    if (b === userInfo?._id) return 1;

    if (a === adminId) return -1;
    if (b === adminId) return 1;

    return 0;
  });

  return (
    <div className="min-h-36 max-h-60 py-1 overflow-y-scroll scrollbar-hide">
      <ScrollArea className="min-h-20 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-4">
          {sortedMembers.map((current: any) => (
            <MemberDetails
              key={current}
              contacts={contacts}
              userInfo={userInfo!}
              memberId={current}
              adminId={adminId}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export { GroupMembersList };
