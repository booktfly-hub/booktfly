import { setRequestLocale } from 'next-intl/server'
import { AssistantChat } from '@/components/assistant/assistant-chat'

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="h-[calc(100svh-6rem)] overflow-hidden bg-background">
      <AssistantChat locale={locale} />
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const title =
    locale === 'ar'
      ? 'المساعد الذكي — BookitFly'
      : locale === 'tr'
        ? 'AI Asistan — BookitFly'
        : 'AI Assistant — BookitFly'
  return { title }
}
