import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactListSkeleton } from "@/components/chat/contact-list-skeleton";
import { GroupElement, ContactElement } from "@/components/chat/contact-element";
import { Logo, Title } from "@/components/chat/logo-title";
import { AddNewChat } from "@/components/chat/add-new-chat";
import { CreateGroup } from "@/components/chat/create-group";
import { ProfileInfo } from "@/components/chat/profile-info";
import { StreamInfo } from "@/components/chat/stream-info";
import { useHotkeys } from "react-hotkeys-hook";
import { isDesktop } from "react-device-detect";
import { Fragment, useEffect, useState } from "react";
import { useContacts } from "@/hooks/use-contacts";
import { UserInfo, GroupInfo, useChatStore } from "@/lib/zustand";
import { usePeer, useSocket } from "@/lib/context";
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
  const { contacts, groups, fetching } = useContacts();
  const { selectedChatData, setSelectedChatType, setSelectedChatData, setReplyTo } = useChatStore();

  const [currentTab, setCurrentTab] = useState("all"); // <"all" | "chats" | "groups">
  const [allChats, setAllChats] = useState<any[]>([]); // <UserInfo[] | GroupInfo[]>

  useEffect(() => {
    if (!contacts?.length && !groups?.length) {
      setAllChats([]);
      return;
    }

    if (currentTab === "all" && contacts && groups) {
      /* Merge both and tag them with type (optional) */
      let merged = [...contacts.map((c) => ({ ...c, type: "chat" })), ...groups.map((g) => ({ ...g, type: "group" }))];

      /* Sort by last interaction (descending) */
      merged.sort((a, b) => new Date(b.interaction || 0).getTime() - new Date(a.interaction || 0).getTime());

      setAllChats(merged);
    }
  }, [contacts, groups, currentTab]);

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

  const onSelectContact = (contact: any) => {
    setSelectedChatType("contact");
    setSelectedChatData(contact);
    setLastChatUser(contact.username);
    setReplyTo(null);
  };

  const onSelectGroup = (group: any) => {
    setSelectedChatType("group");
    setSelectedChatData(group);
    setLastChatUser("");
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
            className="w-full h-full overflow-hidden pb-14"
          >
            <TabsList className="bg-transparent rounded-none w-full flex gap-4 mb-4 p-0">
              {["All", "Chats", "Groups"].map((current) => (
                <TabsTrigger
                  key={current}
                  value={current.toLowerCase()}
                  className="dark:data-[state=inactive]:bg-gray-700/20 dark:data-[state=active]:bg-gray-200 dark:data-[state=inactive]:text-white dark:data-[state=active]:text-black  
                  data-[state=inactive]:bg-gray-100/80 data-[state=active]:bg-gray-200/80 data-[state=inactive]:text-gray-700 data-[state=active]:text-gray-950
                  data-[state=active]:font-semibold w-full border-none rounded p-1.5"
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
                          {current.type === "chat" ? (
                            <ContactElement
                              contact={current}
                              selectedChatData={selectedChatData}
                              onlineUsers={onlineUsers}
                              onSelectContact={onSelectContact}
                            />
                          ) : (
                            <GroupElement
                              group={current}
                              selectedChatData={selectedChatData}
                              onSelectGroup={onSelectGroup}
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
                        <Fragment key={contact._id}>
                          <ContactElement
                            contact={contact}
                            selectedChatData={selectedChatData}
                            onlineUsers={onlineUsers}
                            onSelectContact={onSelectContact}
                          />
                        </Fragment>
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
                        <Fragment key={group._id}>
                          <GroupElement
                            group={group}
                            selectedChatData={selectedChatData}
                            onSelectGroup={onSelectGroup}
                          />
                        </Fragment>
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
