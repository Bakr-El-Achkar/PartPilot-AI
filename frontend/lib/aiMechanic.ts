import {
  ApiError,
} from "@/lib/api";

import type {
  Product,
} from "@/lib/products";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";


export type RelevanceLevel =
  | "high"
  | "medium"
  | "low";

export type SafetyLevel =
  | "normal"
  | "caution"
  | "urgent";

export type AIMechanicResponseType =
  | "follow_up"
  | "analysis";

export type AIMechanicSessionStatus =
  | "waiting_for_user"
  | "analysis_ready"
  | "closed";


export type AIMechanicMessage = {
  role:
    | "user"
    | "assistant";

  content: string;

  created_at: string;
};


export type AIPossibleCause = {
  cause: string;

  explanation: string;

  relevance: RelevanceLevel;
};


export type AIComponentSuggestion = {
  component_key: string;

  label: string;

  catalog_key: string;

  hotspot_key: string;

  relevance: RelevanceLevel;

  explanation: string;
};


export type AISafety = {
  level: SafetyLevel;

  message: string;
};


export type AIMechanicTurn = {
  response_type:
    AIMechanicResponseType;

  assistant_message: string;

  follow_up_question:
    string | null;

  possible_causes:
    AIPossibleCause[];

  components:
    AIComponentSuggestion[];

  safety:
    AISafety;
};


export type AIProductRecommendation = {
  component_key: string;

  catalog_key: string;

  compatible_products:
    Product[];
};


export type AIMechanicSession = {
  id: string;

  vehicle_id: string;

  status:
    AIMechanicSessionStatus;

  messages:
    AIMechanicMessage[];

  latest_turn:
    AIMechanicTurn | null;

  product_recommendations:
    AIProductRecommendation[];

  created_at: string;

  updated_at: string;
};


async function readResponse(
  response: Response,
) {
  const contentType =
    response.headers.get(
      "content-type",
    );

  if (
    contentType?.includes(
      "application/json",
    )
  ) {
    return response.json();
  }

  const text =
    await response.text();

  return {
    detail:
      text ||
      "Unexpected server response.",
  };
}


function getErrorMessage(
  data: unknown,
  fallback: string,
) {
  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data
  ) {
    const detail = (
      data as {
        detail?: unknown;
      }
    ).detail;

    if (
      typeof detail === "string"
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

    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}


export async function startAIMechanicSession(
  token: string,
  payload: {
    vehicle_id: string;
    message: string;
  },
): Promise<AIMechanicSession> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/ai-mechanic/sessions`,
      {
        method: "POST",

        headers:
          authHeaders(
            token,
          ),

        body:
          JSON.stringify(
            payload,
          ),
      },
    );

  const data =
    await readResponse(
      response,
    );

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(
        data,
        "Unable to start AI diagnosis.",
      ),
      response.status,
    );
  }

  return (
    data as AIMechanicSession
  );
}


export async function continueAIMechanicSession(
  token: string,
  sessionId: string,
  message: string,
): Promise<AIMechanicSession> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/ai-mechanic/sessions/${encodeURIComponent(
        sessionId,
      )}/messages`,
      {
        method: "POST",

        headers:
          authHeaders(
            token,
          ),

        body:
          JSON.stringify({
            message,
          }),
      },
    );

  const data =
    await readResponse(
      response,
    );

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(
        data,
        "Unable to continue AI diagnosis.",
      ),
      response.status,
    );
  }

  return (
    data as AIMechanicSession
  );
}


export async function getAIMechanicSession(
  token: string,
  sessionId: string,
): Promise<AIMechanicSession> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/ai-mechanic/sessions/${encodeURIComponent(
        sessionId,
      )}`,
      {
        method: "GET",

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
      getErrorMessage(
        data,
        "Unable to load AI diagnosis.",
      ),
      response.status,
    );
  }

  return (
    data as AIMechanicSession
  );
}
