import { Exception } from '@adonisjs/core/build/standalone'

export default class UserInvalidPasswordException extends Exception {
  constructor(message: string) {
    super(message)

    this.status = 401
  }
}
