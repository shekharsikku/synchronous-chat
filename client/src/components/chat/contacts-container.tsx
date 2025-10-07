import { HiMiniSignal, HiMiniSignalSlash } from "react-icons/hi2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ContactListSkeleton } from "./contact-list-skeleton";
import { Logo, Title } from "./logo-title";
import { AddNewChat } from "./add-new-chat";
import { ProfileInfo } from "./profile-info";
import { StreamInfo } from "./stream-info";
import { useHotkeys } from "react-hotkeys-hook";
import { useEffect, useState } from "react";
import { useContacts } from "@/hooks/use-contacts";
import { useChats } from "@/hooks/use-chats";
import { useChatStore, UserInfo } from "@/zustand";
import { usePeer, useSocket } from "@/lib/context";
import { useDebounce, useAvatar } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const ContactsContainer = ({
  lastChatUser,
  setLastChatUser,
}: {
  lastChatUser: string | null;
  setLastChatUser: any;
}) => {
  const { callingActive } = usePeer();
  const { onlineUsers } = useSocket();
  const { setSelectedChatType, setSelectedChatData, setReplyTo } = useChatStore();

  const { contacts, fetching } = useContacts();
  const { selectedChatData } = useChats();
  const [filtered, setFiltered] = useState<UserInfo[]>([]);

  useEffect(() => {
    setFiltered(contacts || []);
  }, [contacts]);

  const filterContacts = useDebounce((value: string) => {
    if (!value) {
      setFiltered(contacts || []);
      return;
    }

    setFiltered(
      contacts?.filter(
        (contact: any) =>
          contact?.name?.toLowerCase().includes(value) || contact?.username?.toLowerCase().includes(value)
      ) || []
    );
  }, 1500);

  useHotkeys(
    "ctrl+b",
    () => {
      if (lastChatUser) {
        const lastChatData = contacts?.find((contact) => {
          return contact.username === lastChatUser;
        });
        if (lastChatData) {
          setSelectedChatType("contact");
          setSelectedChatData(lastChatData);
        }
      }
    },
    {
      enabled: !!lastChatUser,
      enableOnFormTags: ["input"],
    }
  );

  return (
    <aside
      className={cn(selectedChatData && "hidden md:flex flex-col", "h-full w-full md:w-1/3 xl:w-1/4 border-r relative")}
    >
      <header className="h-bar border-b p-2">
        <Logo />
      </header>
      <section className={cn(callingActive ? "h-cda" : "h-clh", "w-full overflow-hidden")}>
        <div className="h-full w-full flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <Title title="Chat Messages" />
            <AddNewChat />
          </div>
          <Input
            type="search"
            id="search-chat-input"
            placeholder="Search chat"
            className="rounded px-3 py-5"
            autoComplete="off"
            onChange={(e) => filterContacts(e.target.value.toLowerCase())}
          />
          {fetching ? (
            <div className="h-full overflow-y-scroll scrollbar-hide">
              <ContactListSkeleton animate="pulse" status count={10} />
            </div>
          ) : (
            <>
              {filtered?.length! <= 0 ? (
                <p className="text-neutral-700 dark:text-neutral-200">No any chat available!</p>
              ) : (
                <ScrollArea className="h-full overflow-y-auto scrollbar-hide">
                  <div className="flex flex-col gap-4">
                    {filtered?.map((contact: any) => (
                      <div
                        key={contact?._id}
                        className={`w-full flex items-center justify-between cursor-pointer transition-[transform,opacity,box-shadow] duration-0 rounded border py-2 px-4 xl:px-6 hover:transition-colors hover:duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-100/5 dark:hover:border-gray-700
                        ${
                          selectedChatData &&
                          selectedChatData._id === contact._id &&
                          "bg-gray-100/80 dark:bg-gray-100/5 border-gray-300 dark:border-gray-700"
                        } ${contact?.setup === false && "disabled"} `}
                        onClick={() => {
                          setSelectedChatType("contact");
                          setSelectedChatData(contact);
                          setLastChatUser(contact.username);
                          setReplyTo(null);
                        }}
                        role="button"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="size-8 rounded-full overflow-hidden cursor-pointer border-2">
                            <AvatarImage src={useAvatar(contact)} alt="profile" className="object-cover size-full" />
                            <AvatarFallback
                              className={`uppercase h-full w-full text-xl border text-center font-medium transition-all duration-300`}
                            >
                              {contact?.username?.split("").shift() || contact?.email?.split("").shift()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <h5 className="heading-name">{contact?.name}</h5>
                            <h6 className="heading-uname">{contact?.username}</h6>
                          </div>
                        </div>
                        {onlineUsers.hasOwnProperty(contact?._id!) ? (
                          <HiMiniSignal size={18} className="text-neutral-600 dark:text-neutral-100" />
                        ) : (
                          <HiMiniSignalSlash size={18} className="text-neutral-600 dark:text-neutral-100" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </div>
      </section>
      <footer className="w-full flex flex-col">
        {callingActive && <StreamInfo />}
        <ProfileInfo />
      </footer>
    </aside>
  );
};

export { ContactsContainer };
