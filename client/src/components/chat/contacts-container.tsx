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
import { UserInfo } from "@/zustand/slice/auth";
import { useEffect, useState } from "react";
import { useChatStore } from "@/zustand";
import { useSocket, usePeer } from "@/context";
import { useAvatar } from "@/hooks";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const ContactsContainer = () => {
  const { isStreamActive } = usePeer();
  const { socket, onlineUsers } = useSocket();
  const { setSelectedChatType, setSelectedChatData, selectedChatData, messages } = useChatStore();

  const [fetching, setFetching] = useState(false);
  const [contacts, setContacts] = useState<UserInfo[] | null>(null);

  const fetchAllContacts = async () => {
    try {
      setFetching(true);
      const response = await api.get("/api/contact/fetch");
      setContacts(response.data.data);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (!contacts) fetchAllContacts();
  }, [contacts]);

  useEffect(() => {
    const handleConversationUpdate = (data: any) => {
      setContacts((previous: any) => {
        const updatedContacts = previous?.map((current: any) =>
          current._id === data._id
            ? { ...current, interaction: data.interaction }
            : current
        );

        const sortedContacts = updatedContacts?.sort(
          (a: any, b: any) =>
            new Date(b.interaction).getTime() - new Date(a.interaction).getTime()
        );

        return sortedContacts;
      });

      if (selectedChatData?._id === data._id) {
        setSelectedChatData({ ...selectedChatData, interaction: data.interaction });
      }
    };

    socket?.on("conversation:updated", handleConversationUpdate);

    return () => {
      socket?.off("conversation:updated", handleConversationUpdate);
    };
  }, [socket, selectedChatData]);

  useEffect(() => {
    if (contacts && selectedChatData) {
      const isExist = contacts?.some(obj => obj._id === selectedChatData?._id);

      if (!isExist) {
        const selected = { ...selectedChatData, interaction: new Date().toISOString() } as UserInfo;

        const cleaned = Object.fromEntries(
          Object.entries(selected).filter(([key]) => !["setup", "createdAt", "updatedAt", "__v"].includes(key))
        );

        setContacts((current: any) => [
          ...current,
          { ...cleaned },
        ]);
      }
    }
  }, [selectedChatData]);

  useEffect(() => {
    if (contacts && selectedChatData) {
      const atFirst = contacts[0]?._id === selectedChatData?._id;

      if (!atFirst) {
        const updated = { ...selectedChatData, interaction: new Date().toISOString() } as UserInfo;
        setSelectedChatData(updated);
      };
    }
  }, [contacts, messages.length]);

  const selectNewContact = (contact: object) => {
    setSelectedChatType("contact");
    setSelectedChatData(contact);
  }

  return (
    <div className={cn(selectedChatData && "hidden md:flex flex-col",
      "h-full w-full md:w-1/3 xl:w-1/4 border-r relative")}>
      <div className="h-bar border-b p-2">
        <Logo />
      </div>
      <div className={cn(isStreamActive ? "h-cda" : "h-clh", "w-full overflow-hidden")}>
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
                        ${selectedChatData && selectedChatData._id === contact._id && "bg-gray-100/80 text-gray-700 border-gray-300/50"} ${contact?.setup === false && "disabled"} `} onClick={() => selectNewContact(contact)}>
                        <div className="flex items-center gap-4">
                          <Avatar className="size-8 rounded-full overflow-hidden cursor-pointer border-2">
                            <AvatarImage src={useAvatar(contact)} alt="profile" className="object-fit h-full w-full" />
                            <AvatarFallback className={`uppercase h-full w-full text-xl border text-center font-medium transition-all duration-300`}>
                              {contact?.username?.split("").shift() || contact?.email?.split("").shift()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-neutral-700">{contact?.name}</span>
                            <span className="text-xs font-medium text-neutral-700">{contact?.username}</span>
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
      {isStreamActive && (
        <StreamInfo />
      )}
      <ProfileInfo />
    </div>
  )
}

export { ContactsContainer };