import { AdminSidebar } from '@/components/layout/admin-sidebar'

type Props = {
  children: React.ReactNode
}

export default function AdminLayout({ children }: Props) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <div className="flex-1 p-4 lg:p-8 bg-muted/30">{children}</div>
    </div>
  )
}
