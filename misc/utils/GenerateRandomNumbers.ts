import crypto from 'crypto'

export function getRandomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min
}

export function genNewCode() {
  const codeLetters = Math.random().toString(36).substring(7)

  return `${crypto.randomBytes(5).toString('hex')}${codeLetters}`.toLocaleUpperCase()
}
