import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { setAuthUser, useSignOut } from "@/lib/auth";
import { useAuthStore } from "@/zustand";
import { useSocket } from "@/lib/context";
import api from "@/lib/api";

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { socket } = useSocket();
  const { handleSignOut } = useSignOut();
  const { userInfo, setUserInfo } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(userInfo?.image);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
  const [openImageDeletionModal, setOpenImageDeletionModal] = useState(false);
  const [imageUpdateFormData, setImageUpdateFormData] = useState<any | null>(
    null
  );

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

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
      };

      fileReader.readAsDataURL(imageFile);

      if (formData) {
        setOpenConfirmationModal(true);
        setImageUpdateFormData(formData);
      }
    }
  };

  const updateProfileImage = async (formData: FormData) => {
    try {
      setIsLoading(true);
      const response = await api.patch(
        "/api/user/update-profile-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setAuthUser(response.data.data);
      setUserInfo(response.data.data);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setImageUpdateFormData(null);
      setOpenConfirmationModal(false);
      setIsLoading(false);
    }
  };

  const handleImageDeleteClick = async () => {
    try {
      setIsLoading(true);
      const response = await api.delete("/api/user/delete-profile-image");
      setAuthUser(response.data.data);
      setUserInfo(response.data.data);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setSelectedImage(userInfo?.image);
      setOpenImageDeletionModal(false);
      setIsLoading(false);
    }
  };

  /**  Hookform Zod Resolver - Change Password */

  const changePasswordSchema = z
    .object({
      old_password: z.string().min(1, { message: "Old password is required!" }),
      new_password: z
        .string()
        .min(8, { message: "New password must be at least 8 characters long!" })
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
          message: "Must have an uppercase, a lowercase letter, and a number!",
        })
        .refine((val) => !/\s/.test(val), {
          message: "Password cannot contain spaces!",
        }),
      confirm_password: z.string().min(8, {
        message: "Confirm password must be at least 8 characters long!",
      }),
    })
    .refine((data) => data.new_password === data.confirm_password, {
      message: "Confirm password is not matching with new password!",
      path: ["confirm_password"],
    });

  const changePasswordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const changePasswordSubmit = async (
    values: z.infer<typeof changePasswordSchema>
  ) => {
    try {
      setIsLoading(true);
      const response = await api.patch("/api/user/change-password", values);
      setAuthUser(response.data.data);
      setUserInfo(response.data.data);
      setOpenPasswordDialog(false);
      changePasswordForm.reset();
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**  Hookform Zod Resolver - Profile Update */

  const genders = ["Male", "Female", "Other"] as const;

  const profileUpdateSchema = z.object({
    name: z
      .string()
      .min(3, { message: "Name must be at least 3 characters long!" })
      .max(30, { message: "Name can be maximum 30 characters long!" }),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters long!" })
      .max(15, { message: "Username can be maximum 15 characters long!" })
      .regex(/^[a-z0-9_-]{3,15}$/, {
        message:
          "Only lowercase letters, numbers, hyphens, and underscores are allowed, with no spaces or special characters at the start/end!",
      }),
    gender: z.enum(genders),
    bio: z.string(),
  });

  const profileUpdateForm = useForm<z.infer<typeof profileUpdateSchema>>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: userInfo?.name || "",
      username: userInfo?.username || "",
      gender: (userInfo?.gender as (typeof genders)[number]) || "Other",
      bio: userInfo?.bio || "",
    },
  });

  const profileUpdateSubmit = async (
    values: z.infer<typeof profileUpdateSchema>
  ) => {
    try {
      setIsLoading(true);
      const response = await api.patch("/api/user/user-profile-setup", values);
      const result = await response.data.data;
      setAuthUser(result);
      setUserInfo(result);
      profileUpdateForm.reset({ ...result });
      toast.success(response.data.message);
      /** Emitting event for update details to active clients of current user */
      socket?.emit("before:profileupdate", { updatedDetails: result });
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    socket?.on("after:profileupdate", ({ updatedDetails }) => {
      setAuthUser(updatedDetails);
      setUserInfo(updatedDetails);
      profileUpdateForm.reset({ ...updatedDetails });
      toast.info("Your details has been updated!");
    });
  }, [socket]);

  const fallbackAvatar =
    userInfo?.name || userInfo?.username || userInfo?.email;

  return (
    <main className="h-screen w-screen grid place-content-center">
      <div className="shadow-2xl dark:shadow-slate-950 rounded-md grid lg:grid-cols-2 transition-transform duration-300 h-max w-[90vw] sm:w-[70vw] md:w-[50vw] lg:w-[70vw] xl:w-[60vw] px-8 sm:px-12 py-16 lg:p-20 lg:gap-16">
        <div className="w-full flex flex-col gap-2 items-center justify-end lg:justify-center">
          <div className="w-full flex flex-col gap-2 items-center justify-center">
            <h2 className="text-3xl font-extrabold xl:text-4xl">
              Welcome User!
            </h2>
            <p className="text-sm sm:text-base text-center text-gray-700 dark:text-gray-300">
              Let's get you set up!
            </p>
          </div>
          <div
            className="hidden size-36 xl:size-40 relative lg:flex items-center justify-center
           rounded-full border-2 border-gray-100 dark:border-gray-700 hover:border-3"
          >
            <ContextMenu>
              <ContextMenuTrigger className="w-full h-full">
                <Avatar className="h-full w-full rounded-full overflow-hidden">
                  <AvatarImage
                    src={selectedImage}
                    alt="profile"
                    className="object-fit size-full"
                  />
                  <AvatarFallback
                    className={`uppercase size-full text-5xl border text-center font-bold transition-all hover:bg-black/90 bg-[#4cc9f02a] text-[#4cc9f0] border-[#4cc9f0bb] dark:bg-transparent`}
                  >
                    {fallbackAvatar?.split("").shift()}
                  </AvatarFallback>
                </Avatar>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-20 flex flex-col gap-2 p-2 transition-all duration-500">
                {userInfo?.image && (
                  <ContextMenuItem
                    className="flex gap-2"
                    onClick={() => setOpenImageDeletionModal(true)}
                  >
                    <HiOutlineTrash size={16} /> Delete
                  </ContextMenuItem>
                )}
                <ContextMenuItem
                  className="flex gap-2"
                  onClick={handleFileInputClick}
                >
                  <HiOutlineCloudArrowUp size={16} /> Upload
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
            <input
              type="file"
              ref={fileInputRef}
              name="profileImage"
              onChange={handleImageSelectClick}
              accept=".png, .jpg, .jpeg, .svg, .webp"
              className="hidden"
            />
          </div>
          <div className="flex flex-col gap-2 w-full mb-3 lg:mb-1">
            <Label htmlFor="profile-email">Email*</Label>
            <Input
              type="email"
              id="profile-email"
              name="email"
              placeholder="Email"
              readOnly
              defaultValue={userInfo?.email || ""}
              autoComplete="off"
            />
          </div>
          <div className="hidden lg:flex gap-6 w-full items-center justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none" asChild>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/chat")}
                    disabled={isLoading || !userInfo?.setup}
                  >
                    <HiOutlineChatBubbleLeftRight size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tooltip-span">Chat Messages</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none" asChild>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setOpenPasswordDialog(true)}
                    disabled={isLoading}
                  >
                    {" "}
                    <HiOutlineKey size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tooltip-span">Change Password</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none" asChild>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleSignOut}
                    disabled={isLoading}
                  >
                    <HiOutlineArrowRightOnRectangle size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tooltip-span">Sign Out</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2 lg:gap-4 items-center justify-start lg:justify-center">
          <Form {...profileUpdateForm}>
            <form
              onSubmit={profileUpdateForm.handleSubmit(profileUpdateSubmit)}
              className="flex flex-col gap-2 xl:gap-3 w-full"
            >
              <FormField
                control={profileUpdateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-2">
                      <FormLabel htmlFor="fullname">Name*</FormLabel>
                      <FormControl>
                        <Input
                          id="fullname"
                          type="text"
                          placeholder="Name"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={profileUpdateForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-2">
                      <FormLabel htmlFor="username">Username*</FormLabel>
                      <FormControl>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Username"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={profileUpdateForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-2">
                      <FormLabel htmlFor="bio">Bio*</FormLabel>
                      <FormControl>
                        <Input
                          id="bio"
                          type="text"
                          placeholder="Bio"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={profileUpdateForm.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-2">
                      <FormLabel htmlFor="gender">Gender*</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full py-5" id="gender">
                            <SelectValue>{field.value || "Gender"}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {genders.map((gender) => (
                              <SelectItem key={gender} value={gender}>
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="lg"
                className="w-full cursor-pointer mt-2 lg:mt-1"
                disabled={isLoading}
              >
                Save Changes
              </Button>
            </form>
          </Form>
          <div className="lg:hidden flex gap-4 md:gap-6 w-full items-center justify-center mt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none" asChild>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/chat")}
                    disabled={isLoading || !userInfo?.setup}
                  >
                    <HiOutlineChatBubbleLeftRight size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tooltip-span">Chat Messages</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none" asChild>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setOpenPasswordDialog(true)}
                    disabled={isLoading}
                  >
                    {" "}
                    <HiOutlineKey size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tooltip-span">Change Password</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none" asChild>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleSignOut}
                    disabled={isLoading}
                  >
                    <HiOutlineArrowRightOnRectangle size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tooltip-span">Sign Out</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Dialog for changing password */}
      <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
        <DialogContent className="h-auto w-80 md:w-96 flex flex-col rounded-md items-start">
          <DialogHeader>
            <DialogTitle className="text-start">
              Change Your Password{" "}
            </DialogTitle>
            <DialogDescription className="text-start dark:text-gray-300">
              Update your password to improve account security and protect your
              information.
            </DialogDescription>
          </DialogHeader>
          <Form {...changePasswordForm}>
            <form
              className="flex flex-col gap-4 w-full"
              onSubmit={changePasswordForm.handleSubmit(changePasswordSubmit)}
            >
              <FormField
                control={changePasswordForm.control}
                name="old_password"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-2">
                      <FormLabel htmlFor="old_password">Old Password</FormLabel>
                      <FormControl>
                        <Input
                          id="old_password"
                          type="password"
                          autoComplete="off"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={changePasswordForm.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-2">
                      <FormLabel htmlFor="new_password">New Password</FormLabel>
                      <FormControl>
                        <Input
                          id="new_password"
                          type="password"
                          autoComplete="off"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={changePasswordForm.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-2">
                      <FormLabel htmlFor="confirm_password">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="confirm_password"
                          type="password"
                          autoComplete="off"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-4 sm:gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => {
                    changePasswordForm.reset();
                    setOpenPasswordDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  Confirm
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog for image update confirmation */}
      <AlertDialog
        open={openConfirmationModal}
        onOpenChange={setOpenConfirmationModal}
      >
        <AlertDialogTrigger className="hidden"></AlertDialogTrigger>
        <AlertDialogContent className="w-80 md:w-96 rounded-md shadow-lg transition-all hover:shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-start">
              Update profile image?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-start dark:text-gray-300">
              Update your profile image for better user interactions!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isLoading}
              onClick={() => {
                setImageUpdateFormData(null);
                setOpenConfirmationModal(false);
                setSelectedImage(userInfo?.image);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={() => updateProfileImage(imageUpdateFormData)}
            >
              Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for image delete confirmation */}
      <AlertDialog
        open={openImageDeletionModal}
        onOpenChange={setOpenImageDeletionModal}
      >
        <AlertDialogTrigger className="hidden"></AlertDialogTrigger>
        <AlertDialogContent className="w-80 md:w-96 rounded-md shadow-lg transition-all hover:shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-start">
              Delete profile image?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-start dark:text-gray-300">
              Are you sure to delete profile image?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isLoading}
              onClick={() => setOpenImageDeletionModal(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={handleImageDeleteClick}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default Profile;
