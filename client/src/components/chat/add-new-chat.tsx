import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { HiOutlineUserPlus } from "react-icons/hi2";

import { ContactListSkeleton } from "@/components/chat/contact-list-skeleton";
import { TooltipElement } from "@/components/chat/tooltip-element";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce, useContacts } from "@/hooks";
import api from "@/lib/api";
import { getAvatar } from "@/lib/utils";
import { useAuthStore, useChatStore, type UserInfo } from "@/lib/zustand";

const EXCLUDED_KEYS = new Set(["setup", "createdAt", "updatedAt", "__v"]);

const cleanContact = (contact: UserInfo) => {
  return Object.fromEntries(Object.entries(contact).filter(([key]) => !EXCLUDED_KEYS.has(key))) as UserInfo;
};

const AddNewChat = () => {
  const queryClient = useQueryClient();
  const { contacts } = useContacts();
  const { userInfo } = useAuthStore();
  const { setSelectedChatType, setSelectedChatData } = useChatStore();
  const [openNewChatModal, setOpenNewChatModal] = useState(false);
  const [searchedContacts, setSearchedContacts] = useState<UserInfo[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  useHotkeys("ctrl+alt+n", () => setOpenNewChatModal((prev) => !prev), {
    enabled: !isFetching,
    enableOnFormTags: ["input"],
  });

  const searchContacts = useDebounce(async (searchTerm: string) => {
    if (searchTerm.trim().length < 3) return;
    try {
      setIsFetching(true);
      const newContact = await queryClient.fetchQuery({
        queryKey: ["search", searchTerm],
        queryFn: async () => {
          const response = await api.get(`api/contact/search?search=${searchTerm}`);
          return response.data.data;
        },
        staleTime: 60 * 60 * 1000, // Cache for 1 hour
        gcTime: 2 * 60 * 60 * 1000,
      });
      setSearchedContacts(newContact);
    } catch {
      setSearchedContacts([]);
    } finally {
      setTimeout(() => setIsFetching(false), 500);
    }
  }, 1500);

  const selectNewContact = (contact: UserInfo) => {
    setOpenNewChatModal(false);
    setSearchedContacts([]);
    setSelectedChatType("contact");
    setSelectedChatData(contact);

    if (!userInfo?._id || contacts?.some((obj) => obj._id === contact._id)) return;

    const cleaned = cleanContact({ ...contact, interaction: new Date().toISOString() });

    queryClient.setQueryData<UserInfo[]>(["contacts", userInfo?._id], (older = []) => [...older, cleaned]);
  };

  return (
    <Dialog open={openNewChatModal} onOpenChange={setOpenNewChatModal}>
      <TooltipElement content="New Chat">
        <HiOutlineUserPlus onClick={() => setOpenNewChatModal(true)} size={18} className="tooltip-icon" />
      </TooltipElement>

      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="h-96 w-80 md:w-96 flex flex-col rounded-md select-none"
      >
        <DialogHeader>
          <DialogTitle className="text-start">New Chat</DialogTitle>
          <DialogDescription className="hidden"></DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 h-full w-full overflow-y-scroll scrollbar-hide">
          <Input
            id="search-contact-input"
            placeholder="Enter name or username"
            className="rounded px-3 py-5"
            autoComplete="off"
            onChange={(e) => searchContacts(e.target.value)}
          />
          {isFetching ? (
            <ContactListSkeleton animate="glow" count={4} />
          ) : (
            <>
              {searchedContacts.length <= 0 ? (
                <span className="text-gray-700 dark:text-gray-200 text-center my-auto">No any user available!</span>
              ) : (
                <ScrollArea className="h-60 overflow-y-auto scrollbar-hide">
                  <div className="flex flex-col gap-4 py-0.5">
                    {searchedContacts.map((contact) => (
                      <div
                        key={contact._id}
                        className="flex gap-4 border w-full p-2 lg:px-3 xl:px-6 rounded items-center hover:bg-gray-100/80  dark:hover:bg-gray-100/5 dark:hover:border-gray-700 transition-[transform,opacity,box-shadow] duration-0 hover:transition-colors hover:duration-300 cursor-pointer"
                        onClick={() => selectNewContact(contact)}
                        role="button"
                      >
                        <Avatar className="size-8 rounded-full overflow-hidden cursor-pointer border-2">
                          <AvatarImage src={getAvatar(contact)} alt="profile" className="object-fit h-full w-full" />
                          <AvatarFallback className="uppercase h-full w-full text-xl border text-center font-medium transition-all duration-300">
                            {(contact?.name ?? contact?.username ?? contact?.email)?.charAt(0) ?? ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <h5 className="heading-name">{contact?.name}</h5>
                          <h6 className="heading-uname">{contact?.username}</h6>
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
  );
};

export { AddNewChat };
