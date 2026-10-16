import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/store";

interface UIState {
  isLoading: boolean;
  alertMessage: string | null;
  alertType: "success" | "error" | "warning" | "info" | null;
}

const initialState: UIState = {
  isLoading: false,
  alertMessage: null,
  alertType: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    showAlert(
      state,
      action: PayloadAction<{
        message: string;
        type: UIState["alertType"];
      }>
    ) {
      state.alertMessage = action.payload.message;
      state.alertType = action.payload.type;
    },
    clearAlert(state) {
      state.alertMessage = null;
      state.alertType = null;
    },
  },
});

export const { setLoading, showAlert, clearAlert } = uiSlice.actions;
export const selectUILoading = (state: RootState) => state.ui.isLoading;
export const selectAlert = (state: RootState) => ({
  message: state.ui.alertMessage,
  type: state.ui.alertType,
});

export default uiSlice;
