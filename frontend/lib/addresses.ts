import {
  ApiError,
} from "@/lib/api";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";


export type Address = {
  id: string;

  label: string;

  recipient_name: string;
  phone: string;

  address_line1: string;
  address_line2: string | null;

  city: string;
  region: string | null;
  country: string;

  postal_code: string | null;

  is_default: boolean;

  created_at: string;
  updated_at: string;
};


export type AddressPayload = {
  label: string;

  recipient_name: string;
  phone: string;

  address_line1: string;
  address_line2?: string | null;

  city: string;
  region?: string | null;

  country: string;

  postal_code?: string | null;
};


function authHeaders(
  token: string,
) {
  return {
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}


async function parseResponse(
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


export async function getAddresses(
  token: string,
): Promise<Address[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/addresses`,
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
    await parseResponse(
      response,
    );


  if (!response.ok) {
    throw new ApiError(
      errorMessage(
        data,
        "Unable to load saved addresses.",
      ),
      response.status,
    );
  }


  return data as Address[];
}


export async function createAddress(
  token: string,
  payload: AddressPayload,
): Promise<Address> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/addresses`,
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
    await parseResponse(
      response,
    );


  if (!response.ok) {
    throw new ApiError(
      errorMessage(
        data,
        "Unable to save address.",
      ),
      response.status,
    );
  }


  return data as Address;
}


export async function updateAddress(
  token: string,
  addressId: string,
  payload: Partial<
    AddressPayload
  >,
): Promise<Address> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/addresses/${encodeURIComponent(
        addressId,
      )}`,
      {
        method:
          "PATCH",

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
    await parseResponse(
      response,
    );


  if (!response.ok) {
    throw new ApiError(
      errorMessage(
        data,
        "Unable to update address.",
      ),
      response.status,
    );
  }


  return data as Address;
}


export async function setDefaultAddress(
  token: string,
  addressId: string,
): Promise<Address> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/addresses/${encodeURIComponent(
        addressId,
      )}/default`,
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
    await parseResponse(
      response,
    );


  if (!response.ok) {
    throw new ApiError(
      errorMessage(
        data,
        "Unable to set default address.",
      ),
      response.status,
    );
  }


  return data as Address;
}


export async function deleteAddress(
  token: string,
  addressId: string,
): Promise<void> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/addresses/${encodeURIComponent(
        addressId,
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
      await parseResponse(
        response,
      );


    throw new ApiError(
      errorMessage(
        data,
        "Unable to delete address.",
      ),
      response.status,
    );
  }
}
