export const validators = {
  email: (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  },

  phone: (phone: string): boolean => {
    const regex = /^\+?[1-9]\d{1,14}$/
    return regex.test(phone.replace(/\s/g, ''))
  },

  password: (password: string): boolean => {
    return password.length >= 6
  },

  name: (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 100
  },

  birthDate: (date: string): boolean => {
    const birth = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 >= 13
    }
    return age >= 13
  },

  message: (message: string): boolean => {
    return message.trim().length > 0 && message.trim().length <= 4096
  },
}