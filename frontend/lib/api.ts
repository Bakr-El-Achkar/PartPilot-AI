const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UserPublic = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    detail: text || "Unexpected server response.",
  };
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<UserPublic> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? "Unable to create account.",
      response.status,
    );
  }

  return data;
}

export async function loginUser(
  payload: LoginPayload,
): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? "Unable to sign in.",
      response.status,
    );
  }

  return data;
}

export async function getCurrentUser(
  token: string,
): Promise<UserPublic> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? "Unable to load your account.",
      response.status,
    );
  }

  return data;
}