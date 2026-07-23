export default function CompareLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="skeleton h-8 w-64 mb-8"></div>

      {/* Table skeleton with 3 columns */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th><div className="skeleton h-6 w-24"></div></th>
              {Array.from({ length: 3 }).map((_, i) => (
                <th key={i}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="skeleton h-24 w-24 rounded-xl"></div>
                    <div className="skeleton h-4 w-20"></div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td><div className="skeleton h-4 w-20"></div></td>
                {Array.from({ length: 3 }).map((_, j) => (
                  <td key={j}><div className="skeleton h-4 w-full"></div></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
