export default function PhoneLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Image placeholder */}
        <div className="w-full lg:w-1/2">
          <div className="skeleton h-80 w-full rounded-xl"></div>
        </div>

        {/* Info skeleton */}
        <div className="w-full lg:w-1/2 space-y-4">
          <div className="skeleton h-4 w-24"></div>
          <div className="skeleton h-8 w-3/4"></div>
          <div className="skeleton h-4 w-1/3"></div>
          <div className="skeleton h-12 w-1/2"></div>
          <div className="flex gap-3">
            <div className="skeleton h-10 w-28"></div>
            <div className="skeleton h-10 w-28"></div>
          </div>
          <div className="space-y-2 pt-4">
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-5/6"></div>
            <div className="skeleton h-4 w-4/6"></div>
          </div>
        </div>
      </div>

      {/* Specs skeleton */}
      <div className="mt-12 space-y-6">
        <div className="skeleton h-6 w-40"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card bg-base-200 p-4 space-y-3">
              <div className="skeleton h-5 w-1/3"></div>
              <div className="skeleton h-4 w-full"></div>
              <div className="skeleton h-4 w-4/5"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
