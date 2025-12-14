import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { cn, getAvatar } from "@/lib/utils";

import type { UserInfo } from "@/lib/zustand";

interface GroupMembersDetails {
  contacts?: UserInfo[];
  userInfo: UserInfo;
  memberId: any;
  adminId: any;
}

const MemberDetails: React.FC<GroupMembersDetails> = ({ contacts, userInfo, memberId, adminId }) => {
  const isYou = userInfo._id === memberId;
  const isAdmin = adminId === memberId;

  const cachedContact = useMemo(() => contacts?.find((cur) => cur._id === memberId), [contacts, memberId]);

  const { data: fetchedContact } = useQuery({
    queryKey: ["contact", memberId],
    queryFn: async () => {
      const res = await api.get(`/api/contact/fetch/${memberId}`);
      return res.data.data as UserInfo;
    },
    enabled: !isYou && !cachedContact,
    staleTime: 6 * 60 * 60 * 1000,
  });

  const details = useMemo(() => {
    if (isYou && userInfo) {
      return {
        id: userInfo._id,
        name: userInfo.name,
        image: getAvatar(userInfo),
        gender: userInfo?.gender,
        bio: userInfo.bio,
      };
    }

    const source = cachedContact ?? fetchedContact;
    if (!source) return undefined;

    return {
      id: source._id,
      name: source.name,
      image: getAvatar(source),
      gender: source.gender,
      bio: source.bio,
    };
  }, [isYou, userInfo, cachedContact, fetchedContact]);

  return (
    <div
      className={cn(
        "w-full flex items-center gap-4 px-3 py-2 border rounded",
        isAdmin && isYou && "border-gray-300 dark:border-gray-700"
      )}
    >
      <div className="flex-none size-max">
        <img
          src={details?.image}
          alt={details?.name}
          className="size-8 rounded-full object-cover border border-border"
        />
      </div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col">
          <h6 className="text-sm">{details?.name}</h6>
          <p
            className={cn(
              "text-xs inline-block align-middle truncate",
              isAdmin && isYou ? "max-w-24 md:max-w-36" : "max-w-32 md:max-w-44 "
            )}
          >
            {details?.bio}
          </p>
        </div>

        {(isAdmin || isYou) && (
          <Badge variant="secondary">{isAdmin && isYou ? "Admin • You" : isAdmin ? "Admin" : "You"}</Badge>
        )}
      </div>
    </div>
  );
};

export { MemberDetails };
