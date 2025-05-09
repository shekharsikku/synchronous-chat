import {
  HiMiniSignal,
  HiMiniSignalSlash
} from "react-icons/hi2";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactListSkeleton } from "./contact-list-skeleton";
import { Logo, Title } from "./logo-title";
import { AddNewChat } from "./add-new-chat";
import { ProfileInfo } from "./profile-info";
import { StreamInfo } from "./stream-info";
import { useSearchParams } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { useEffect, useState } from "react";
import { useContacts } from "@/hooks/use-contacts";
import { useSelectedChat } from "@/hooks/use-selected-chat";
import { useChatStore } from "@/zustand";
import { usePeer, useSocket } from "@/lib/context";
import { useAvatar } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const ContactsContainer = () => {
  const { callingActive } = usePeer();
  const { onlineUsers } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastChatUser, setLastChatUser] = useState<string | null>(null);
  const { setSelectedChatType, setSelectedChatData } = useChatStore();

  const { contacts, fetching } = useContacts();
  const { selectedChatData } = useSelectedChat();

  useEffect(() => {
    setLastChatUser(searchParams.get("user"));
  }, [searchParams])

  useHotkeys("ctrl+b", () => {
    if (lastChatUser) {
      const lastChatData = contacts?.find((contact) => {
        return contact.username === lastChatUser;
      })
      if (lastChatData) {
        setSelectedChatType("contact");
        setSelectedChatData(lastChatData);
      }
    }
  }, {
    enabled: !!lastChatUser,
    enableOnFormTags: ["input"],
  });

  return (
    <div className={cn(selectedChatData && "hidden md:flex flex-col",
      "h-full w-full md:w-1/3 xl:w-1/4 border-r relative")}>
      <div className="h-bar border-b p-2">
        <Logo />
      </div>
      <div className={cn(callingActive ? "h-cda" : "h-clh", "w-full overflow-hidden")}>
        <div className="h-full w-full flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <Title title="Chat Messages" />
            <AddNewChat />
          </div>
          {fetching ? (
            <div className="h-full overflow-y-scroll scrollbar-hide">
              <ContactListSkeleton animate="pulse" status count={10} />
            </div>
          ) : (
            <>
              {contacts?.length! <= 0 ? (
                <p className="text-neutral-700">No any chat available!</p>
              ) : (
                <ScrollArea className="h-full overflow-y-auto scrollbar-hide">
                  <div className="flex flex-col gap-4">
                    {contacts?.map((contact: any) => (
                      <div key={contact?._id} className={`w-full flex items-center justify-between cursor-pointer transition-all duration-300 rounded border py-2 px-4 xl:px-6 text-gray-600 hover:bg-gray-100 
                        ${selectedChatData && selectedChatData._id === contact._id && "bg-gray-100/80 text-gray-700 border-gray-300/50"} ${contact?.setup === false && "disabled"} `} onClick={() => {
                          setSelectedChatType("contact");
                          setSelectedChatData(contact);
                          setSearchParams({ "user": contact.username });
                        }} role="button">
                        <div className="flex items-center gap-4">
                          <Avatar className="size-8 rounded-full overflow-hidden cursor-pointer border-2">
                            <AvatarImage src={useAvatar(contact)} alt="profile" className="object-fit h-full w-full" />
                            <AvatarFallback className={`uppercase h-full w-full text-xl border text-center font-medium transition-all duration-300`}>
                              {contact?.username?.split("").shift() || contact?.email?.split("").shift()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <h5 className="text-sm font-semibold text-neutral-700">{contact?.name}</h5>
                            <h6 className="text-xs font-medium text-neutral-700">{contact?.username}</h6>
                          </div>
                        </div>
                        {onlineUsers.hasOwnProperty(contact?._id!)
                          ? <HiMiniSignal size={18} />
                          : <HiMiniSignalSlash size={18} />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </div>
      </div>
      {callingActive && <StreamInfo />}
      <ProfileInfo />
    </div>
  )
}

export { ContactsContainer };