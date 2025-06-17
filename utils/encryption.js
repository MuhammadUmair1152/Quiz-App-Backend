const crypto = require('crypto');
require('dotenv').config();

const algorithm = 'aes-256-cbc'; // Using AES-256-CBC algorithm
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Your 256-bit encryption key from .env
const iv = crypto.randomBytes(16); // Initialization vector

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

const decrypt = (text) => {
  const textParts = text.encryptedData.split(':');
  const iv = Buffer.from(text.iv, 'hex');
  const encryptedText = Buffer.from(text.encryptedData, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = {
  encrypt,
  decrypt
};