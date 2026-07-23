'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="hero min-h-[50vh]">
      <div className="hero-content text-center">
        <div>
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="py-4 text-base-content/70">{error.message}</p>
          <button onClick={reset} className="btn btn-primary">Try Again</button>
        </div>
      </div>
    </div>
  )
}
