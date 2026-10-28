import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query'
import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/app/store'
import { logout, setTokens } from '@/features/auth/state/authSlice'

const API_BASE_URL =
  ((import.meta as unknown) as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ||
  '/api'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    headers.set('ngrok-skip-browser-warning', '1')
    headers.set('Accept', 'application/json')
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    const state = getState() as RootState
    const token = state.auth.accessToken
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

type BaseQueryResult = {
  data?: unknown
  error?: FetchBaseQueryError
  meta?: FetchBaseQueryMeta
}

type SessionTokens = {
  accessToken?: string
  access_token?: string
  refreshToken?: string
  refresh_token?: string
}

type RefreshEnvelope = SessionTokens & {
  data?: SessionTokens & { session?: SessionTokens }
  session?: SessionTokens
}

function unwrapEnvelope(result: BaseQueryResult): BaseQueryResult {
  if (result.data && typeof result.data === 'object' && result.data !== null) {
    const maybe = result.data as { data?: unknown }
    if ('data' in maybe) {
      return { ...result, data: maybe.data }
    }
  }
  // normalize known error envelope
  if (result.error && typeof result.error.data === 'object' && result.error.data) {
    const errData = result.error.data as { error?: { message?: string; details?: unknown } }
    if (errData.error?.message) {
      result.error = {
        ...result.error,
        data: { message: errData.error.message, details: errData.error.details } as unknown,
      }
    }
  }
  return result
}

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = (await rawBaseQuery(args, api, extraOptions)) as BaseQueryResult
  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState
    const refreshToken = state.auth.refreshToken
    if (refreshToken) {
      const refreshResult = (await rawBaseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      )) as BaseQueryResult
      if (refreshResult.data && typeof refreshResult.data === 'object') {
        const payload = refreshResult.data as RefreshEnvelope
        const source = payload.data?.session ?? payload.session ?? payload.data ?? payload
        const newAccess = source?.accessToken ?? source?.access_token
        const newRefresh = source?.refreshToken ?? source?.refresh_token ?? refreshToken
        if (newAccess) {
          api.dispatch(setTokens({ accessToken: newAccess, refreshToken: newRefresh }))
          // retry original query
          result = (await rawBaseQuery(args, api, extraOptions)) as BaseQueryResult
        } else {
          api.dispatch(logout())
        }
      } else {
        api.dispatch(logout())
      }
    } else {
      api.dispatch(logout())
    }
  }
  const unwrapped = unwrapEnvelope(result)
  if (unwrapped.error) {
    return {
      error: unwrapped.error,
      meta: unwrapped.meta,
    } as QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>
  }
  return {
    data: unwrapped.data,
    meta: unwrapped.meta,
  } as QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Me',
    'Projects',
    'Project',
    'Stakeholders',
    'StakeholderBuckets',
    'Certifications',
    'Scorecard',
  ],
  endpoints: () => ({}),
})
