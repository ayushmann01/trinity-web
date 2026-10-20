import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type AuthUser = {
  id: string
  email: string
  name?: string
}

export type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
    },
    logout() {
      return initialState
    },
  },
})

export const { setTokens, setUser, logout } = authSlice.actions
