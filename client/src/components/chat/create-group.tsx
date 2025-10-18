import * as z from "zod";
import { toast } from "sonner";
import { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { HiOutlineUsers } from "react-icons/hi2";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore, GroupInfo } from "@/lib/zustand";
import { useContacts } from "@/hooks/use-contacts";
import { createGroupSchema } from "@/lib/schema";
import { useAvatar } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface ContactItemProps {
  id: string;
  name: string;
  avatar?: string;
  selected: boolean;
  onToggle: (id: string) => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ id, name, avatar, selected, onToggle }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all hover:bg-accent",
        selected ? "bg-accent/50" : "bg-background"
      )}
      onClick={() => onToggle(id)}
      role="button"
    >
      <div className="flex items-center gap-3">
        <img src={avatar} alt={name} className="size-8 rounded-full object-cover border border-border" />
        <span className="font-medium text-foreground">{name}</span>
      </div>

      <Checkbox
        checked={selected}
        onChange={() => onToggle(id)}
        className="size-4 accent-primary cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

const CreateGroup = () => {
  const queryClient = useQueryClient();
  const { userInfo } = useAuthStore();
  const { contacts } = useContacts();
  const [isPending, setIsPending] = useState(false);
  const [openNewGroupModal, setOpenNewGroupModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const createGroupForm = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      admin: userInfo?._id,
      members: [],
    },
  });

  const createGroupSubmit = async (values: z.infer<typeof createGroupSchema>) => {
    try {
      setIsPending(true);
      const response = await api.post("api/group/create", values);

      if (response.data.success) {
        const current = { ...response.data.data, interaction: new Date().toISOString() };

        const cleaned = Object.fromEntries(
          Object.entries(current).filter(([key]) => !["createdAt", "updatedAt", "__v"].includes(key))
        );

        queryClient.setQueryData(["groups", userInfo?._id], (older: GroupInfo[] | undefined) => [
          ...(older || []),
          { ...cleaned },
        ]);

        setTimeout(() => {
          createGroupForm.reset();
          setSelectedContacts([]);
          setOpenNewGroupModal(false);
        }, 2000);

        toast.success(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleSelectToggle = (id: string) => {
    setSelectedContacts((prev) => (prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]));
  };

  useEffect(() => {
    createGroupForm.setValue("members", selectedContacts);
  }, [selectedContacts.length]);

  return (
    <Dialog open={openNewGroupModal} onOpenChange={setOpenNewGroupModal}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="focus:outline-none">
            <HiOutlineUsers onClick={() => setOpenNewGroupModal(true)} size={18} className="tooltip-icon" />
          </TooltipTrigger>
          <TooltipContent>
            <span className="tooltip-span">New Group</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="flex flex-col rounded-md select-none">
        <DialogHeader>
          <DialogTitle className="text-start">New Group</DialogTitle>
          <DialogDescription className="text-start">
            Create a new group to chat with multiple people. Add a name, short description, and choose members to start.
          </DialogDescription>
        </DialogHeader>
        <div className="w-full flex gap-6 p-1">
          <Form {...createGroupForm}>
            <form className="flex flex-col gap-4 w-2/3" onSubmit={createGroupForm.handleSubmit(createGroupSubmit)}>
              <FormField
                control={createGroupForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-2">
                      <FormLabel htmlFor="group-name">Name</FormLabel>
                      <FormControl>
                        <Input id="group-name" type="text" autoComplete="off" placeholder="Name" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={createGroupForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-2">
                      <FormLabel htmlFor="group-desc">Description</FormLabel>
                      <FormControl>
                        <Input id="group-desc" type="text" autoComplete="off" placeholder="Description" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="flex gap-4 mt-1">
                <Button
                  variant="outline"
                  className="w-full focus:outline-none"
                  disabled={isPending}
                  onClick={() => {
                    createGroupForm.reset();
                    setSelectedContacts([]);
                    setOpenNewGroupModal(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full outline-none" disabled={isPending || !selectedContacts.length}>
                  Submit
                </Button>
              </div>
            </form>
          </Form>

          <div className="h-52 w-1/3 py-1 overflow-y-scroll scrollbar-hide">
            <ScrollArea className="min-h-20 overflow-y-auto scrollbar-hide">
              <div className="flex flex-col gap-1">
                {contacts?.map((contact) => (
                  <Fragment key={contact._id}>
                    <ContactItem
                      id={contact._id!}
                      name={contact.name!}
                      avatar={useAvatar(contact)}
                      selected={selectedContacts.includes(contact._id!)}
                      onToggle={handleSelectToggle}
                    />
                  </Fragment>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { CreateGroup };
