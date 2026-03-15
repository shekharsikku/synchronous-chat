import { HiOutlineMinusCircle, HiOutlinePlusCircle, HiOutlineCheckCircle } from "react-icons/hi2";
import { MemberDetails } from "@/components/chat/member-details";
import { TooltipElement } from "@/components/chat/tooltip-element";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContacts } from "@/hooks";
import { getAvatar } from "@/lib/utils";
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

const GroupMemberManage: React.FC<GroupMemberManage> = ({ contacts, getMemberStatus, toggleMember, tooltipMap }) => {
  return (
    <div className="min-h-36 max-h-60 py-1 overflow-y-scroll scrollbar-hide">
      <ScrollArea className="min-h-20 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-4">
          {contacts?.map((current) => {
            const memberStatus = getMemberStatus(current._id!);

            return (
              <div key={current._id} className="w-full flex items-center gap-4 px-3 py-2 border rounded">
                <div className="flex-none size-max">
                  <img
                    src={getAvatar(current)}
                    alt={current.name}
                    className="size-8 rounded-full object-cover border border-border"
                  />
                </div>
                <div className="w-full flex justify-between items-center">
                  <div className="flex flex-col">
                    <h6 className="text-sm">{current.name}</h6>
                    <p className="max-w-32 md:max-w-44 text-xs inline-block align-middle truncate">{current.bio}</p>
                  </div>
                </div>

                <TooltipElement asChild content={tooltipMap[memberStatus]}>
                  <button onClick={() => toggleMember(current._id!)} className="text-xl cursor-pointer">
                    {memberStatus === "member" && <HiOutlineMinusCircle className="text-red-500" />}
                    {memberStatus === "remove" && <HiOutlineCheckCircle className="text-orange-500" />}
                    {memberStatus === "add" && <HiOutlineCheckCircle className="text-green-500" />}
                    {memberStatus === "none" && <HiOutlinePlusCircle className="text-green-500" />}
                  </button>
                </TooltipElement>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export { GroupMembersList, GroupMemberManage };
