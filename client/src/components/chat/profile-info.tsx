import { useNavigate } from "react-router-dom";
import { useAuthStore, useChatStore } from "@/zustand";
import { useSignOutUser, useAvatar } from "@/hooks";
import { HiOutlineArrowRightOnRectangle, HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from "react-icons/hi2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

const ProfileInfo = () => {
  /** This state have authenticated and userData */
  const { } = useSelector((state: any) => state.auth);

  const navigate = useNavigate();
  const { userInfo } = useAuthStore();
  const { handleSignOut } = useSignOutUser();
  const { isSoundAllow, setIsSoundAllow } = useChatStore();
  const [avatar, setAvatar] = useState<any>(null);

  useEffect(() => {
    if (userInfo) {
      const userAvatar = useAvatar(userInfo);
      setAvatar(userAvatar);
    }
  }, [userInfo]);

  return (
    <div className="absolute bottom-0 w-full h-20 border-t p-2">
      <div className="bg-gray-100/80 rounded h-full w-full flex items-center justify-between px-4">

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex gap-4 items-center" onClick={() => navigate("/profile")}>
                <Avatar className="h-8 w-8 rounded-full overflow-hidden cursor-pointer">
                  <AvatarImage src={avatar} alt="profile" className="object-fit h-full w-full" />
                  <AvatarFallback className={`uppercase h-full w-full text-xl border-[1px] text-center font-medium 
                      transition-all duration-300 bg-[#4cc9f02a] text-[#4cc9f0] border-[#4cc9f0bb]`}>
                    {userInfo?.username?.split("").shift() || userInfo?.email?.split("").shift()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-neutral-700">{userInfo?.name}</span>
                  <span className="text-xs font-semibold text-neutral-700">{userInfo?.username}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span className="text-neutral-700 font-medium">Profile</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex gap-3 md:gap-5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {isSoundAllow ? (
                  <HiOutlineSpeakerWave size={20} onClick={() => setIsSoundAllow(false)}
                    className="text-neutral-600 border-none outline-none transition-all duration-300" />
                ) : (
                  <HiOutlineSpeakerXMark size={20} onClick={() => setIsSoundAllow(true)}
                    className="text-neutral-600 border-none outline-none transition-all duration-300" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-neutral-700 font-medium">Sound</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HiOutlineArrowRightOnRectangle size={20} onClick={handleSignOut}
                  className="text-neutral-600 border-none outline-none transition-all duration-300" />
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-neutral-700 font-medium">Sign Out</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}

export { ProfileInfo };