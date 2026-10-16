import { useKeyboardState } from "react-native-keyboard-controller";

export const useKeyboard = () => {
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  const height = useKeyboardState((state) => state.height);

  return { isKeyboardVisible, height };
};
