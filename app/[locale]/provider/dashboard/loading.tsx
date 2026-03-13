export default function DashboardLoading() {
  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="hidden sm:block h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-[2rem] p-6 space-y-4">
            <div className="h-12 w-12 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-24 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-6 md:p-8">
              <div className="flex items-center gap-5">
                <div className="hidden sm:block h-12 w-12 bg-slate-200 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 flex flex-col items-end">
                <div className="h-5 w-20 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
