import { API } from "../API/API";
import { User } from "./auth.slice";

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

export const authApi = API.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["auth"],
    }),

    register: builder.mutation<AuthResponse, { name: string; email: string; password: string }>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),

    getMe: builder.query<{ data: User }, void>({
      query: () => ({ url: "/auth/me", method: "GET" }),
      providesTags: ["auth"],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["auth", "user"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLogoutMutation,
} = authApi;
