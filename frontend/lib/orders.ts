import {
  ApiError,
} from "@/lib/api";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";


export type OrderItem = {
  product_id: string;

  name: string;
  slug: string;
  sku: string;

  image_url: string | null;

  unit_price: number;
  quantity: number;
  line_total: number;
};


export type Order = {
  id: string;
  order_number: string;

  vehicle_id: string | null;

  items: OrderItem[];

  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;

  payment_method: string;
  payment_status: string;

  shipping_address: string;

  status: string;

  created_at: string;
  updated_at: string;
};


export type CreateOrderPayload = {
  items: {
    product_id: string;
    quantity: number;
  }[];

  shipping_address: string;

  payment_method:
    "cash_on_delivery";

  vehicle_id?: string | null;
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


export async function createOrder(
  token: string,
  payload: CreateOrderPayload,
): Promise<Order> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/orders`,
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
        "Unable to place order.",
      ),
      response.status,
    );
  }


  return data as Order;
}


export async function getOrders(
  token: string,
): Promise<Order[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/orders`,
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
        "Unable to load orders.",
      ),
      response.status,
    );
  }


  return data as Order[];
}


export async function getOrder(
  token: string,
  orderId: string,
): Promise<Order> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/orders/${encodeURIComponent(
        orderId,
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
        "Unable to load order.",
      ),
      response.status,
    );
  }


  return data as Order;
}
