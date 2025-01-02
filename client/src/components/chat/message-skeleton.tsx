const MessageSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 transition-all duration-300">
      {[...Array(9)].map((_, i) => (
        <div key={i} className={`flex-1 flex-col gap-4
          ${i % 2 === 0 ? 'justify-start' : 'justify-end'} ${i % 2 === 0 ? 'lg:ml-2' : 'lg:mr-2'}`}>

          <div className={`border border-gray-200 p-3 rounded-sm my-2 cursor-default glow bg-gradient-to-r 
              ${i % 2 !== 0 ? 'from-gray-200 via-gray-300 to-gray-200' : 'from-gray-100 via-gray-200 to-gray-100'}
              ${i % 2 === 0 ? 'justify-self-start justify-items-start' : 'justify-self-end justify-items-end'}
              ${i % 3 === 0 ? 'md:min-w-[65%] lg:min-w-[60%]' : 'md:min-w-[75%] lg:min-w-[70%]'} min-w-[85%]`}>

            {/* Placeholder for message text */}
            <div className={`h-3 w-full rounded mb-2 bg-gradient-to-r ${i % 2 !== 0 ? 'from-gray-300 via-gray-400 to-gray-300' : 'from-gray-100 via-gray-200 to-gray-100'} pulse`}></div>

            <div className={`h-3 w-2/3 rounded bg-gradient-to-r ${i % 2 !== 0 ? 'from-gray-300 via-gray-400 to-gray-300' : 'from-gray-100 via-gray-200 to-gray-100'} pulse`}></div>
          </div>

          {/* Timestamp skeleton */}
          <div className={`text-xs text-gray-400 my-2 flex ${i % 2 === 0 ? 'justify-self-start' : 'justify-self-end'}`}>
            <div className={`h-3 w-16 lg:w-20 rounded bg-gradient-to-r ${i % 2 !== 0 ? 'from-gray-300 via-gray-400 to-gray-300' : 'from-gray-100 via-gray-200 to-gray-100'} pulse`}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { MessageSkeleton };