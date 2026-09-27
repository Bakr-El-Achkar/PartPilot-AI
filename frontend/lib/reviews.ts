import {
  ApiError,
} from "@/lib/api";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";


export type Review = {
  id: string;

  product_id: string;

  customer_name: string;

  rating: number;
  comment: string;

  verified_purchase: boolean;

  created_at: string;
  updated_at: string;
};


export type ReviewEligibility = {
  eligible: boolean;

  reason: string | null;

  review_id: string | null;
};


export type CreateReviewPayload = {
  product_id: string;

  rating: number;

  comment: string;
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


function getErrorMessage(
  data: unknown,
  fallback: string,
): string {
  if (
    typeof data ===
      "object" &&
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

    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}


export async function getProductReviews(
  productId: string,
): Promise<Review[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/reviews/product/${encodeURIComponent(
        productId,
      )}`,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",
        },

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
        "Unable to load product reviews.",
      ),
      response.status,
    );
  }


  return data as Review[];
}


export async function getReviewEligibility(
  token: string,
  productId: string,
): Promise<ReviewEligibility> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/reviews/eligibility/${encodeURIComponent(
        productId,
      )}`,
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
      getErrorMessage(
        data,
        "Unable to check review eligibility.",
      ),
      response.status,
    );
  }


  return data as
    ReviewEligibility;
}


export async function createReview(
  token: string,
  payload:
    CreateReviewPayload,
): Promise<Review> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/reviews`,
      {
        method:
          "POST",

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
        "Unable to submit review.",
      ),
      response.status,
    );
  }


  return data as Review;
}
