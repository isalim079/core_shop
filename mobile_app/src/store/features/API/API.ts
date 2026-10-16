import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { logout, updateAccessToken } from "../auth/auth.slice";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, BASE_URL } from "@/constants/app";

let isRefreshingToken = false;
let refreshTokenPromise: Promise<string | null> | null = null;

const customBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const rawBaseQuery = fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      headers.set("Pragma", "no-cache");
      return headers;
    },
    signal: controller.signal,
  });

  try {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (
      result?.error?.status === 401 ||
      (result?.error?.data as any)?.statusCode === 401
    ) {
      if (isRefreshingToken && refreshTokenPromise) {
        const newToken = await refreshTokenPromise;
        if (newToken) {
          result = await rawBaseQuery(args, api, extraOptions);
        }
        return result;
      }

      if (!isRefreshingToken) {
        isRefreshingToken = true;

        refreshTokenPromise = (async () => {
          try {
            const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
            if (!refreshToken) {
              api.dispatch(logout());
              return null;
            }

            await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
            api.dispatch(updateAccessToken(""));

            const refreshResult = await rawBaseQuery(
              {
                url: "/auth/refresh-token",
                method: "POST",
                body: { token: refreshToken },
              },
              api,
              extraOptions
            );

            const newToken = (refreshResult?.data as any)?.data?.accessToken;
            if (newToken) {
              await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newToken);
              api.dispatch(updateAccessToken(newToken));
              return newToken;
            } else {
              api.dispatch(logout());
              await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
              return null;
            }
          } catch {
            api.dispatch(logout());
            await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
            return null;
          } finally {
            setTimeout(() => {
              isRefreshingToken = false;
              refreshTokenPromise = null;
            }, 2000);
          }
        })();

        const newToken = await refreshTokenPromise;
        if (newToken) {
          result = await rawBaseQuery(args, api, extraOptions);
        }
      }
    }

    return result;
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        error: {
          status: "FETCH_ERROR" as const,
          data: undefined,
          error: "Request timed out after 30 seconds",
        },
      };
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const API = createApi({
  reducerPath: "api",
  baseQuery: customBaseQuery,
  tagTypes: [
    "user",
    "auth",
    "dashboard",
  ],
  endpoints: () => ({}),
});
