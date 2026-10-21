import type { Storage } from 'redux-persist'

export const persistStorage: Storage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return Promise.resolve(null)
    return Promise.resolve(window.localStorage.getItem(key))
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return Promise.resolve()
    window.localStorage.setItem(key, value)
    return Promise.resolve()
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return Promise.resolve()
    window.localStorage.removeItem(key)
    return Promise.resolve()
  },
}
