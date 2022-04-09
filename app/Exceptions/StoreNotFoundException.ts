import { Exception } from '@adonisjs/core/build/standalone'

export default class StoreNotFoundException extends Exception {
  constructor(message: string) {
    super(message)

    this.status = 404
  }
}
