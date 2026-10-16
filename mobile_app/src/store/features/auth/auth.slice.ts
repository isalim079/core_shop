import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/store";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, IS_LOGGED_IN_KEY, USER_KEY } from "@/constants/app";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  accessToken: string;
  isHydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoggedIn: false,
  accessToken: "",
  isHydrated: false,
};

function persistSession(user: User, accessToken: string) {
  AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  AsyncStorage.setItem(IS_LOGGED_IN_KEY, "true");
  AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  AsyncStorage.removeItem(IS_LOGGED_IN_KEY);
  AsyncStorage.removeItem(USER_KEY);
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginState(state, action: PayloadAction<{ user: User; accessToken: string }>) {
      state.user = action.payload.user;
      state.isLoggedIn = true;
      state.accessToken = action.payload.accessToken;
      state.isHydrated = true;
      persistSession(action.payload.user, action.payload.accessToken);
    },
    logout(state) {
      state.user = null;
      state.isLoggedIn = false;
      state.accessToken = "";
      clearSession();
    },
    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      if (action.payload) {
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, action.payload);
      } else {
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    },
    hydrateAuth(state, action: PayloadAction<{ user: User; accessToken: string } | null>) {
      state.isHydrated = true;
      if (!action.payload) return;
      state.user = action.payload.user;
      state.isLoggedIn = true;
      state.accessToken = action.payload.accessToken;
    },
  },
});

export async function readPersistedAuth(): Promise<{ user: User; accessToken: string } | null> {
  try {
    const [loggedIn, token, userRaw] = await Promise.all([
      AsyncStorage.getItem(IS_LOGGED_IN_KEY),
      AsyncStorage.getItem(ACCESS_TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);
    if (loggedIn !== "true" || !token || !userRaw) return null;
    const user = JSON.parse(userRaw) as User;
    if (!user?.id || !user?.email) return null;
    return { user, accessToken: token };
  } catch {
    return null;
  }
}

export const { loginState, logout, updateAccessToken, hydrateAuth } = authSlice.actions;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsLoggedIn = (state: RootState) => state.auth.isLoggedIn;
export const selectIsHydrated = (state: RootState) => state.auth.isHydrated;

export default authSlice;
