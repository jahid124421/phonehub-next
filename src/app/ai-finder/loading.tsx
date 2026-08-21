export default function AiFinderLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4 mb-10">
        <div className="skeleton h-8 w-56 mx-auto"></div>
        <div className="skeleton h-4 w-80 mx-auto"></div>
        {/* Query box skeleton */}
        <div className="skeleton h-14 w-full rounded-xl"></div>
        <div className="flex justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-28 rounded-full"></div>
          ))}
        </div>
      </div>

      {/* Results skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card bg-base-200">
            <div className="skeleton h-40 w-full rounded-t-xl"></div>
            <div className="card-body p-4 space-y-2">
              <div className="skeleton h-4 w-3/4"></div>
              <div className="skeleton h-3 w-1/2"></div>
              <div className="skeleton h-3 w-full"></div>
              <div className="skeleton h-8 w-2/3 mt-2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
