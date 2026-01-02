import { HiLanguage, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { Link } from "react-router-dom";

const EmptyChatContainer = () => {
  return (
    <div className="flex-1 bg-transparent hidden md:flex flex-col items-center justify-center gap-4">
      <HiOutlineChatBubbleLeftRight size={100} />
      <h3 className="flex items-center justify-center text-center gap-3 font-extrabold text-opacity-90 text-2xl lg:text-3xl xl:text-4xl transition-transform duration-300">
        Welcome to Synchronous Chat! <HiLanguage strokeWidth={1.5} />
      </h3>
      <p className="text-sm lg:text-base text-gray-700  dark:text-gray-300">
        Share you smile with this world find friends & enjoy!
      </p>
      <h6 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-200">
        Created with ❤︎ by{" "}
        <Link to="https://github.com/shekharsikku" target="_blank" className="hover:underline">
          Shekhar Sharma{" "}
        </Link>
      </h6>
    </div>
  );
};

export { EmptyChatContainer };
