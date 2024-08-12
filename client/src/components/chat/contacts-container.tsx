import { Logo, Title } from "@/components";
import { ProfileInfo } from "./profile-info";
import { AddNewChat } from "./add-new-chat";
import { useSocket } from "@/context/socket-context";
import { useEffect, useState } from "react";
import { UserInfo } from "@/zustand/slice/auth";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HiMiniSignal, HiMiniSignalSlash } from "react-icons/hi2";
import { useChatStore } from "@/zustand";
import { getColor } from "@/utils";
import api from "@/lib/api";
// import { useSelector } from "react-redux";

const ContactsContainer = () => {
  // const { authenticated, userData } = useSelector((state: any) => state.auth);
  // console.log({ authenticated, uid: userData._id });

  const { onlineUsers } = useSocket();
  const { setSelectedChatType, setSelectedChatData, selectedChatData, setMessages, messages } = useChatStore();
  const [allContacts, setAllContacts] = useState<[UserInfo] | null>(null);

  const fetchAllContacts = async () => {
    try {
      const response = await api.get("/api/contact/dm-contacts", { withCredentials: true });
      const data = await response.data.data;
      await setAllContacts(data);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  useEffect(() => {
    fetchAllContacts();
  }, [setAllContacts, setMessages, messages]);

  const selectNewContact = (contact: object) => {
    setSelectedChatType("contact");
    setSelectedChatData(contact);
  }

  return (
    <div className="relative md:w-[35vw] lg:w-[25vw] border-r border-gray-200 w-full h-full">
      <div className="h-[10vh] border-b border-gray-200 p-2">
        <Logo />
      </div>
      <div className="my-8 px-4 lg:px-6 xl:px-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Title title="Chat Messages" />
          <AddNewChat />
        </div>
        {allContacts?.length! <= 0 ? (
          <p className="text-neutral-700">No any contact available!</p>
        ) : (
          <ScrollArea className="min-h-[50px] h-auto overflow-y-auto scrollbar-hide">
            <div className="flex flex-col gap-4 py-1">
              {allContacts?.map((contact) => (

                <div key={contact._id} className={`flex border border-gray-200 w-full p-2 lg:px-3 xl:px-6 rounded items-center hover:bg-gray-100/80 transition-all duration-300 cursor-pointer justify-between 
                  ${contact.fullName === "" ? "disabled" : ""} 
                  ${selectedChatData && selectedChatData._id === contact._id ? getColor(parseInt(contact.profileColor!)) : ""}`} onClick={() => selectNewContact(contact)}>

                  <div className="flex items-center gap-4">
                    <Avatar className="h-8 w-8 rounded-full overflow-hidden cursor-pointer">
                      <AvatarImage src={contact.imageUrl} alt="profile" className="object-fit h-full w-full" />
                      <AvatarFallback className={`uppercase h-full w-full text-xl border-[1px] text-center font-medium 
                      transition-all duration-300 ${getColor(parseInt(contact.profileColor!))}`}>
                        {contact.username?.split("").shift() || contact.email?.split("").shift()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-neutral-700">{contact?.fullName}</span>
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
      </div>
      <ProfileInfo />
    </div>
  )
}

export { ContactsContainer };