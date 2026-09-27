import {
  ApiError,
} from "@/lib/api";

import type {
  Product,
} from "@/lib/products";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";


function authHeaders(
  token: string,
) {
  return {
    Authorization:
      `Bearer ${token}`,
  };
}


async function readResponse(
  response: Response,
): Promise<unknown> {
  if (
    response.status ===
    204
  ) {
    return null;
  }


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
) {
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


export async function getWishlist(
  token: string,
): Promise<Product[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/wishlist`,
      {
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
        "Unable to load wishlist.",
      ),
      response.status,
    );
  }


  return data as Product[];
}


export async function getWishlistProductIds(
  token: string,
): Promise<string[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/wishlist/product-ids`,
      {
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
        "Unable to load wishlist.",
      ),
      response.status,
    );
  }


  return data as string[];
}


export async function addWishlistProduct(
  token: string,
  productId: string,
): Promise<Product> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/wishlist/${encodeURIComponent(
        productId,
      )}`,
      {
        method:
          "POST",

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
      getErrorMessage(
        data,
        "Unable to add product to wishlist.",
      ),
      response.status,
    );
  }


  return data as Product;
}


export async function removeWishlistProduct(
  token: string,
  productId: string,
): Promise<void> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/wishlist/${encodeURIComponent(
        productId,
      )}`,
      {
        method:
          "DELETE",

        headers:
          authHeaders(
            token,
          ),
      },
    );


  if (!response.ok) {
    const data =
      await readResponse(
        response,
      );


    throw new ApiError(
      getErrorMessage(
        data,
        "Unable to remove product from wishlist.",
      ),
      response.status,
    );
  }
}
