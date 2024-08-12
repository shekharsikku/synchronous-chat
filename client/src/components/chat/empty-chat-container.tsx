import { HiLanguage, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

const EmptyChatContainer = () => {
  return (
    <div className="flex-1 bg-transparent hidden md:flex flex-col items-center justify-center gap-4">
      <HiOutlineChatBubbleLeftRight className="text-6xl lg:text-7xl xl:text-8xl" />
      <h3 className="text-opacity-90 text-2xl lg:text-3xl xl:text-4xl transition-all duration-500 poppins-medium 
      flex items-center justify-center text-center gap-3">
        Welcome to<span className="text-gray-900"> Synchronous Chat!</span>
        <HiLanguage />
      </h3>
      <p className="text-lg xl:text-xl text-teal-700 font-normal">
        Share you smile with this world find friends & enjoy!</p>
    </div>
  )
}

export { EmptyChatContainer };