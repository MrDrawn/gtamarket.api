export interface IUpdateStoreBody {
  type: 'MINECRAFT' | 'MTA' | 'SAMP' | 'FIVEM'
  name: string
  ip: string
  description: string
  address: string
}
