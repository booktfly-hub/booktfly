export const CONTRACT_VERSION = 'v1-2024'

export type ContractRole = 'client' | 'marketeer' | 'service_provider'

export type ContractMeta = {
  role: ContractRole
  title_ar: string
  title_en: string
  version: string
}
