import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/zustand";
import { useSignOutUser } from "@/hooks";
import { HiOutlineArrowRightOnRectangle } from "react-icons/hi2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip";

const ProfileInfo = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuthStore();
  const { handleSignOut } = useSignOutUser();

  return (
    <div className="absolute bottom-0 w-full h-[10vh] border border-gray-200 p-2 lg:px-3">
      <div className="bg-gray-100/80 rounded h-full w-full flex items-center justify-between px-4">

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex gap-4 items-center" onClick={() => navigate("/profile")}>
                <Avatar className="h-8 w-8 rounded-full overflow-hidden cursor-pointer">
                  <AvatarImage src={userInfo?.image} alt="profile" className="object-fit h-full w-full" />
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
  )
}

export { ProfileInfo };