const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateToken(length = 6): string {
  let token = ''
  for (let i = 0; i < length; i++) {
    token += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return token
}
