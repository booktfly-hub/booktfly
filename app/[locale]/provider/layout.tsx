import { ProviderSidebar } from '@/components/layout/provider-sidebar'

type Props = {
  children: React.ReactNode
}

export default function ProviderLayout({ children }: Props) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <ProviderSidebar />
      <div className="flex-1 p-4 lg:p-8 bg-muted/30">{children}</div>
    </div>
  )
}
