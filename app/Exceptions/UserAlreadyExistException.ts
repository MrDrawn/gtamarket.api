import { Exception } from '@adonisjs/core/build/standalone'

export default class UserAlreadyExistException extends Exception {
  constructor(message: string) {
    super(message)

    this.status = 409
  }
}
