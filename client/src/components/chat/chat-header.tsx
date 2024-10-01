import { HiOutlineEllipsisVertical, HiOutlineXMark } from "react-icons/hi2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useChatStore } from "@/zustand";
import { useState } from "react";

const ChatHeader = () => {
  const { selectedChatData, closeChat } = useChatStore();
  const [openUserInfoModal, setOpenUserInfoModal] = useState(false);
  const defaultImage = "https://res.cloudinary.com/do1m5szld/image/upload/v1721983520/no-avatar_jvggxi.png";

  return (
    <div className="h-[10vh] border-b border-gray-200 flex items-center justify-between p-2" >
      <div className="h-full w-full rounded flex gap-5 items-center justify-between px-4 bg-gray-100/80">
        <div className="flex gap-3 items-center justify-center">
          <Avatar className="h-8 w-8 rounded-full overflow-hidden cursor-pointer">
            <AvatarImage src={selectedChatData?.image} alt="profile" className="object-fit h-full w-full" />
            <AvatarFallback className={`uppercase h-full w-full text-xl border-[1px] text-center font-medium 
                      transition-all duration-300 bg-[#06d6a02a] text-[#06d6a0] border-[#06d6a0bb`}>
              {selectedChatData?.username?.split("").shift() || selectedChatData?.email?.split("").shift()}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold">
            {selectedChatData?.name || selectedChatData?.username || selectedChatData?.email}
          </h3>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Dialog open={openUserInfoModal} onOpenChange={setOpenUserInfoModal}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HiOutlineEllipsisVertical size={20} onClick={() => setOpenUserInfoModal(true)}
                    className="text-neutral-600 border-none outline-none transition-all duration-300" />
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-neutral-700 font-medium">Info</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DialogContent className="h-auto w-72 lg:w-96 rounded-sm 
            shadow-lg transition-all hover:shadow-2xl bg-gray-50 p-6 py-8">
              <DialogHeader className="hidden">
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <div className="border border-gray-200 p-8 py-16 rounded flex flex-col bg-white">
                <img src={selectedChatData?.image || defaultImage} alt="Avatar"
                  className="w-28 h-28 lg:w-32 lg:h-32 object-cover rounded-full border 
                hover:border-2 border-gray-300 mx-auto transition-all duration-300" />

                <hr className="mt-4 lg:mt-6" />

                <div className="flex flex-col items-center mt-3 gap-3 justify-center">
                  <h2 className="font-semibold text-gray-900 text-lg lg:text-xl flex gap-2 items-center">
                    {selectedChatData?.name} <span className="hidden lg:block text-lg">({selectedChatData?.username})</span></h2>
                  <h6 className="text-xs text-gray-500">{selectedChatData?._id}</h6>
                  <h3 className="text-sm lg:text-base text-gray-700 ">{selectedChatData?.email}</h3>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HiOutlineXMark size={20} onClick={closeChat}
                  className="text-neutral-600 border-none outline-none transition-all duration-300" />
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-neutral-700 font-medium">Close</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}

export { ChatHeader };