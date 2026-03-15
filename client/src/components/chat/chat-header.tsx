import { useState, useReducer, ChangeEvent, useRef, useEffect } from "react";
import { isDesktop } from "react-device-detect";
import { useHotkeys } from "react-hotkeys-hook";
import {
  HiOutlinePhone,
  HiOutlineXMark,
  HiOutlineLanguage,
  HiOutlineVideoCamera,
  HiOutlineShare,
  HiOutlineTrash,
  HiOutlineCloudArrowUp,
} from "react-icons/hi2";
import { LuInfo, LuAudioLines } from "react-icons/lu";
import { toast } from "sonner";
import { groupAvatar } from "@/assets/images";
import { GroupMembersList, GroupMemberManage } from "@/components/chat/member-list";
import { RenderActionIcon } from "@/components/chat/render-action-icon";
import { TooltipElement } from "@/components/chat/tooltip-element";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadActionDialog } from "@/components/chat/upload-action-dialog";
import { useContacts, useImageSelector, useGroupUpdate } from "@/hooks";
import api from "@/lib/api";
import env from "@/lib/env";
import { useSocket, usePeer } from "@/lib/context";
import { cn, languageOptions, getAvatar, formatUtcTimestamp } from "@/lib/utils";
import { useAuthStore, useChatStore } from "@/lib/zustand";

type DetailsAction =
  | { type: "UPDATE_FIELD"; field: "name" | "description"; value: string }
  | { type: "SET_DATA"; payload: { name: string; description: string } }
  | { type: "RESET_FORM" };

const initialDetails = (groupDetails: GroupInfo): DetailsState => {
  return {
    name: groupDetails.name || "",
    description: groupDetails.description || "",
  };
};

function detailsReducer(state: DetailsState, action: DetailsAction) {
  switch (action.type) {
    case "UPDATE_FIELD":
      return { ...state, [action.field]: action.value };

    case "SET_DATA":
      return { ...state, name: action.payload.name, description: action.payload.description };

    case "RESET_FORM":
      return { ...state, name: "", description: "" };

    default:
      return state;
  }
}

type AvatarState = {
  selectedImage: string | null;
  imageFormData: FormData | null;
  isConfirmOpen: boolean;
  isDeleteOpen: boolean;
};

type AvatarAction =
  | { type: "SET_SELECTED_IMAGE"; payload: string | null }
  | { type: "SET_IMAGE_FORM_DATA"; payload: FormData | null }
  | { type: "TOGGLE_CONFIRMATION_MODAL"; payload?: boolean }
  | { type: "TOGGLE_DELETION_MODAL"; payload?: boolean }
  | { type: "RESET_AVATAR_STATE" };

const initialAvatar = {
  selectedImage: null,
  imageFormData: null,
  isConfirmOpen: false,
  isDeleteOpen: false,
};

function avatarReducer(state: AvatarState, action: AvatarAction) {
  switch (action.type) {
    case "TOGGLE_CONFIRMATION_MODAL":
      return { ...state, isConfirmOpen: action.payload ?? !state.isConfirmOpen };

    case "TOGGLE_DELETION_MODAL":
      return { ...state, isDeleteOpen: action.payload ?? !state.isDeleteOpen };

    case "SET_SELECTED_IMAGE":
      return { ...state, selectedImage: action.payload };

    case "SET_IMAGE_FORM_DATA":
      return { ...state, imageFormData: action.payload };

    case "RESET_AVATAR_STATE":
      return { ...state, selectedImage: null, imageFormData: null };

    default:
      return state;
  }
}

const tooltipMap = {
  member: "Remove from group",
  remove: "Undo remove",
  add: "Added to group",
  none: "Add to group",
};

const ChatHeader = () => {
  const { userInfo } = useAuthStore();
  const {
    selectedChatData,
    selectedChatType,
    closeChat,
    isPartnerTyping,
    language,
    setLanguage,
    messageStats,
    groupSettingDialog,
    setGroupSettingDialog,
  } = useChatStore();
  const { contacts, groups } = useContacts();
  const { handleGroupUpdate } = useGroupUpdate();
  const userAvatar = getAvatar(selectedChatData);
  const refForNameInput = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openUserInfoModal, setOpenUserInfoModal] = useState(false);
  const [openGroupInfoModal, setOpenGroupInfoModal] = useState(false);
  const [inputReadOnlyEnable, setInputReadOnlyEnable] = useState(true);
  const [isUpdatePending, setIsUpdatePending] = useState(false);
  const [detailsState, detailsDispatch] = useReducer(detailsReducer, selectedChatData, initialDetails);
  const [avatarState, avatarDispatch] = useReducer(avatarReducer, initialAvatar);

  const [memberChanges, setMemberChanges] = useState<MemberUpdateState>({
    add: [],
    remove: [],
  });

  useHotkeys("ctrl+q", () => closeChat(), {
    enabled: !!selectedChatData,
    enableOnFormTags: ["input"],
  });

  const {
    localInfo,
    callingActive,
    pendingRequest,
    setPendingRequest,
    setCallingDialog,
    callingInfo,
    setMediaType,
    setOpenPeerShareModal,
  } = usePeer();
  const { socket, onlineUsers } = useSocket();

  const isCurrentlyOnline = onlineUsers.hasOwnProperty(selectedChatData?._id!);

  const requestVoiceCalling = (userId: string, type: "audio" | "video") => {
    if (callingActive || pendingRequest) {
      toast.info("Can't request for another call currently!");
      return;
    }

    /** Local user details for call request */
    const callingDetails = {
      from: localInfo?.uid,
      name: localInfo?.name,
      to: userId,
      pid: localInfo?.pid,
      type: type,
    };

    setMediaType(type);
    setPendingRequest(true);
    socket?.emit("before:call-request", { callingDetails });
  };

  const handleDetailActionClick = (action: "change" | "clear") => {
    if (action === "change") {
      setInputReadOnlyEnable(false);
    }

    if (action === "clear") {
      detailsDispatch({ type: "RESET_FORM" });
    }

    refForNameInput.current?.focus();
  };

  const handleDetailsChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    detailsDispatch({
      type: "UPDATE_FIELD",
      field: event.target.name as "name" | "description",
      value: event.target.value,
    });
  };

  const handleDetailsSubmit = async () => {
    const nameAlreadyExists = groups?.some((group) => {
      return group.name === detailsState.name && group._id !== selectedChatData?._id;
    });

    if (nameAlreadyExists) {
      toast.info("Group with this name already exists!");
      return;
    }

    setIsUpdatePending(true);

    try {
      const response = await api.patch(`/api/group/update/${selectedChatData._id}/details`, detailsState);
      handleGroupUpdate(response.data.data);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }

    setInputReadOnlyEnable(true);
    setIsUpdatePending(false);
  };

  const handleMembersUpdate = async () => {
    setIsUpdatePending(true);

    try {
      const response = await api.patch(`/api/group/update/${selectedChatData._id}/members`, memberChanges);
      handleGroupUpdate(response.data.data);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }

    setMemberChanges({ add: [], remove: [] });
    setIsUpdatePending(false);
  };

  useEffect(() => {
    return () => {
      if (avatarState.selectedImage) {
        URL.revokeObjectURL(avatarState.selectedImage);
      }
    };
  }, [avatarState.selectedImage]);

  const { handleImageSelect } = useImageSelector({
    formKey: "group-avatar",
    onSuccess: (previewUrl, formData) => {
      avatarDispatch({ type: "SET_SELECTED_IMAGE", payload: previewUrl });
      avatarDispatch({ type: "SET_IMAGE_FORM_DATA", payload: formData });
      avatarDispatch({ type: "TOGGLE_CONFIRMATION_MODAL", payload: true });
    },
    onError: () => {
      avatarDispatch({ type: "RESET_AVATAR_STATE" });
      avatarDispatch({ type: "TOGGLE_CONFIRMATION_MODAL", payload: false });
    },
  });

  const handleAvatarUpload = async (formData: FormData | null) => {
    if (!formData) return;
    setIsUpdatePending(true);

    try {
      const response = await api.patch(`/api/group/update/${selectedChatData._id}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      handleGroupUpdate(response.data.data);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }

    avatarDispatch({ type: "RESET_AVATAR_STATE" });
    avatarDispatch({ type: "TOGGLE_CONFIRMATION_MODAL", payload: false });
    setIsUpdatePending(false);
  };

  const handleAvatarDelete = async () => {
    setIsUpdatePending(true);

    try {
      const response = await api.delete(`/api/group/delete/${selectedChatData._id}/avatar`);
      handleGroupUpdate(response.data.data);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }

    avatarDispatch({ type: "RESET_AVATAR_STATE" });
    avatarDispatch({ type: "TOGGLE_DELETION_MODAL", payload: false });
    setIsUpdatePending(false);
  };

  const toggleMember = (userId: string) => {
    setMemberChanges((prev: MemberUpdateState) => {
      const isOriginalMember = selectedChatData.members?.includes(userId);

      if (isOriginalMember) {
        // removing existing member
        if (prev.remove.includes(userId)) {
          return {
            ...prev,
            remove: prev.remove.filter((id) => id !== userId),
          };
        }

        return {
          ...prev,
          remove: [...prev.remove, userId],
        };
      } else {
        // adding new member
        if (prev.add.includes(userId)) {
          return {
            ...prev,
            add: prev.add.filter((id) => id !== userId),
          };
        }

        return {
          ...prev,
          add: [...prev.add, userId],
        };
      }
    });
  };

  const getMemberStatus = (userId: string) => {
    const isOriginalMember = selectedChatData.members?.includes(userId);

    if (memberChanges.remove.includes(userId)) return "remove";
    if (memberChanges.add.includes(userId)) return "add";

    return isOriginalMember ? "member" : "none";
  };

  return (
    <header className="h-bar border-b flex items-center justify-between p-2">
      <div className="h-full w-full rounded flex items-center justify-between px-4 bg-gray-100/80 dark:bg-transparent">
        <div className="flex gap-4 items-center justify-center">
          {selectedChatType === "group" && (
            <TooltipElement content="Group Info" asChild>
              <Avatar
                className="size-9 rounded-full overflow-hidden cursor-pointer border-2"
                onClick={() => setOpenGroupInfoModal(true)}
              >
                <AvatarImage
                  src={selectedChatData.avatar || groupAvatar}
                  alt="avatar"
                  className="object-cover size-full"
                />
                <AvatarFallback
                  className={`uppercase h-full w-full text-xl border text-center font-medium 
                  transition-all duration-300 bg-[#06d6a02a] text-[#06d6a0] border-[#06d6a0bb`}
                >
                  {selectedChatData?.name.charAt(0) ?? ""}
                </AvatarFallback>
              </Avatar>
            </TooltipElement>
          )}

          <Dialog open={openGroupInfoModal} onOpenChange={setOpenGroupInfoModal}>
            <DialogContent className="w-80 md:w-96 h-max rounded-md shadow-lg transition-all hover:shadow-2xl p-6 select-none">
              <DialogHeader className="hidden">
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>

              <div className="w-full flex flex-col gap-4">
                <div className="w-full flex gap-4">
                  <div className="size-max">
                    <img
                      src={selectedChatData.avatar || groupAvatar}
                      alt="Group Avatar"
                      className="size-16 md:size-20 rounded-full border-4 border-white object-cover shadow-lg transition-all"
                    />
                  </div>
                  <div className="w-2/3 flex flex-col justify-center gap-1.5">
                    <h3 className="text-lg md:text-xl font-bold">{selectedChatData.name}</h3>
                    <p className="text-xs md:text-sm max-w-48 md:max-w-56 text-ellipsis wrap-break-word line-clamp-2">
                      {selectedChatData.description}
                    </p>
                  </div>
                </div>

                <GroupMembersList selectedChatData={selectedChatData} />

                <p className="text-center text-xs md:text-sm tracking-wider text-gray-500 dark:text-gray-100">
                  Created at: {formatUtcTimestamp(selectedChatData?.createdAt)}
                </p>
              </div>
            </DialogContent>
          </Dialog>

          {selectedChatType === "contact" && (
            <TooltipElement content="Chat Info" asChild>
              <Avatar
                className="size-9 rounded-full overflow-hidden cursor-pointer border-2"
                onClick={() => setOpenUserInfoModal(true)}
              >
                <AvatarImage src={userAvatar} alt="profile" className="object-cover size-full" />
                <AvatarFallback
                  className={`uppercase h-full w-full text-xl border text-center font-medium 
                      transition-all duration-300 bg-[#06d6a02a] text-[#06d6a0] border-[#06d6a0bb`}
                >
                  {(selectedChatData?.name || selectedChatData?.username || selectedChatData?.email)?.charAt(0) ?? ""}
                </AvatarFallback>
              </Avatar>
            </TooltipElement>
          )}

          {/* Dialog for show user information */}
          <Dialog open={openUserInfoModal} onOpenChange={setOpenUserInfoModal}>
            <DialogContent className="w-80 md:w-96 rounded-md shadow-lg transition-all hover:shadow-2xl p-6 select-none">
              <DialogHeader className="hidden">
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              {/* Profile Image */}
              <div className="flex justify-center">
                <img
                  className="size-28 lg:size-32 rounded-full border-4 border-white 
                  object-cover shadow-lg -mt-20 lg:-mt-24 transition-all"
                  src={userAvatar}
                  alt="User profile"
                />
              </div>
              {/* User Info */}
              <div className="text-center pt-4">
                <h2 className="text-2xl font-bold">{selectedChatData?.name}</h2>
                <p className="text-gray-500 dark:text-gray-100">{selectedChatData?.username}</p>
                <p className="mt-2 text-gray-600 dark:text-gray-200 text-sm">{selectedChatData?.bio}</p>
              </div>
              {/* User Stats */}
              <div className="flex flex-col justify-around text-sm border-t border-gray-200 pt-4">
                <p className="text-center text-xl mb-4 font-semibold">Message Stats</p>
                <div className="flex justify-evenly">
                  <div className="text-center">
                    <p className="font-semibold text-lg">{messageStats.sent}</p>
                    <p className="text-gray-500 dark:text-gray-100">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{messageStats.received}</p>
                    <p className="text-gray-500 dark:text-gray-100">Received</p>
                  </div>
                </div>
              </div>
              {/* Last Message Time */}
              <p className="text-center text-xs md:text-sm tracking-wider text-gray-500 dark:text-gray-100">
                Last msg: {formatUtcTimestamp(selectedChatData?.interaction)}
              </p>
            </DialogContent>
          </Dialog>

          {/* Username and Typing Indicator */}
          <div className="flex flex-col">
            <h3 className="font-semibold">
              {selectedChatData?.name || selectedChatData?.username || selectedChatData?.email}
            </h3>
            <p className="text-xs">
              {selectedChatType === "contact" ? (
                <>
                  {isCurrentlyOnline ? (
                    <>
                      {isPartnerTyping ? (
                        <>
                          <span>typing</span>
                          <span className="typing">.</span>
                          <span className="typing">.</span>
                          <span className="typing">.</span>
                        </>
                      ) : (
                        <span>online</span>
                      )}
                    </>
                  ) : (
                    <span>offline</span>
                  )}
                </>
              ) : (
                <span>
                  {`${selectedChatData?.members?.length ?? 0} ${selectedChatData?.members?.length === 1 ? "member" : "members"}`}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          {/* Group Info & Setting */}
          {selectedChatType === "group" && selectedChatData.admin === userInfo?._id && isDesktop && (
            <TooltipElement content="More Info">
              <LuInfo
                size={18}
                strokeWidth={1.5}
                className="tooltip-icon"
                onClick={() => setGroupSettingDialog(true)}
              />
            </TooltipElement>
          )}

          <Dialog
            open={groupSettingDialog}
            onOpenChange={(open) => {
              setGroupSettingDialog(open);
              setInputReadOnlyEnable(true);
              detailsDispatch({
                type: "SET_DATA",
                payload: { name: selectedChatData?.name, description: selectedChatData?.description },
              });
              avatarDispatch({ type: "RESET_AVATAR_STATE" });
              setMemberChanges({ add: [], remove: [] });
            }}
          >
            <DialogContent
              onOpenAutoFocus={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
              className="w-120 md:w-160 lg:w-200 h-max rounded-md shadow-lg transition-all hover:shadow-2xl p-6 select-none"
            >
              <DialogHeader className="hidden">
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>

              <div className="w-full flex flex-col gap-4">
                <div className="w-full flex justify-between gap-4">
                  <div className="h-full w-2/6 p-5">
                    <ContextMenu>
                      <ContextMenuTrigger className="size-full">
                        <Avatar className="size-full rounded-full overflow-hidden">
                          <AvatarImage
                            src={avatarState.selectedImage || selectedChatData.avatar}
                            alt="group-avatar"
                            className="object-cover size-full"
                          />
                          <AvatarFallback className="uppercase size-full text-5xl border-2 text-center font-bold transition-all bg-gray-50 dark:bg-transparent hover:bg-[#4cc9f02a] text-[#4cc9f0] border-[#4cc9f0bb]">
                            {selectedChatData?.name?.charAt(0) ?? ""}
                          </AvatarFallback>
                        </Avatar>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-20 flex flex-col gap-2 p-2 transition-all duration-300 text-gray-950 dark:text-gray-50">
                        {selectedChatData.avatar && (
                          <ContextMenuItem
                            className="flex gap-2"
                            onClick={() => avatarDispatch({ type: "TOGGLE_DELETION_MODAL", payload: true })}
                          >
                            <HiOutlineTrash size={16} className="text-neutral-600 dark:text-neutral-100" /> Delete
                          </ContextMenuItem>
                        )}
                        <ContextMenuItem className="flex gap-2" onClick={() => fileInputRef.current?.click()}>
                          <HiOutlineCloudArrowUp size={16} className="text-neutral-600 dark:text-neutral-100" /> Upload
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                    <input
                      type="file"
                      id="group-avatar-inp"
                      ref={fileInputRef}
                      name="group-avatar"
                      onChange={handleImageSelect}
                      accept=".png, .jpg, .jpeg, .webp"
                      className="hidden"
                    />
                  </div>

                  <div className="w-4/6 flex justify-center gap-1.5 pt-2 relative">
                    <div className="w-full flex flex-col gap-3">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          type="text"
                          id="group-name-inp"
                          name="name"
                          placeholder="Group Name"
                          value={detailsState.name}
                          autoComplete="off"
                          onChange={handleDetailsChange}
                          readOnly={inputReadOnlyEnable}
                          ref={refForNameInput}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          type="text"
                          id="group-desc-inp"
                          name="description"
                          placeholder="Group Description"
                          value={detailsState.description}
                          autoComplete="off"
                          onChange={handleDetailsChange}
                          readOnly={inputReadOnlyEnable}
                        />
                      </div>
                    </div>

                    <div className="absolute -top-2 right-5 flex items-center w-4 justify-center">
                      <RenderActionIcon
                        detailsState={detailsState}
                        selectedChatData={selectedChatData}
                        memberChanges={memberChanges}
                        isUpdatePending={isUpdatePending}
                        inputReadOnlyEnable={inputReadOnlyEnable}
                        handleDetailsSubmit={handleDetailsSubmit}
                        handleMembersUpdate={handleMembersUpdate}
                        handleDetailActionClick={handleDetailActionClick}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <GroupMemberManage
                contacts={contacts}
                getMemberStatus={getMemberStatus}
                toggleMember={toggleMember}
                tooltipMap={tooltipMap}
              />

              <p className="text-center text-xs md:text-sm tracking-wider text-gray-500 dark:text-gray-100">
                Updated at: {formatUtcTimestamp(selectedChatData?.updatedAt)}
              </p>
            </DialogContent>
          </Dialog>

          {/* Dialog for avatar update/delete confirmation */}
          <UploadActionDialog
            isConfirmOpen={avatarState.isConfirmOpen}
            onConfirmChange={(open) => avatarDispatch({ type: "TOGGLE_CONFIRMATION_MODAL", payload: open })}
            confirmTitle="Update group avatar?"
            confirmDesc="Update group avatar for better user interactions!"
            onUploadCancel={() => {
              avatarDispatch({ type: "RESET_AVATAR_STATE" });
              avatarDispatch({ type: "TOGGLE_CONFIRMATION_MODAL", payload: false });
            }}
            onUploadConfirm={() => handleAvatarUpload(avatarState.imageFormData)}
            isUpdatePending={isUpdatePending}
            isDeleteOpen={avatarState.isDeleteOpen}
            onDeleteChange={(open) => avatarDispatch({ type: "TOGGLE_DELETION_MODAL", payload: open })}
            deleteTitle="Delete group avatar?"
            deleteDesc="Are you sure to delete group avatar?"
            onDeleteCancel={() => {
              avatarDispatch({ type: "RESET_AVATAR_STATE" });
              avatarDispatch({ type: "TOGGLE_DELETION_MODAL", payload: false });
            }}
            onDeleteConfirm={handleAvatarDelete}
          />

          {/* Voice & Video Stream Info */}
          {selectedChatType === "contact" && isCurrentlyOnline && (
            <>
              {callingActive && callingInfo?.uid === selectedChatData?._id ? (
                <TooltipElement content="Call Info">
                  <LuAudioLines
                    size={20}
                    strokeWidth={1.5}
                    onClick={() => setCallingDialog(true)}
                    className="tooltip-icon"
                  />
                </TooltipElement>
              ) : (
                <>
                  <TooltipElement content="Peer Share" disabled={pendingRequest}>
                    <HiOutlineShare size={18} onClick={() => setOpenPeerShareModal(true)} className="tooltip-icon" />
                  </TooltipElement>
                  <TooltipElement content="Video Call" disabled={pendingRequest}>
                    <HiOutlineVideoCamera
                      size={20}
                      onClick={() => requestVoiceCalling(selectedChatData?._id!, "video")}
                      className="tooltip-icon"
                    />
                  </TooltipElement>
                  <TooltipElement content="Voice Call" disabled={pendingRequest}>
                    <HiOutlinePhone
                      size={18}
                      onClick={() => requestVoiceCalling(selectedChatData?._id!, "audio")}
                      className="tooltip-icon"
                    />
                  </TooltipElement>
                </>
              )}
            </>
          )}
          {/* Translate Language */}
          <DropdownMenu>
            <TooltipElement content="Translate" asChild>
              <DropdownMenuTrigger asChild className={cn(env.isProd && "hidden")}>
                <HiOutlineLanguage size={18} className="tooltip-icon" />
              </DropdownMenuTrigger>
            </TooltipElement>
            <DropdownMenuContent className="w-36 mt-4 mr-6 bg-background">
              <DropdownMenuLabel>Select Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-52 overflow-y-auto scrollbar-hide">
                <DropdownMenuRadioGroup value={language} onValueChange={setLanguage} className="space-y-1">
                  {languageOptions.map((option) => (
                    <DropdownMenuRadioItem
                      key={option.code}
                      value={option.code}
                      className={`flex items-center justify-start gap-2 text-sm capitalize cursor-pointer rounded-md 
                    ${option.code === language && "bg-neutral-100 dark:bg-neutral-800"}`}
                    >
                      {option.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Close Chat */}
          <TooltipElement content="Close">
            <HiOutlineXMark size={20} onClick={closeChat} className="tooltip-icon" />
          </TooltipElement>
        </div>
      </div>
    </header>
  );
};

export { ChatHeader };
