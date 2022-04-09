import { Exception } from '@adonisjs/core/build/standalone'

export default class UserTokenInvalidException extends Exception {
  constructor(message: string) {
    super(message)

    this.status = 498
  }
}
