export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

export const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

export const validatePassword = (password: string) => PASSWORD_REGEX.test(password)

export const passwordHint =
  'Min 8 characters, with uppercase, lowercase, number, and special character.'
