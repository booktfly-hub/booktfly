import { createClient } from '@/lib/supabase/server'
import PackageDetailClient from './package-detail-client'
import type { Package as PackageType } from '@/types/database'

type Props = {
  params: Promise<{ id: string; locale: string }>
}

export default async function PackagePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: pkg } = await supabase
    .from('packages')
    .select('*, provider:providers(*), trip:trips(*), room:rooms(*), car:cars(*)')
    .eq('id', id)
    .single()

  return <PackageDetailClient params={params} initialPkg={(pkg as PackageType) ?? null} />
}
