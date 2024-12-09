import { toast } from "sonner";
import { useState, useRef, useEffect, FormEvent } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HiOutlineCloudArrowUp,
  HiOutlineTrash,
  HiOutlineKey,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { changePasswordSchema, validateUsername } from "@/utils";
import { useHandleForm, useSignOutUser } from "@/hooks";
import { useAuthStore } from "@/zustand";
import { useSocket } from "@/context/socket-context";
import api from "@/lib/api";

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { socket } = useSocket();
  const { handleSignOut } = useSignOutUser();
  const { userInfo, setUserInfo } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(userInfo?.image);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
  const [openImageDeletionModal, setOpenImageDeletionModal] = useState(false);
  const [imageUpdateFormData, setImageUpdateFormData] = useState<any | null>(null);

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  }

  const handleImageSelectClick = async (e: any) => {
    e.preventDefault();

    const maxSizeAllow = 5; // Size in MB
    const maxBytesAllow = maxSizeAllow * 1024 * 1024;
    const imageFile = e.target.files[0];

    if (imageFile) {
      if (imageFile.size > maxBytesAllow) {
        setSelectedImage("");
        toast.info("File size exceeds the max limit!");
        return;
      }

      const formData = new FormData();
      formData.append("profile-image", imageFile);

      const fileReader = new FileReader();

      fileReader.onload = () => {
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
      const response = await api.delete("/api/user/delete-profile-image");
      setUserInfo(response.data.data);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setSelectedImage(userInfo?.image);
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
        const response = await api.patch("/api/user/change-password", validatedField.data);
        setUserInfo(response.data.data);
        setOpenPasswordDialog(false);
        setPasswordValue(initialFieldsValue);
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

  /** States and handler function for change user details */
  const [userName, setUserName] = useState(userInfo?.name);
  const [userUsername, setUserUsername] = useState(userInfo?.username);
  const [userBio, setUserBio] = useState(userInfo?.bio);
  const [userGender, setUserGender] = useState(userInfo?.gender);

  const handleGenderChange = (value: string) => {
    setUserGender(value);
  };

  const saveDetailsChanges = async (e: any) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const isValid = validateUsername(userUsername!);

      if (isValid) {
        const profileDetails = {
          name: userName,
          username: userUsername,
          bio: userBio,
          gender: userGender,
        };
        const response = await api.patch("/api/user/user-profile-setup", profileDetails);
        setUserInfo(response.data.data);
        toast.success(response.data.message);

        /** Emitting event for update details to active clients of current user */
        socket?.emit("before:profile-update", { updatedDetails: response.data.data });
      } else {
        toast.info("Invalid username!");
      }
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    socket?.on("after:profile-update", ({ updatedDetails }) => {
      setUserInfo({ ...updatedDetails });
      toast.info("Your details has been updated!");
    });
  }, [socket]);

  return (
    <main className="h-[100vh] w-[100vw] flex flex-col items-center justify-center">
      <div className="bg-white border-2 border-white text-opacity-90 shadow-2xl rounded-md grid lg:grid-cols-2 
      h-[95vh] w-[90vw] sm:w-[70vw] md:w-[60vw] lg:h-[80vh] lg:w-[80vw] xl:w-[60vw] lg:px-8 xl:py-8">

        <div className="flex flex-col gap-3 items-center justify-end lg:justify-center lg:px-1">
          <div className="flex flex-col gap-1 items-center justify-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Welcome User!</h2>
            <p className="text-sm lg:text-base font-normal text-center text-gray-500">
              Let's get you set up!</p>
          </div>
          <div className="hidden h-32 w-32 md:h-36 md:w-36 lg:h-40 lg:w-40 relative lg:flex items-center justify-center
           rounded-full border-2 border-gray-100 hover:border-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="w-full h-full">
                  <Avatar className="h-full w-full rounded-full overflow-hidden">
                    <AvatarImage src={selectedImage} alt="profile" className="object-fit h-full w-full" />
                    <AvatarFallback className={`uppercase h-full w-full text-5xl border-[1px] text-center font-medium 
                      transition-all duration-300 hover:bg-black/90 "bg-[#4cc9f02a] text-[#4cc9f0] border-[#4cc9f0bb]"`}>
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
          <div className="flex flex-col gap-3 w-4/5 mb-3 lg:mb-1">
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
          </div>
          <div className="hidden mt-1 lg:flex gap-4 w-4/5 items-center justify-center">
            <Button size="sm" className="w-full" onClick={() => navigate("/chat")}
              disabled={isLoading || !userInfo?.setup}>
              <HiOutlineChatBubbleLeftRight size={20} /></Button>
            <Button size="sm" className="w-full" onClick={() => setOpenPasswordDialog(true)}
              disabled={isLoading}> <HiOutlineKey size={20} /></Button>
            <Button size="sm" className="w-full" onClick={handleSignOut} disabled={isLoading}>
              <HiOutlineArrowRightOnRectangle size={20} /></Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3 lg:gap-4 items-center justify-start lg:justify-center">
          <div className="flex flex-col gap-3 w-4/5">
            <Label htmlFor="fullName">Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              placeholder="Name"
              autoComplete="off"
              className="rounded px-3 py-5"
              value={userName || ""}
              onChange={(e: any) => setUserName(e.target.value)}
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
            <Label htmlFor="bio">Bio</Label>
            <Input
              type="text"
              id="bio"
              name="bio"
              placeholder="Bio"
              autoComplete="off"
              className="rounded px-3 py-5"
              value={userBio || ""}
              onChange={(e: any) => setUserBio(e.target.value)}
            />
            <Label htmlFor="gender">Gender</Label>
            <Select onValueChange={handleGenderChange} defaultValue={userGender}>
              <SelectTrigger className="w-full" id="gender">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="lg" className="w-full cursor-pointer transition-all duration-300 mt-1"
              onClick={saveDetailsChanges} disabled={isLoading}>Save Changes</Button>
          </div>
          <div className="lg:hidden flex gap-4 w-4/5 items-center justify-center">
            <Button size="sm" className="w-full" onClick={() => navigate("/chat")}
              disabled={isLoading || !userInfo?.setup}>
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
              setSelectedImage(userInfo?.image);
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