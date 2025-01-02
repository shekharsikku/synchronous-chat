const ContactListSkeleton = ({
  animate,
  count = 5,
  status = false
}: {
  animate: "pulse" | "glow",
  count?: number,
  status?: boolean
}) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`flex border border-gray-200 p-2 lg:px-3 xl:px-6 h-14 items-center justify-between w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded ${animate}`}>
          {/* Avatar skeleton */}
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-300 rounded-full animate-${animate}" />
            {/* Name and Username skeleton */}
            <div className="flex flex-col gap-2">
              <div className="w-24 h-3 bg-gray-300 rounded animate-${animate}" />
              <div className="w-16 h-2 bg-gray-300 rounded animate-${animate}" />
            </div>
          </div>
          {/* Online/Offline indicator skeleton */}
          {status && <div className="size-5 bg-gray-300 rounded-full animate-${animate}" />}
        </div>
      ))}
    </div>
  );
};

export { ContactListSkeleton };