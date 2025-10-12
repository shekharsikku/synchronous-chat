import { toast } from "sonner";
import { HiOutlineInformationCircle, HiOutlineDocumentText, HiOutlineXMark } from "react-icons/hi2";
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
import { Button } from "@/components/ui/button";
import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize, handleDownload } from "@/lib/utils";
import { useChatStore } from "@/zustand";
import { usePeer, useSocket } from "@/lib/context";
import { DataConnection } from "peerjs";

const ShareStatus = ({ status }: { status: any }) => {
  return (
    <div className="flex items-center justify-start">
      <span className="text-sm text-gray-500">
        {status === "pending" && "⏳ Pending..."}
        {status === "connecting" && "🔗 Connecting..."}
        {status === "connected" && "✅ Connected"}
        {status === "sending" && "🚀 Sending..."}
        {status === "receiving" && "📲 Receiving..."}
        {status === "completed" && "☑️ Completed"}
        {status === "disconnected" && "❌ Disconnected"}
      </span>
    </div>
  );
};

const PeerShare = () => {
  const { socket } = useSocket();
  const { peerRef, localInfo, remoteInfo, setRemoteInfo, openPeerShareModal, setOpenPeerShareModal } = usePeer();
  const { selectedChatData } = useChatStore();

  const senderConfirmRef = useRef<HTMLButtonElement | null>(null);
  const receiverConfirmRef = useRef<HTMLButtonElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openPeerRequestModal, setOpenPeerRequestModal] = useState(false);
  const [disableShareActions, setDisableShareActions] = useState(false);

  const [peerShareRequestStatus, setPeerShareRequestStatus] = useState<
    "pending" | "connecting" | "connected" | "sending" | "receiving" | "completed" | "disconnected"
  >("pending");

  const [incomingFileInfo, setIncomingFileInfo] = useState<{
    file: string;
    size: string | number;
  } | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0] || null;
      setSelectedFile(file);
    },
    [selectedFile]
  );

  const maxFileSize = 512 * 1024 * 1024;

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: maxFileSize,
  });

  const file = selectedFile;

  const unselectFile = (event: any) => {
    event.stopPropagation();
    setSelectedFile(null);
    setPeerShareRequestStatus("disconnected");
  };

  /** Sender who create file share request */
  const sendShareRequest = (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (!file) {
      toast.info("Please, select file for send!");
      return;
    }

    const shareInfo = {
      from: localInfo?.uid,
      name: localInfo?.name,
      pid: localInfo?.pid,
      to: selectedChatData?._id,
      file: file?.name,
      size: formatSize(file?.size),
    };

    setDisableShareActions(true);
    setPeerShareRequestStatus("pending");
    socket?.emit("before:share-request", { shareInfo });
    toast.info("Waiting for response from receiver!");
  };

  /** Receiver who handle file share request */
  useEffect(() => {
    const handleShareRequest = ({ shareInfo }: { shareInfo: any }) => {
      setRemoteInfo({
        uid: shareInfo.from,
        name: shareInfo.name,
        pid: shareInfo.pid,
      });
      setIncomingFileInfo({
        file: shareInfo.file,
        size: shareInfo.size,
      });

      setPeerShareRequestStatus("pending");
      setOpenPeerRequestModal(true);
      toast.info(`${shareInfo.name} is requesting to send file!`);
    };

    socket?.on("after:share-request", handleShareRequest);

    return () => {
      socket?.off("after:share-request", handleShareRequest);
    };
  }, [socket]);

  /** Response accept/reject from receiver side for file share */
  const responseShareRequest = (action: "accept" | "reject") => {
    const shareInfo = {
      from: localInfo?.uid,
      name: localInfo?.name,
      pid: localInfo?.pid,
      to: remoteInfo?.uid,
      res: action,
    };

    if (action === "reject") {
      delete shareInfo.pid;
      setRemoteInfo(null);
      setIncomingFileInfo(null);
    }

    if (action === "accept") {
      setDisableShareActions(true);
    }

    socket?.emit("before:file-request", { shareInfo });
  };

  /** Response accept/reject to sender side for file share */
  useEffect(() => {
    const handleShareRequest = ({ shareInfo }: { shareInfo: any }) => {
      if (shareInfo.res === "reject") {
        setSelectedFile(null);
        setOpenPeerShareModal(false);
        setDisableShareActions(false);
        setPeerShareRequestStatus("disconnected");
        toast.info(`${shareInfo.name} rejected to receive file!`);
        return;
      }

      if (shareInfo.res === "accept" && shareInfo.pid) {
        setRemoteInfo({
          uid: shareInfo.from,
          name: shareInfo.name,
          pid: shareInfo.pid,
        });

        setPeerShareRequestStatus("connecting");
        const remotePeer = peerRef?.current?.connect(shareInfo?.pid);

        if (!remotePeer) {
          setPeerShareRequestStatus("disconnected");
          toast.error("Unable to connect with receiver peer!");
          return;
        }

        remotePeer?.on("open", () => {
          setPeerShareRequestStatus("connected");
          console.log("✅ Connected to receiver peer!");

          if (file) {
            const reader = new FileReader();

            reader.onload = (event) => {
              setPeerShareRequestStatus("sending");
              const fileData = event.target?.result;

              remotePeer.send({
                type: "file",
                name: file?.name,
                size: file?.size,
                mime: file?.type,
                file: fileData,
              });
            };

            reader.readAsArrayBuffer(file);
          }
        });

        remotePeer.on("data", (data: any) => {
          if (data.type === "completed") {
            console.log("☑️ Closing connection from receiver peer!");

            senderConfirmRef.current?.click();
            remotePeer.close();

            setTimeout(() => {
              setRemoteInfo(null);
              setSelectedFile(null);
              toast.info("File has been sent successfully!");
            }, 2000);
          }
        });

        remotePeer.on("error", (err) => {
          setPeerShareRequestStatus("disconnected");
          console.error("❌ Peer connection error:", err.message);
        });

        remotePeer.on("close", () => {
          setDisableShareActions(false);
          setPeerShareRequestStatus("disconnected");
        });
      }
    };

    socket?.on("after:file-request", handleShareRequest);

    return () => {
      socket?.off("after:file-request", handleShareRequest);
    };
  }, [socket, file]);

  useEffect(() => {
    if (!peerRef?.current) return;

    const handleConnection = (conn: DataConnection) => {
      setPeerShareRequestStatus("receiving");
      console.log("✅ Connected to sender peer!");

      conn.on("data", (data: any) => {
        if (data.type === "file") {
          const blob = new Blob([data.file], { type: data.mime });
          const url = URL.createObjectURL(blob);

          handleDownload(url, data.name);
          conn.send({ type: "completed" });

          setRemoteInfo(null);
          setIncomingFileInfo(null);
          setDisableShareActions(false);
          setPeerShareRequestStatus("completed");
          receiverConfirmRef.current?.click();

          setTimeout(() => {
            URL.revokeObjectURL(url);
            toast.info("File has been received successfully!");
          }, 2000);
        }
      });
    };

    peerRef.current.on("connection", handleConnection);

    return () => {
      peerRef.current?.off("connection", handleConnection);
    };
  }, [peerRef?.current]);

  return (
    <>
      {/* Alert Dialog for select file and request to receiver */}
      <AlertDialog open={openPeerShareModal} onOpenChange={setOpenPeerShareModal}>
        <AlertDialogTrigger className="hidden"></AlertDialogTrigger>
        <AlertDialogContent className="w-96 rounded-md shadow-lg transition-all hover:shadow-2xl select-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Peer Share</AlertDialogTitle>
            <AlertDialogDescription>
              Share files of any size directly directly from your browser.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="w-full border rounded-md">
            <div {...getRootProps()}>
              <input {...getInputProps()} />

              <div className="space-y-4 cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-between p-3 rounded" onClick={(e) => e.stopPropagation()}>
                    <HiOutlineDocumentText size={20} />

                    <div className="w-full flex items-center justify-center">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-xs">
                          {file.name.split(".")[0].substring(0, 25) + "..."}
                        </p>
                        <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                      </div>
                    </div>

                    <button
                      className="p-2 cursor-pointer"
                      onClick={unselectFile}
                      disabled={file && disableShareActions}
                    >
                      <HiOutlineXMark size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center p-3 rounded">
                    <HiOutlineInformationCircle size={20} />
                    <div className="w-full flex items-center space-x-3 justify-center">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">File (Max Size {formatSize(maxFileSize)})</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/** File Sharing Status */}
          <ShareStatus status={peerShareRequestStatus} />

          <AlertDialogFooter>
            <AlertDialogCancel onClick={unselectFile} disabled={disableShareActions}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="hidden" ref={senderConfirmRef}>
              Continue
            </AlertDialogAction>
            <Button onClick={sendShareRequest} disabled={disableShareActions}>
              Send
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog to receiver for handle request for file receive*/}
      <AlertDialog open={openPeerRequestModal} onOpenChange={setOpenPeerRequestModal}>
        <AlertDialogTrigger className="hidden"></AlertDialogTrigger>
        <AlertDialogContent className="w-96 rounded-md shadow-lg transition-all hover:shadow-2xl select-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Peer Share</AlertDialogTitle>
            <AlertDialogDescription>
              Share files of any size directly directly from your browser.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="w-full border rounded-md">
            <div className="w-full flex items-center py-3 justify-center">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-xs">
                  {incomingFileInfo?.file.split(".")[0].substring(0, 25) + "..."}
                </p>
                <p className="text-xs text-gray-500">{incomingFileInfo?.size}</p>
              </div>
            </div>
          </div>

          {/** File Sharing Status */}
          <ShareStatus status={peerShareRequestStatus} />

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => responseShareRequest("reject")} disabled={disableShareActions}>
              Reject
            </AlertDialogCancel>
            <AlertDialogAction className="hidden" ref={receiverConfirmRef}>
              Continue
            </AlertDialogAction>
            <Button onClick={() => responseShareRequest("accept")} disabled={disableShareActions}>
              Accept
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export { PeerShare };
