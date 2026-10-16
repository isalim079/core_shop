import { configureStore } from "@reduxjs/toolkit";
import { API } from "./features/API/API";
import authSlice from "./features/auth/auth.slice";
import uiSlice from "./features/ui/ui.slice";

export const store = configureStore({
  reducer: {
    [API.reducerPath]: API.reducer,
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(API.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
