export default function RevenueLoading() {
  return (
    <div className="space-y-8">
      <div className="h-7 w-28 bg-slate-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-7 w-28 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-xl">
        <div className="p-5 border-b">
          <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50/30">
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="p-3"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /></th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                <td className="p-3"><div className="space-y-1"><div className="h-4 w-36 bg-slate-200 rounded animate-pulse" /><div className="h-3 w-24 bg-slate-200 rounded animate-pulse" /></div></td>
                <td className="p-3"><div className="h-4 w-8 bg-slate-200 rounded animate-pulse" /></td>
                <td className="p-3"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /></td>
                <td className="p-3"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /></td>
                <td className="p-3"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
