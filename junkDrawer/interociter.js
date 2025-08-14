/*
    this purports to do secure(ish) vanilla passphrase encrypt/decrypt
    using built in crypto.subtle API

    stolen from :
    https://gist.github.com/chrisveness/770ee96945ec12ac84f134bf538d89fb
    
*/


const deriveKeyAndIv = async (password, salt) => {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    password,
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const keyLength = 32
  const ivLength = 16
  const numBits = (keyLength + ivLength) * 8
  const derviedBytes = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-512',
    salt,
    iterations: 10000
  }, passwordKey, numBits)
  const key = await crypto.subtle.importKey(
    'raw',
    derviedBytes.slice(0, keyLength),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  )
  const iv = derviedBytes.slice(keyLength, keyLength + ivLength)
  return {
    key,
    iv
  }
}

const encrypt = async (password, salt, plainText) => {
  const { key, iv } = await deriveKeyAndIv(password, salt)
  return crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv
  }, key, plainText)
}

const decrypt = async (password, salt, cipher) => {
  const { key, iv } = await deriveKeyAndIv(password, salt)
  return crypto.subtle.decrypt({
    name: 'AES-GCM',
    iv
  }, key, cipher)
}

const utf8ToUint8Array = (input) => new TextEncoder().encode(input)

const arrayBufferToUtf8 = (input) => new TextDecoder().decode(new Uint8Array(input))

const arrayBufferToHex = (input) => {
  input = new Uint8Array(input)
  const output = []
  for (let i = 0; i < input.length; ++i) {
    output.push(input[i].toString(16).padStart(2, '0'))
  }
  return output.join('')
}

const run = async () => {
  const password = utf8ToUint8Array('fdcf72d4-7c59-4240-a527-6630fc92fcbb')
  const salt = utf8ToUint8Array('233f9fad-7681-4ebd-ad5e-164480bbc3f5')
  const data = utf8ToUint8Array('Hello, world!')
  const cipher = await encrypt(password, salt, data)
  const plainText = await decrypt(password, salt, cipher)
  console.log(arrayBufferToHex(cipher))
  console.log(arrayBufferToUtf8(plainText))
}

run()
