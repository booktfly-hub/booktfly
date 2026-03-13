export default function BookingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-32 bg-slate-200 rounded-lg animate-pulse" />
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-20 bg-slate-200 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50/30">
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="p-3"><div className="h-4 w-16 bg-slate-200 rounded animate-pulse" /></th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td className="p-3"><div className="space-y-1"><div className="h-4 w-28 bg-slate-200 rounded animate-pulse" /><div className="h-3 w-16 bg-slate-200 rounded animate-pulse" /></div></td>
                <td className="p-3"><div className="h-4 w-32 bg-slate-200 rounded animate-pulse" /></td>
                <td className="p-3"><div className="h-4 w-8 bg-slate-200 rounded animate-pulse" /></td>
                <td className="p-3"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /></td>
                <td className="p-3"><div className="h-4 w-16 bg-slate-200 rounded animate-pulse" /></td>
                <td className="p-3"><div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" /></td>
                <td className="p-3"><div className="h-3 w-20 bg-slate-200 rounded animate-pulse" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
