import { baseApi } from '@/shared/api/baseApi'
import { setTokens, setUser, logout, type AuthUser } from '@/features/auth/state/authSlice'

type LoginRequest = { email: string; password: string }
type SignupRequest = { name: string; email: string; password: string }
type ForgotRequest = { email: string }
type UpdatePasswordRequest = { token: string; password: string }

type AuthTokens = { accessToken: string; refreshToken: string }

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthTokens, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setTokens(data))
          // fetch user
          dispatch(authApi.endpoints.me.initiate(undefined, { forceRefetch: true }))
        } catch {
          // noop
        }
      },
    }),
    signup: build.mutation<AuthTokens, SignupRequest>({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setTokens(data))
          dispatch(authApi.endpoints.me.initiate(undefined, { forceRefetch: true }))
        } catch {
          // noop
        }
      },
    }),
    forgotPassword: build.mutation<{ ok: boolean }, ForgotRequest>({
      query: (body) => ({ url: '/auth/forgot', method: 'POST', body }),
    }),
    updatePassword: build.mutation<{ ok: boolean }, UpdatePasswordRequest>({
      query: (body) => ({ url: '/auth/update-password', method: 'POST', body }),
    }),
    logout: build.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch }) {
        dispatch(logout())
      },
    }),
    me: build.query<AuthUser, void>({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['Me'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setUser(data))
        } catch {
          // noop
        }
      },
    }),
  }),
  overrideExisting: false,
})

export const {
  useLoginMutation,
  useSignupMutation,
  useForgotPasswordMutation,
  useUpdatePasswordMutation,
  useLogoutMutation,
  useMeQuery,
} = authApi
