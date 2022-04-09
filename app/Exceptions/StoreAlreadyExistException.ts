import { Exception } from '@adonisjs/core/build/standalone'

export default class StoreAlreadyExistException extends Exception {
  constructor(message: string) {
    super(message)

    this.status = 409
  }
}
