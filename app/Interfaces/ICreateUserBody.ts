export interface ICreateUserBody {
  name: string
  username: string
  email: string
  password: string
  group: 'CLIENT' | 'SUPPORT' | 'ADMIN'
  active: boolean
}
