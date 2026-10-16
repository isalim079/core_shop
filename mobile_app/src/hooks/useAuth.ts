import { selectIsLoggedIn } from "@/store/features/auth/auth.slice";
import { useAppSelector } from "@/store/hooks";

export const useAuth = () => {
  return useAppSelector(selectIsLoggedIn);
};
