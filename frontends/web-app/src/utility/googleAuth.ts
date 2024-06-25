import { OAUTH_REDIRECT_PATH } from "../constants/localStorageKeys";
import { type GoogleAuthEndpoint } from "../types/requests";
import { RouteName } from "../types/router";

export const authenticateGoogle = async (currentRouteName: RouteName, googleAuthEndpoint: GoogleAuthEndpoint, isSignup = false) => {
    localStorage.setItem(OAUTH_REDIRECT_PATH, currentRouteName);
    window.location.href = `${(import.meta as any).env.VITE_API_BASE_URL}${googleAuthEndpoint}${isSignup ? '?signup' : ''}`;
};
