import { Exception } from '@adonisjs/core/build/standalone'

export default class InternalServerErrorException extends Exception {
  constructor(message: string) {
    super(message)

    this.status = 500
  }
}
