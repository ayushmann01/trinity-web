import { baseApi } from '@/shared/api/baseApi'
import { setTokens, setUser, logout, type AuthUser } from '@/features/auth/state/authSlice'

type LoginRequest = { email: string; password: string }
type SignupRequest = { name: string; email: string; password: string }
type ForgotRequest = { email: string }
type UpdatePasswordRequest = { token: string; password: string }

type AuthSession = {
  accessToken?: string
  refreshToken?: string
}

type AuthUserPayload = {
  id: string
  email: string
  name?: string
}

type AuthResponse = {
  user?: AuthUserPayload
  session?: AuthSession
  accessToken?: string
  refreshToken?: string
}

type MeResponse = {
  user?: AuthUserPayload
  profile?: { name?: string } | null
  id?: string
  email?: string
  name?: string
}

function normalizeMe(data: MeResponse | undefined): AuthUser | null {
  const user = data?.user
  if (user?.id && user.email) {
    return {
      id: user.id,
      email: user.email,
      name: data?.profile?.name ?? user.name,
    }
  }
  if (data?.id && data.email) {
    return { id: data.id, email: data.email, name: data.name }
  }
  return null
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          const accessToken = data?.session?.accessToken ?? data?.accessToken
          const refreshToken = data?.session?.refreshToken ?? data?.refreshToken
          if (accessToken && refreshToken) {
            dispatch(setTokens({ accessToken, refreshToken }))
            if (data?.user?.id && data.user.email) {
              dispatch(
                setUser({
                  id: data.user.id,
                  email: data.user.email,
                  name: data.user.name,
                }),
              )
            }
            dispatch(authApi.endpoints.me.initiate(undefined, { forceRefetch: true }))
          }
        } catch {
          // noop
        }
      },
    }),
    signup: build.mutation<AuthResponse, SignupRequest>({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          const accessToken = data?.session?.accessToken ?? data?.accessToken
          const refreshToken = data?.session?.refreshToken ?? data?.refreshToken
          if (accessToken && refreshToken) {
            dispatch(setTokens({ accessToken, refreshToken }))
            if (data?.user?.id && data.user.email) {
              dispatch(
                setUser({
                  id: data.user.id,
                  email: data.user.email,
                  name: data.user.name,
                }),
              )
            }
            dispatch(authApi.endpoints.me.initiate(undefined, { forceRefetch: true }))
          }
        } catch {
          // noop
        }
      },
    }),
    forgotPassword: build.mutation<{ ok: boolean }, ForgotRequest>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
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
      transformResponse: (data: MeResponse): AuthUser => {
        return (
          normalizeMe(data) ?? {
            id: data?.user?.id ?? data?.id ?? '',
            email: data?.user?.email ?? data?.email ?? '',
            name: data?.profile?.name ?? data?.user?.name ?? data?.name,
          }
        )
      },
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
