const crypto = require('crypto');
require('dotenv').config();

const algorithm = 'aes-256-cbc'; // Using AES-256-CBC algorithm
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Your 256-bit encryption key from .env

// Generate a fresh IV for every encryption call
const encrypt = (plainText) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(plainText, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

const decrypt = ({ iv, encryptedData }) => {
  const ivBuffer = Buffer.from(iv, 'hex');
  const encryptedText = Buffer.from(encryptedData, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), ivBuffer);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// Convenience: encode to single string "<iv>:<data>" so it fits into a single DB field
const encryptString = (plainText) => {
  const { iv, encryptedData } = encrypt(plainText);
  return `${iv}:${encryptedData}`; // iv first keeps decrypt logic simple
};

const decryptString = (cipherString) => {
  const [iv, encryptedData] = cipherString.split(':');
  return decrypt({ iv, encryptedData });
};

module.exports = {
  encrypt,
  decrypt,
  encryptString,
  decryptString,
};