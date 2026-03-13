export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="h-7 w-36 bg-slate-200 rounded-lg animate-pulse" />
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="h-5 w-20 bg-slate-200 rounded animate-pulse" />
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="h-5 w-28 bg-slate-200 rounded animate-pulse" />
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
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-20 w-full bg-slate-200 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-12 w-full bg-slate-200 rounded-lg animate-pulse" />
    </div>
  )
}
