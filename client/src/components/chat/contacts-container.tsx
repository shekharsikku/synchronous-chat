import { Fragment, useEffect, useState, useEffectEvent } from "react";
import { isDesktop } from "react-device-detect";

import { AddNewChat } from "@/components/chat/add-new-chat";
import { GroupElement, ContactElement } from "@/components/chat/contact-element";
import { ContactListSkeleton } from "@/components/chat/contact-list-skeleton";
import { CreateGroup } from "@/components/chat/create-group";
import { Logo, Title } from "@/components/chat/logo-title";
import { ProfileInfo } from "@/components/chat/profile-info";
import { StreamInfo } from "@/components/chat/stream-info";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContacts } from "@/hooks";
import { usePeer, useSocket } from "@/lib/context";
import { cn } from "@/lib/utils";
import { type UserInfo, type GroupInfo, type ChatType, useChatStore } from "@/lib/zustand";

const ContactsContainer = () => {
  const { callingActive } = usePeer();
  const { onlineUsers } = useSocket();
  const { contacts, groups, fetching } = useContacts();
  const { selectedChatData, setSelectedChatType, setSelectedChatData, setReplyTo, allChats, setAllChats } =
    useChatStore();

  const [currentTab, setCurrentTab] = useState("all");

  const handleChatSync = useEffectEvent((contacts?: UserInfo[], groups?: GroupInfo[]) => {
    if (!contacts?.length && !groups?.length) {
      setAllChats([]);
      return;
    }

    if (contacts && groups) {
      /* Merge both and tag them with type (optional) & Sort by last interaction (descending) */
      const merged = [
        ...contacts.map((contact) => ({ ...contact, type: "contact" })),
        ...groups.map((group) => ({ ...group, type: "group" })),
      ].sort((start, end) => new Date(end.interaction || 0).getTime() - new Date(start.interaction || 0).getTime());

      setAllChats(merged);
    }
  });

  useEffect(() => {
    handleChatSync(contacts, groups);
  }, [contacts, groups]);

  const handleSelectChat = (chatType: ChatType, chatData: any) => {
    setSelectedChatType(chatType);
    setSelectedChatData(chatData);
    setReplyTo(null);
  };

  return (
    <aside
      className={cn(selectedChatData && "hidden md:flex flex-col", "h-full w-full md:w-1/3 xl:w-1/4 border-r relative")}
    >
      <header className="h-bar border-b p-2">
        <Logo />
      </header>
      <section className={cn(callingActive ? "h-cda" : "h-clh", "w-full overflow-hidden")}>
        <div className="h-full w-full flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between px-1">
            <Title title={`${currentTab} messages`} />
            <div className="flex gap-4">
              {isDesktop && <CreateGroup />}
              <AddNewChat />
            </div>
          </div>
          <Tabs
            defaultValue="all"
            value={currentTab}
            onValueChange={(value) => setCurrentTab(value)}
            className="w-full h-full overflow-hidden"
          >
            <TabsList className="bg-transparent rounded-none w-full flex gap-4 mb-4 p-0">
              {["All", "Chats", "Groups"].map((current) => (
                <TabsTrigger
                  key={current}
                  value={current.toLowerCase()}
                  className="dark:data-[state=inactive]:bg-gray-700/20 dark:data-[state=active]:bg-gray-200 dark:data-[state=inactive]:text-white dark:data-[state=active]:text-black  
                  data-[state=inactive]:bg-gray-100/80 data-[state=active]:bg-gray-200/80 data-[state=inactive]:text-gray-700 data-[state=active]:text-gray-950
                  data-[state=active]:font-semibold w-full border-none rounded p-1.5 duration-0"
                >
                  {current}
                </TabsTrigger>
              ))}
            </TabsList>

            {fetching ? (
              <div className="h-full overflow-y-scroll scrollbar-hide">
                <ContactListSkeleton animate="pulse" count={10} />
              </div>
            ) : (
              <ScrollArea className="h-full overflow-y-scroll scrollbar-hide py-0.5">
                {/* For all Contact & Groups */}
                <TabsContent value="all" className="mt-0">
                  {allChats.length <= 0 ? (
                    <p className="text-neutral-700 dark:text-neutral-200">No any chat or group available!</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {allChats.map((current) => (
                        <Fragment key={current._id}>
                          {current.type === "contact" ? (
                            <ContactElement
                              contact={current}
                              selectedChatData={selectedChatData}
                              onlineUsers={onlineUsers}
                              handleSelectChat={handleSelectChat}
                            />
                          ) : (
                            <GroupElement
                              group={current}
                              selectedChatData={selectedChatData}
                              handleSelectChat={handleSelectChat}
                            />
                          )}
                        </Fragment>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* For Contacts */}
                <TabsContent value="chats" className="mt-0">
                  {contacts?.length! <= 0 ? (
                    <p className="text-neutral-700 dark:text-neutral-200">No any chat available!</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {contacts?.map((contact: UserInfo) => (
                        <ContactElement
                          key={contact._id}
                          contact={contact}
                          selectedChatData={selectedChatData}
                          onlineUsers={onlineUsers}
                          handleSelectChat={handleSelectChat}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* For Groups */}
                <TabsContent value="groups" className="mt-0">
                  {groups?.length! <= 0 ? (
                    <p className="text-neutral-700 dark:text-neutral-200">No any group available!</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {groups?.map((group: GroupInfo) => (
                        <GroupElement
                          key={group._id}
                          group={group}
                          selectedChatData={selectedChatData}
                          handleSelectChat={handleSelectChat}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            )}
          </Tabs>
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
