import { Link } from "react-router-dom";
import { FaLinkedin, FaGithub } from "react-icons/fa6";
import { HiLanguage, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

const EmptyChatContainer = () => {
  const iconProps = { size: 24, stroke: 1.5 };

  return (
    <div className="flex-1 bg-transparent hidden md:flex flex-col items-center justify-center gap-4">
      <HiOutlineChatBubbleLeftRight className="text-6xl lg:text-7xl xl:text-8xl" />
      <h3 className="text-opacity-90 text-2xl lg:text-3xl xl:text-4xl transition-all duration-500 poppins-medium 
      flex items-center justify-center text-center gap-3">
        Welcome to<span className="text-gray-900"> Synchronous Chat!</span>
        <HiLanguage />
      </h3>
      <p className="text-lg lg:text-xl text-gray-700 font-normal">
        Share you smile with this world find friends & enjoy!</p>
      <h6 className="text-sm lg:text-base font-medium text-gray-500">
        Created using MERN Stack by Shekhar Sharma!
      </h6>
      <div className="flex space-x-4 xl:space-x-6 transition-all duration-500 mt-2">
        <Link to="https://www.github.com/shekharsikku" target="_blank"
          className="text-neutral-900 hover:text-neutral-600 border-none outline-none transition-all duration-300">
          <FaGithub size={iconProps.size} strokeWidth={iconProps.stroke} />
        </Link>
        <Link to="https://www.linkedin.com/in/shekharsikku/" target="_blank"
          className="text-neutral-900 hover:text-neutral-600 border-none outline-none transition-all duration-300">
          <FaLinkedin size={iconProps.size} strokeWidth={iconProps.stroke} />
        </Link>
      </div>
    </div>
  )
}

export { EmptyChatContainer };