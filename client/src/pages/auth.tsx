import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { validateEmail, validateDummyEmail } from "@/lib/utils";
import { useAuthStore } from "@/zustand";
import { setAuthUser } from "@/lib/auth";
import api from "@/lib/api";

interface SignInInterface {
  email?: string;
  username?: string;
  password: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated, setUserInfo } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  /** Hookform Zod Resolver - SignUp */

  const signUpSchema = z
    .object({
      email: z.string().email({ message: "Invalid email address!" }),
      password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long!" })
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
          message:
            "Password ust have an uppercase, a lowercase letter, and a number!",
        })
        .refine((val) => !/\s/.test(val), {
          message: "Password cannot contain spaces!",
        }),
      confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
      message: "Confirm password not matching!",
      path: ["confirm"],
    });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm: "",
    },
  });

  const signUpSubmit = async (values: z.infer<typeof signUpSchema>) => {
    const isDummy = validateDummyEmail(values.email);

    if (isDummy) {
      toast.info("Email not allowed choose a different one!");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/api/auth/sign-up", values);
      toast.success(response.data.message);
      signUpForm.reset();
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  /** Hookform Zod Resolver - SignIn */

  const signInSchema = z.object({
    credential: z
      .string()
      .min(1, { message: "Email or Username is required!" })
      .transform((val) => val.replace(/\s+/g, "")),
    password: z.string().min(1, { message: "Password is required!" }),
  });

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      credential: "",
      password: "",
    },
  });

  const signInSubmit = async (values: z.infer<typeof signInSchema>) => {
    try {
      setIsLoading(true);

      const details: SignInInterface = {
        password: values.password,
      };

      const isEmail = validateEmail(values.credential);

      if (isEmail) {
        details.email = values.credential;
      } else {
        details.username = values.credential;
      }

      const response = await api.post("/api/auth/sign-in", details);
      const result = await response.data;

      if (result.success) {
        setAuthUser(result.data);
        setUserInfo(result.data);
        setIsAuthenticated(true);

        if (result.data.setup && import.meta.env.DEV) {
          const deleted = await api.delete("/api/message/delete");
          console.log({ result: deleted.data });
        }
      }

      if (result.data.setup) {
        toast.success(result.message);
        navigate("/chat", { replace: true });
      } else {
        toast.info(result.message);
        navigate("/profile", { replace: true });
      }

      signInForm.reset();
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen grid place-content-center">
      <div
        className="shadow-2xl dark:shadow-black/80 rounded-md grid lg:grid-cols-2 transition-transform duration-300
      h-max w-[90vw] sm:w-[70vw] md:w-[50vw] lg:w-max px-8 sm:px-12 py-16 lg:p-20 lg:gap-16"
      >
        <div className="flex flex-col gap-2 items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold">
              Welcome User!
            </h1>
            <p className="text-sm sm:text-base text-center text-gray-700 dark:text-gray-300">
              Enter your details to get started!
            </p>
          </div>
          <div className="w-full flex items-center justify-center">
            <Tabs defaultValue="sign-in" className="w-full">
              <TabsList className="bg-transparent rounded-none w-full">
                <TabsTrigger
                  value="sign-in"
                  className="data-[state=active]:bg-transparent text-black dark:text-gray-200 text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-gray-700 p-3 transition-all duration-300"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="sign-up"
                  className="data-[state=active]:bg-transparent text-black dark:text-gray-200 text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-gray-700 p-3 transition-all duration-300"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <TabsContent value="sign-in">
                <Form {...signInForm}>
                  <form
                    onSubmit={signInForm.handleSubmit(signInSubmit)}
                    className="flex flex-col gap-3 mt-6"
                  >
                    <FormField
                      control={signInForm.control}
                      name="credential"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid gap-2">
                            <FormLabel htmlFor="credential">
                              Email or Username
                            </FormLabel>
                            <FormControl>
                              <Input
                                id="credential"
                                type="text"
                                placeholder="Email or Username"
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
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid gap-2">
                            <FormLabel htmlFor="password">Password</FormLabel>
                            <FormControl>
                              <Input
                                id="password"
                                type="password"
                                autoComplete="off"
                                placeholder="Password"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button
                      className="w-full cursor-pointer transition-all duration-300 font-semibold mt-1"
                      size="lg"
                      type="submit"
                      disabled={isLoading}
                    >
                      Sign In
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="sign-up">
                <Form {...signUpForm}>
                  <form
                    onSubmit={signUpForm.handleSubmit(signUpSubmit)}
                    className="flex flex-col gap-3 mt-6"
                  >
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid gap-2">
                            <FormLabel htmlFor="email">Email</FormLabel>
                            <FormControl>
                              <Input
                                id="email"
                                type="email"
                                placeholder="example@mail.ai"
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
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid gap-2">
                            <FormLabel htmlFor="password">Password</FormLabel>
                            <FormControl>
                              <Input
                                id="password"
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
                      control={signUpForm.control}
                      name="confirm"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid gap-2">
                            <FormLabel htmlFor="confirm">
                              Confirm Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                id="confirm"
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
                    <Button
                      className="w-full cursor-pointer transition-all duration-300 font-semibold mt-1"
                      size="lg"
                      type="submit"
                      disabled={isLoading}
                    >
                      Sign Up
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="hidden lg:grid place-items-center">
          <div className="flex flex-col gap-2 items-center justify-center">
            <HiOutlineChatBubbleLeftRight size={100} />
            <h1 className="text-4xl font-extrabold">Synchronous Chat!</h1>
            <p className="text-sm font-normal text-gray-700 dark:text-gray-300">
              A realtime fast and secure with best user experience!
            </p>
            <h3 className="w-64 text-base text-center text-gray-700 dark:text-gray-300">
              Share you smile with this world find friends & enjoy!
            </h3>
            <h6 className="text-sm font-semibold text-gray-900 dark:text-gray-200">
              Created with ❤︎ by{" "}
              <Link
                to="https://github.com/shekharsikku"
                target="_blank"
                className="hover:underline"
              >
                Shekhar Sharma{" "}
              </Link>
            </h6>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
