import { MarkeeteerSidebar } from '@/components/layout/marketeer-sidebar'

export default function MarkeeteerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <MarkeeteerSidebar />
      <div className="flex-1 w-full min-w-0">
        <main className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
