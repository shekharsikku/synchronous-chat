import { toast } from "sonner";
import { useState, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  HiOutlineCloudArrowUp,
  HiOutlineTrash,
  HiOutlineKey,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { colors, getColor, changePasswordSchema } from "@/utils";
import { useHandleForm, useSignOutUser } from "@/hooks";
import { useAuthStore } from "@/zustand";
import api from "@/lib/api";

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { handleSignOut } = useSignOutUser();
  const { userInfo, setUserInfo } = useAuthStore();

  const [userFullName, setUserFullName] = useState(userInfo?.fullName);
  const [userUsername, setUserUsername] = useState(userInfo?.username);
  const [selectedColor, setSelectedColor] = useState(userInfo?.profileColor);
  const [selectedImage, setSelectedImage] = useState(userInfo?.imageUrl);

  const [isLoading, setIsLoading] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
  const [openImageDeletionModal, setOpenImageDeletionModal] = useState(false);
  const [imageUpdateFormData, setImageUpdateFormData] = useState<any | null>(null);

  const saveDetailsChanges = async (e: any) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const profileDetails = {
        fullName: userFullName,
        username: userUsername,
        profileColor: selectedColor
      };
      const response = await api.patch("/api/user/user-profile-setup", profileDetails, { withCredentials: true });
      setUserInfo(response.data.data);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  }

  const handleImageSelectClick = async (e: any) => {
    e.preventDefault();

    const imageFile = e.target.files[0];
    // console.log(imageFile);

    if (imageFile) {
      const formData = new FormData();
      formData.append("profile-image", imageFile);

      const fileReader = new FileReader();
      fileReader.onload = () => {
        // console.log(fileReader.result);

        const file = fileReader.result as string;
        setSelectedImage(file);
      }

      fileReader.readAsDataURL(imageFile);

      if (formData) {
        setOpenConfirmationModal(true);
        setImageUpdateFormData(formData);
      }
    }
  }

  const updateProfileImage = async (formData: FormData) => {
    try {
      setIsLoading(true);
      const response = await api.patch("/api/user/update-profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        withCredentials: true
      });
      setUserInfo(response.data.data);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setImageUpdateFormData(null);
      setOpenConfirmationModal(false);
      setIsLoading(false);
    }
  }

  const handleImageDeleteClick = async () => {
    try {
      setIsLoading(true);
      const response = await api.delete("/api/user/delete-profile-image", { withCredentials: true });
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setSelectedImage("");
      userInfo ? userInfo.imageUrl = "" : null;
      setOpenImageDeletionModal(false);
      setIsLoading(false);
    }
  }

  /** Handlers for password change */

  const initialFieldsValue = { old_password: "", new_password: "", confirm_password: "" };
  const [passwordValue, setPasswordValue, passwordHandleChange] = useHandleForm(initialFieldsValue);

  const handlePasswordChangeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validatedField = changePasswordSchema.safeParse(passwordValue);

    if (validatedField.success) {
      try {
        setIsLoading(true);
        const response = await api.patch("/api/user/change-password", validatedField.data, {
          withCredentials: true
        });
        setPasswordValue(initialFieldsValue);
        setOpenPasswordDialog(false);
        toast.success(response.data.message);
      } catch (error: any) {
        toast.error(error.response.data.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      openPasswordDialog && toast.error(validatedField.error?.issues[0].message);
    }
  }

  return (
    <main className="h-[100vh] w-[100vw] flex flex-col items-center justify-center">
      <div className="bg-white border-2 border-white text-opacity-90 shadow-2xl rounded-md grid lg:grid-cols-2 
      h-[95vh] w-[90vw] sm:w-[70vw] md:w-[60vw] lg:h-[80vh] lg:w-[80vw] xl:w-[60vw] lg:px-8 xl:py-8">
        <div className="flex flex-col gap-3 lg:gap-4 items-center justify-end lg:justify-center">
          <div className="lg:hidden flex flex-col gap-2 items-center justify-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Welcome User!</h2>
            <p className="text-sm lg:text-base font-normal text-center text-gray-500">
              Complete your profile to continue!</p>
          </div>
          <div className="h-32 w-32 md:h-36 md:w-36 lg:h-40 lg:w-40 relative flex items-center justify-center
           rounded-full border-2 border-gray-100 hover:border-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="w-full h-full">
                  <Avatar className="h-full w-full rounded-full overflow-hidden">
                    <AvatarImage src={selectedImage} alt="profile" className="object-fit h-full w-full" />
                    <AvatarFallback className={`uppercase h-full w-full text-5xl border text-center font-medium 
                      transition-all duration-300 hover:bg-black/90 ${getColor(parseInt(selectedColor!))}`}>
                      {userUsername?.split("").shift() || userInfo?.email?.split("").shift()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent className="flex gap-3 py-3">
                  <Button variant="outline" size="icon" onClick={() => setOpenImageDeletionModal(true)}>
                    <HiOutlineTrash size={20} /></Button>
                  <Button variant="outline" size="icon" onClick={handleFileInputClick}>
                    <HiOutlineCloudArrowUp size={20} /></Button>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <input
              type="file"
              ref={fileInputRef}
              name="profileImage"
              onChange={handleImageSelectClick}
              accept=".png, .jpg, .jpeg, .svg, .webp"
              className="hidden"
            />
          </div>
          <div className="w-full flex flex-col gap-2 justify-center items-center">
            <p className="text-xs lg:text-sm font-normal text-center text-gray-500 my-1 lg:my-2">
              Choose your profile image & color?</p>
            <div className="flex gap-4 justify-center">
              {colors.map((color, index) => (
                <div key={index} className={`${color} h-10 w-10 sm:h-12 sm:w-12 rounded-full 
                cursor-pointer transition-all duration-300 
              ${parseInt(selectedColor!) === index ? "outline outline-white/90 outline-1" : ""}`}
                  onClick={() => setSelectedColor(String(index))}></div>
              ))}
            </div>
          </div>
          <div className="hidden mt-1 lg:flex gap-4 w-4/6 items-center justify-center">
            <Button size="sm" className="w-full" onClick={() => navigate("/chat")}
              disabled={isLoading || userInfo?.profileSetup}>
              <HiOutlineChatBubbleLeftRight size={20} /></Button>
            <Button size="sm" className="w-full" onClick={() => setOpenPasswordDialog(true)}
              disabled={isLoading}> <HiOutlineKey size={20} /></Button>
            <Button size="sm" className="w-full" onClick={handleSignOut} disabled={isLoading}>
              <HiOutlineArrowRightOnRectangle size={20} /></Button>
          </div>
        </div>

        <h3 className="lg:hidden text-center text-2xl font-semibold my-auto">Your Details!</h3>

        <div className="flex-1 flex flex-col gap-3 lg:gap-4 items-center justify-start lg:justify-center">
          <div className="hidden lg:flex flex-col gap-2 items-center justify-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Welcome User!</h2>
            <p className="text-xs lg:text-sm font-normal text-center text-gray-500">
              Complete your profile to continue!</p>
          </div>
          <div className="flex flex-col gap-3 w-4/5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Full Name"
              autoComplete="off"
              className="rounded px-3 py-5"
              value={userFullName || ""}
              onChange={(e: any) => setUserFullName(e.target.value)}
            />
            <Label htmlFor="username">Username</Label>
            <Input
              type="text"
              id="username"
              name="username"
              placeholder="Username"
              autoComplete="off"
              className="rounded px-3 py-5"
              value={userUsername || ""}
              onChange={(e: any) => setUserUsername(e.target.value)}
            />
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              readOnly
              defaultValue={userInfo?.email || ""}
              className="rounded px-3 py-5"
              autoComplete="off"
            />
            <Button type="submit" size="lg" className="w-full cursor-pointer transition-all duration-300 mt-1"
              onClick={saveDetailsChanges} disabled={isLoading}>Save Changes</Button>
            <p className="hidden lg:block text-xs lg:text-sm text-center">
              If your profile completed then continue?</p>
          </div>
          <div className="lg:hidden flex gap-4 w-4/5 items-center justify-center">
            <Button size="sm" className="w-full" onClick={() => navigate("/chat")}
              disabled={isLoading || userInfo?.profileSetup}>
              <HiOutlineChatBubbleLeftRight size={20} /></Button>
            <Button size="sm" className="w-full" onClick={() => setOpenPasswordDialog(true)} disabled={isLoading}>
              <HiOutlineKey size={20} /></Button>
            <Button size="sm" className="w-full" onClick={handleSignOut} disabled={isLoading}>
              <HiOutlineArrowRightOnRectangle size={20} /></Button>
          </div>
        </div>
      </div>

      {/* Dialog for changing password */}
      <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
        <DialogContent className="h-auto w-80 md:w-96 flex flex-col rounded-sm items-start">
          <DialogHeader>
            <DialogTitle className="text-start">Change Your Password </DialogTitle>
            <DialogDescription className="text-start">
              Update your password to improve account security and protect your information.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4 w-full" onSubmit={handlePasswordChangeSubmit}>
            <Label htmlFor="old_password">Old Password</Label>
            <Input
              id="old_password"
              name="old_password"
              type="password"
              placeholder="********"
              autoComplete="off"
              className="rounded px-3 py-5"
              onChange={passwordHandleChange}
              value={passwordValue.old_password || ""}
              required
            />
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              placeholder="********"
              autoComplete="off"
              className="rounded px-3 py-5"
              onChange={passwordHandleChange}
              value={passwordValue.new_password || ""}
              required
            />
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="********"
              autoComplete="off"
              className="rounded px-3 py-5"
              onChange={passwordHandleChange}
              value={passwordValue.confirm_password || ""}
              required
            />
            <DialogFooter className="gap-4 sm:gap-2">
              <Button variant="outline" className="w-full" disabled={isLoading}
                onClick={() => {
                  setPasswordValue(initialFieldsValue);
                  setOpenPasswordDialog(false);
                }}>Cancel</Button>
              <Button type="submit" className="w-full" disabled={isLoading}>Confirm</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for image update confirmation */}
      <Dialog open={openConfirmationModal} onOpenChange={setOpenConfirmationModal}>
        <DialogContent className="h-auto w-80 md:w-96 flex flex-col rounded-sm items-start">
          <DialogHeader>
            <DialogTitle className="text-start">Update profile image?</DialogTitle>
            <DialogDescription className="text-start">
              Update your profile image for better user interactions!
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Button size="lg" variant="outline" className="p-2 px-5" onClick={() => {
              setImageUpdateFormData(null);
              setOpenConfirmationModal(false);
              setSelectedImage(userInfo?.imageUrl);
            }} disabled={isLoading}>Cancel</Button>
            <Button size="lg" variant="default" className="p-2 px-5"
              onClick={() => updateProfileImage(imageUpdateFormData)} disabled={isLoading}>
              Update</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog for image delete confirmation */}
      <Dialog open={openImageDeletionModal} onOpenChange={setOpenImageDeletionModal}>
        <DialogContent className="h-auto w-80 md:w-96 flex flex-col rounded-sm items-start">
          <DialogHeader>
            <DialogTitle className="text-start">Delete profile image?</DialogTitle>
            <DialogDescription className="text-start">
              Are you sure to delete profile image?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Button size="lg" variant="outline" className="p-2 px-5" onClick={() => {
              setOpenImageDeletionModal(false);
            }} disabled={isLoading}>Cancel</Button>
            <Button size="lg" className="p-2 px-5"
              onClick={() => handleImageDeleteClick()} disabled={isLoading}>
              Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default Profile;