export default function TripDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="h-7 w-36 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
      </div>
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="h-5 w-28 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="h-5 w-36 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
            <div className="h-20 w-full bg-slate-200 rounded-lg animate-pulse" />
          </div>
        ))}
        <div className="h-40 w-full bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1 h-12 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-12 w-32 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="bg-white border rounded-xl">
        <div className="p-5 border-b">
          <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-8 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
