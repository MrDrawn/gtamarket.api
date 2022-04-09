import { Exception } from '@adonisjs/core/build/standalone'

export default class InvalidBodyException extends Exception {
  constructor(message: string) {
    super(message)

    this.status = 400
  }
}
