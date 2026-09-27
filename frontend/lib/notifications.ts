import {
  ApiError,
} from "@/lib/api";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";


export type NotificationCategory =
  | "general"
  | "promotion"
  | "account";


export type NotificationSource =
  | "admin"
  | "system";


export type CustomerNotification = {
  id: string;
  user_id: string;

  category:
    NotificationCategory;

  title: string;
  message: string;

  link: string | null;

  source:
    NotificationSource;

  is_read: boolean;
  read_at: string | null;

  created_at: string;
};


export type NotificationReadAllResponse = {
  updated_count: number;
};


async function readResponse(
  response: Response,
): Promise<unknown> {
  const text =
    await response.text();


  if (!text) {
    return null;
  }


  try {
    return JSON.parse(
      text,
    );

  } catch {
    return text;
  }
}


function errorMessage(
  data: unknown,
  fallback: string,
) {
  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data
  ) {
    const detail =
      (
        data as {
          detail?: unknown;
        }
      ).detail;


    if (
      typeof detail ===
      "string"
    ) {
      return detail;
    }
  }


  return fallback;
}


function authHeaders(
  token: string,
) {
  return {
    Accept:
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}


export async function getNotifications(
  token: string,
): Promise<CustomerNotification[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/notifications`,
      {
        method:
          "GET",

        headers:
          authHeaders(
            token,
          ),

        cache:
          "no-store",
      },
    );


  const data =
    await readResponse(
      response,
    );


  if (!response.ok) {
    throw new ApiError(
      errorMessage(
        data,
        "Unable to load notifications.",
      ),
      response.status,
    );
  }


  return data as
    CustomerNotification[];
}


export async function markNotificationRead(
  token: string,
  notificationId: string,
): Promise<CustomerNotification> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/notifications/${encodeURIComponent(
        notificationId,
      )}/read`,
      {
        method:
          "PATCH",

        headers:
          authHeaders(
            token,
          ),
      },
    );


  const data =
    await readResponse(
      response,
    );


  if (!response.ok) {
    throw new ApiError(
      errorMessage(
        data,
        "Unable to mark notification as read.",
      ),
      response.status,
    );
  }


  return data as
    CustomerNotification;
}


export async function markAllNotificationsRead(
  token: string,
): Promise<NotificationReadAllResponse> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/notifications/read-all`,
      {
        method:
          "PATCH",

        headers:
          authHeaders(
            token,
          ),
      },
    );


  const data =
    await readResponse(
      response,
    );


  if (!response.ok) {
    throw new ApiError(
      errorMessage(
        data,
        "Unable to mark notifications as read.",
      ),
      response.status,
    );
  }


  return data as
    NotificationReadAllResponse;
}
