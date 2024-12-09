import { toast } from "sonner";
import { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { isMobile, isTablet, isDesktop, browserName, osName, osVersion } from "react-device-detect";
import { signUpSchema, signInSchema, validateEmail, removeSpaces, validateDummyEmail } from "@/utils";
import { InitialValuesProps, useHandleForm } from "@/hooks";
import { useAuthStore } from "@/zustand";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "@/redux/reducer/auth";
import api from "@/lib/api";

const Auth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { setIsAuthenticated } = useAuthStore();

  /** Handlers for sign-in */

  const initialSignInValues = { credentials: "", password: "" };
  const [signInValue, setSignInValue, signInHandleChange] = useHandleForm(initialSignInValues);

  const handleSignInSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const getDeviceInfo = () => {
      const deviceInfo = {
        isMobile,
        isTablet,
        isDesktop,
        browserName,
        osName,
        osVersion,
      };
      return JSON.stringify(deviceInfo);
    };

    const signInData: InitialValuesProps = {
      password: signInValue.password,
      device_information: getDeviceInfo(),
    }

    const isEmail = validateEmail(removeSpaces(signInValue.credentials!));

    if (isEmail) {
      signInData.email = removeSpaces(signInValue.credentials!);
    } else {
      signInData.username = removeSpaces(signInValue.credentials!);
    }

    const validatedField = signInSchema.safeParse(signInData);

    if (validatedField.success) {
      try {
        const response = await api.post("/api/auth/sign-in", validatedField.data);
        const result = await response.data.data;

        setIsAuthenticated(true);
        setSignInValue(initialSignInValues);

        dispatch(login(result));

        if (result.setup) {
          await api.delete("/api/message/delete");
          toast.success(response.data.message);
          navigate("/chat");
        } else {
          toast.info(response.data.message);
          navigate("/profile");
        }
      } catch (error: any) {
        toast.error(error.response.data.message);
      }
    } else {
      toast.error(validatedField.error?.issues[0].message);
    }
  }

  /** Handlers for sign-up */

  const initialSignUpValue = { email: "", password: "", confirm: "" };
  const [signUpValue, setSignUpValue, signUpHandleChange] = useHandleForm(initialSignUpValue);

  const handleSignUpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validatedField = signUpSchema.safeParse(signUpValue);

    if (validatedField.error) {
      toast.error(validatedField.error?.issues[0].message);
      return;
    }

    const isDummy = validateDummyEmail(validatedField.data.email);

    if (isDummy) {
      toast.info("Email not allowed choose a different one!");
      return;
    }

    try {
      const response = await api.post("/api/auth/sign-up", validatedField.data);
      setSignUpValue(initialSignUpValue);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  }

  return (
    <main className="h-[100vh] w-[100vw] flex items-center justify-center">
      <div className="bg-white border-2 border-white text-opacity-90 shadow-2xl rounded-md grid lg:grid-cols-2
      h-[70vh] w-[90vw] sm:w-[70vw] md:w-[60vw] lg:h-[80vh] lg:w-[80vw] xl:w-[60vw] lg:px-8 xl:py-8">
        <div className="flex flex-col gap-4 items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold">Welcome User!</h1>
            <p className="text-sm lg:text-base font-normal text-center text-gray-700">
              Enter the details to get started!</p>
          </div>
          <div className="w-full flex items-center justify-center">
            <Tabs defaultValue="sign-in" className="w-4/5">
              <TabsList className="bg-transparent rounded-none w-full">
                <TabsTrigger value="sign-in" className="data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-gray-700 p-3 transition-all duration-300">Sign In</TabsTrigger>
                <TabsTrigger value="sign-up" className="data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-gray-700 p-3 transition-all duration-300">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="sign-in">
                <form onSubmit={handleSignInSubmit} className="flex flex-col gap-3 mt-6">
                  <Label htmlFor="credentials">Email or Username</Label>
                  <Input
                    id="credentials"
                    name="credentials"
                    type="text"
                    placeholder="Email or Username"
                    autoComplete="off"
                    onChange={signInHandleChange}
                    value={signInValue.credentials || ""}
                  />
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    autoComplete="off"
                    onChange={signInHandleChange}
                    value={signInValue.password || ""}
                  />
                  <Button size="lg" type="submit" className="w-full cursor-pointer 
                  transition-all duration-300 font-semibold mt-1">
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="sign-up">
                <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3 mt-6">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@mail.ai"
                    autoComplete="off"
                    onChange={signUpHandleChange}
                    value={signUpValue.email || ""}
                  />
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="********"
                    autoComplete="off"
                    onChange={signUpHandleChange}
                    value={signUpValue.password || ""}
                  />
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input
                    id="confirm"
                    name="confirm"
                    type="password"
                    placeholder="********"
                    autoComplete="off"
                    onChange={signUpHandleChange}
                    value={signUpValue.confirm || ""}
                  />
                  <Button size="lg" type="submit" className="w-full cursor-pointer 
                  transition-all duration-300 font-semibold mt-1">
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="hidden lg:grid place-items-center">
          <div className="flex flex-col gap-2 items-center justify-center">
            <HiOutlineChatBubbleLeftRight size={100} />
            <h1 className="text-4xl font-bold text-gray-900">Synchronous Chat!</h1>
            <p className="text-sm font-normal text-gray-500">
              A realtime fast and secure with best user experience!</p>
            <h3 className="w-64 text-base text-center text-gray-700">
              Share you smile with this world find friends & enjoy!</h3>
            <h6 className="text-xs font-medium text-gray-500">
              Created using MERN Stack by Shekhar Sharma!
            </h6>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Auth;