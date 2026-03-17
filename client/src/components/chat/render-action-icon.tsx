import { HiOutlineBackspace } from "react-icons/hi2";
import { LuPencilLine, LuCheck } from "react-icons/lu";
import { TooltipElement } from "@/components/chat/tooltip-element";
import { Spinner } from "@/components/ui/spinner";

interface RenderActionProps {
  detailsState: DetailsState;
  selectedChatData: any;
  memberChanges: MemberUpdateState;
  isUpdatePending: boolean;
  inputReadOnlyEnable: boolean;
  handleDetailsSubmit: () => void;
  handleMembersUpdate: () => void;
  handleDetailActionClick: (action: "change" | "clear") => void;
}

const RenderActionIcon: React.FC<RenderActionProps> = ({
  detailsState,
  selectedChatData,
  memberChanges,
  isUpdatePending,
  inputReadOnlyEnable,
  handleDetailsSubmit,
  handleMembersUpdate,
  handleDetailActionClick,
}) => {
  const isInvalid = !detailsState.name || !detailsState.description;
  const isUnchanged =
    detailsState.name === selectedChatData?.name && detailsState.description === selectedChatData?.description;
  const hasMemberChanges = memberChanges.add.length > 0 || memberChanges.remove.length > 0;

  if (isUpdatePending) return <Spinner className="size-4" />;

  if (hasMemberChanges) {
    return (
      <TooltipElement content="Update Members">
        <LuCheck size={16} className="tooltip-icon text-blue-500" onClick={handleMembersUpdate} />
      </TooltipElement>
    );
  }

  if (inputReadOnlyEnable) {
    return (
      <TooltipElement content="Change Details">
        <LuPencilLine
          size={14}
          className="tooltip-icon text-yellow-500"
          onClick={() => handleDetailActionClick("change")}
        />
      </TooltipElement>
    );
  }

  if (!isInvalid && !isUnchanged) {
    return (
      <TooltipElement content="Save Details">
        <LuCheck size={16} className="tooltip-icon text-green-500" onClick={handleDetailsSubmit} />
      </TooltipElement>
    );
  }

  if (isUnchanged) {
    return (
      <TooltipElement content="Clear Details">
        <HiOutlineBackspace
          size={16}
          className="tooltip-icon text-red-500"
          onClick={() => handleDetailActionClick("clear")}
        />
      </TooltipElement>
    );
  }

  return null;
};

export { RenderActionIcon };
