import { Logo, Title } from "@/components";
import { ProfileInfo } from "./profile-info";
import { AddNewChat } from "./add-new-chat";
import { ContactListSkeleton } from "./contact-list-skeleton";
import { useSocket } from "@/context/socket-context";
import { useEffect, useState } from "react";
import { UserInfo } from "@/zustand/slice/auth";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HiMiniSignal, HiMiniSignalSlash } from "react-icons/hi2";
import { useChatStore } from "@/zustand";
import { useAvatar } from "@/hooks";
import api from "@/lib/api";

const ContactsContainer = () => {
  const { socket, onlineUsers } = useSocket();
  const { setSelectedChatType, setSelectedChatData, selectedChatData, messages } = useChatStore();

  const [fetching, setFetching] = useState(false);
  const [contacts, setContacts] = useState<UserInfo[] | null>(null);

  const fetchAllContacts = async () => {
    try {
      setFetching(true);
      const response = await api.get("/api/contact/fetch", { withCredentials: true });
      const data = await response.data.data;
      setContacts(data);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchAllContacts();
  }, []);

  useEffect(() => {
    socket?.on("conversation:updated", (data) => {
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
        setSelectedChatData({ ...selectedChatData, interaction: data.interaction })
      }
    });
  }, [socket]);

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
    <div className="relative md:w-[35vw] lg:w-[25vw] border-r border-gray-200 w-full h-full">
      <div className="h-[10vh] border-b border-gray-200 p-2">
        <Logo />
      </div>
      <div className="my-6 lg:my-8 px-4 lg:px-6 xl:px-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Title title="Chat Messages" />
          <AddNewChat />
        </div>
        {fetching ? (
          <ContactListSkeleton animate="pulse" status />
        ) : (
          <>
            {contacts?.length! <= 0 ? (
              <p className="text-neutral-700">No any chat available!</p>
            ) : (
              <ScrollArea className="min-h-[50px] max-h-[65vh] overflow-y-auto scrollbar-hide">
                <div className="flex flex-col gap-4 py-[2px]">
                  {contacts?.map((contact) => (
                    <div key={contact?._id} className={`flex border border-gray-200 w-full p-2 lg:px-3 xl:px-6 rounded items-center hover:bg-gray-100/80 transition-all duration-300 cursor-pointer justify-between 
                  ${contact?.name === "" ? "disabled" : ""} 
                  ${selectedChatData && selectedChatData._id === contact._id ? "bg-[#06d6a02a] text-[#06d6a0] border-[1px] border-[#06d6a0bb]" : ""}`} onClick={() => selectNewContact(contact)}>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-8 w-8 rounded-full overflow-hidden cursor-pointer">
                          <AvatarImage src={useAvatar(contact)} alt="profile" className="object-fit h-full w-full" />
                          <AvatarFallback className={`uppercase h-full w-full text-xl border-[1px] text-center font-medium 
                      transition-all duration-300`}>
                            {contact?.username?.split("").shift() || contact?.email?.split("").shift()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-neutral-700">{contact?.name}</span>
                          <span className="text-xs font-semibold text-neutral-700">{contact?.username}</span>
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
      <ProfileInfo />
    </div>
  )
}

export { ContactsContainer };