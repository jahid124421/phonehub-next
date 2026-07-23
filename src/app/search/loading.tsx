export default function SearchLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar skeleton */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="skeleton h-6 w-3/4"></div>
          <div className="skeleton h-10 w-full"></div>
          <div className="skeleton h-6 w-1/2"></div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-8 w-full"></div>
            ))}
          </div>
          <div className="skeleton h-6 w-2/3"></div>
          <div className="skeleton h-10 w-full"></div>
        </div>

        {/* Results grid skeleton */}
        <div className="flex-1">
          <div className="skeleton h-8 w-48 mb-6"></div>
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
      </div>
    </div>
  )
}
