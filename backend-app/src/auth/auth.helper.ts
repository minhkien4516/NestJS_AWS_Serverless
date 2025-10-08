import * as crypto from 'crypto';

export function generateSecretHash(
  email: string,
  clientId: string,
  clientSecret: string,
): string {
  const key = crypto
    .createHmac('SHA256', clientSecret)
    .update(email + clientId)
    .digest('base64');
  return key;
}
