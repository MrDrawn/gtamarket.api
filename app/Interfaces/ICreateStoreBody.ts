export interface ICreateStoreBody {
  type: 'MINECRAFT' | 'MTA' | 'SAMP' | 'FIVEM'
  name: string
  ip: string
  description: string
  address: string
  plan: 'FREE' | 'PRO' | 'PREMIUM'
}
