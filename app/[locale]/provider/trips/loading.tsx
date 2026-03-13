export default function TripsLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="h-8 w-36 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-12 w-36 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-slate-200 rounded-xl animate-pulse" />
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-20 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50/80 border-b border-slate-100">
            <tr>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="p-5"><div className="h-3 w-16 bg-slate-200 rounded animate-pulse" /></th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="p-5"><div className="flex items-center gap-3"><div className="h-10 w-10 bg-slate-200 rounded-xl animate-pulse" /><div className="space-y-1.5"><div className="h-4 w-36 bg-slate-200 rounded animate-pulse" /><div className="h-3 w-24 bg-slate-200 rounded animate-pulse" /></div></div></td>
                <td className="p-5"><div className="h-8 w-28 bg-slate-200 rounded-lg animate-pulse" /></td>
                <td className="p-5"><div className="space-y-2 w-[100px]"><div className="h-3 w-full bg-slate-200 rounded animate-pulse" /><div className="h-2 w-full bg-slate-200 rounded-full animate-pulse" /></div></td>
                <td className="p-5"><div className="h-5 w-20 bg-slate-200 rounded animate-pulse" /></td>
                <td className="p-5"><div className="h-6 w-16 bg-slate-200 rounded-lg animate-pulse" /></td>
                <td className="p-5 text-end"><div className="h-10 w-10 bg-slate-200 rounded-xl animate-pulse ms-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
