import { Exception } from '@adonisjs/core/build/standalone'

export default class UserLoginFailedException extends Exception {
  constructor(message: string) {
    super(message)

    this.status = 401
  }
}
