import { Exception } from '@adonisjs/core/build/standalone'

export default class UserNotFoundException extends Exception {
  constructor(message: string) {
    super(message)

    this.status = 404
  }
}
