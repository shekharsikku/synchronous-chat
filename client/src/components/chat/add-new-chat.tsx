import { toast } from "sonner";
import { useState } from "react";
import { HiOutlinePlus } from "react-icons/hi2";
import { ContactListSkeleton } from "./contact-list-skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserInfo } from "@/zustand/slice/auth";
import { useChatStore } from "@/zustand";
import { useDebounce } from "@/hooks";
import api from "@/lib/api";

const AddNewChat = () => {
  const { setSelectedChatType, setSelectedChatData } = useChatStore();
  const [openNewChatModal, setOpenNewChatModal] = useState(false);
  const [searchedContacts, setSearchedContacts] = useState<UserInfo[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const searchContacts = useDebounce(async (searchTerm: string) => {
    if (searchTerm.length > 0) {
      try {
        setIsFetching(true);
        const response = await api.post("/api/contact/search", { searchTerm }, { withCredentials: true })
        if (response.data.data) {
          setSearchedContacts(response.data.data);
        }
      } catch (error: any) {
        toast.error(error.response.data.message);
      } finally {
        setTimeout(() => {
          setIsFetching(false);
        }, 500)
      }
    }
  }, 500);

  const selectNewContact = (contact: object) => {
    setOpenNewChatModal(false);
    setSearchedContacts([]);
    setSelectedChatType("contact");
    setSelectedChatData(contact);
  }

  return (
    <Dialog open={openNewChatModal} onOpenChange={setOpenNewChatModal}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <HiOutlinePlus onClick={() => setOpenNewChatModal(true)} size={18}
              className="text-neutral-600 border-none outline-none transition-all duration-300" />
          </TooltipTrigger>
          <TooltipContent>
            <span className="text-neutral-700 font-medium">New Chat</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="h-96 w-80 md:w-96 flex flex-col rounded-sm">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
          <DialogDescription className="hidden"></DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 h-full w-full overflow-y-scroll scrollbar-hide">
          <Input
            id="search-contact-input"
            placeholder="Enter details"
            className="rounded px-3 py-5"
            onChange={(e) => searchContacts(e.target.value)}
          />
          {isFetching ? (
            <ContactListSkeleton animate="glow" count={4} />
          ) : (
            <>
              {searchedContacts.length <= 0 ? (
                <span className="text-gray-700">No any user available!</span>
              ) : (
                <ScrollArea className="h-60 overflow-y-auto scrollbar-hide">
                  <div className="flex flex-col gap-4 py-[2px]">
                    {searchedContacts.map((contact) => (
                      <div key={contact._id} className={`flex gap-4 border border-gray-200 w-full p-2 lg:px-3 xl:px-6 rounded
                    items-center hover:bg-gray-100/80 transition-all duration-300 cursor-pointer 
                    ${contact.name === "" ? "disabled" : ""}`} onClick={() => selectNewContact(contact)}>
                        <Avatar className="h-8 w-8 rounded-full overflow-hidden cursor-pointer">
                          <AvatarImage src={contact.image} alt="profile" className="object-fit h-full w-full" />
                          <AvatarFallback className={`uppercase h-full w-full text-xl border text-center font-medium 
                      transition-all duration-300`}>
                            {contact.username?.split("").shift() || contact.email?.split("").shift()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-neutral-700">{contact?.name}</span>
                          <span className="text-xs font-semibold text-neutral-700">{contact.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { AddNewChat };