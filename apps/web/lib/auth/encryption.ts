import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const secretKey = process.env.ENCRYPTION_SECRET || crypto.randomBytes(32).toString('hex')

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  const iv = Buffer.from(parts.shift()!, 'hex')
  const authTag = Buffer.from(parts.shift()!, 'hex')
  const encrypted = parts.join(':')

  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}