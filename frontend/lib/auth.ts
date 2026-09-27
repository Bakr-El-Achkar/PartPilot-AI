const TOKEN_KEY = "partpilot_access_token";

export function saveAccessToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function removeAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // A blocked storage API must not prevent sign-out navigation.
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
