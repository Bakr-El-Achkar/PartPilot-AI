import {
  ApiError,
} from "@/lib/api";

import type {
  Brand,
  Category,
  Product,
} from "@/lib/products";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";


export type AdminOverview = {
  products: number;
  fitments: number;
  orders: number;
  orders_this_month: number;
  processing_orders: number;
  users: number;
  categories: number;
  brands: number;
  low_stock_items: number;
  revenue: number;
};


export type AdminOrderStatus =
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";


export type AdminOrderItem = {
  product_id: string;
  name: string;
  slug: string;
  sku: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};


export type AdminOrder = {
  id: string;
  order_number: string;

  user_id: string;

  customer_name: string;
  customer_email: string;
  customer_phone: string | null;

  vehicle_id: string | null;

  items: AdminOrderItem[];

  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;

  payment_method: string;
  payment_status: string;

  shipping_address: string;

  status: AdminOrderStatus;

  created_at: string;
  updated_at: string;
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


export async function getAdminOverview(
  token: string,
): Promise<AdminOverview> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/overview`,
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
        "Unable to load admin dashboard.",
      ),
      response.status,
    );
  }


  return data as AdminOverview;
}


export async function getAdminOrders(
  token: string,
): Promise<AdminOrder[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/orders`,
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
        "Unable to load orders.",
      ),
      response.status,
    );
  }


  return data as AdminOrder[];
}


export async function getAdminOrder(
  token: string,
  orderId: string,
): Promise<AdminOrder> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/orders/${encodeURIComponent(
        orderId,
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
        "Unable to load order.",
      ),
      response.status,
    );
  }


  return data as AdminOrder;
}


export async function updateAdminOrderStatus(
  token: string,
  orderId: string,
  status: AdminOrderStatus,
): Promise<AdminOrder> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/orders/${encodeURIComponent(
        orderId,
      )}/status`,
      {
        method:
          "PATCH",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            {
              status,
            },
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
        "Unable to update order status.",
      ),
      response.status,
    );
  }


  return data as AdminOrder;
}


/* ============================================================
   ADMIN PRODUCTS
============================================================ */

export type AdminProductCreatePayload = {
  name: string;
  sku: string;
  part_number: string;
  brand_id: string;
  category_id: string;
  subcategory_slug: string;
  description: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  images: string[];
  specifications: Record<string, string>;
  warranty: string | null;
};


export type AdminProductUpdatePayload = {
  name?: string;
  part_number?: string;
  brand_id?: string;
  category_id?: string;
  subcategory_slug?: string;
  description?: string;
  price?: number;
  sale_price?: number | null;
  stock_quantity?: number;
  images?: string[];
  specifications?: Record<string, string>;
  warranty?: string | null;
  is_active?: boolean;
};


export async function getAdminProducts(
  token: string,
): Promise<Product[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/products`,
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
        "Unable to load admin products.",
      ),
      response.status,
    );
  }


  return data as Product[];
}


export async function createAdminProduct(
  token: string,
  payload: AdminProductCreatePayload,
): Promise<Product> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/products`,
      {
        method:
          "POST",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

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
        "Unable to create product.",
      ),
      response.status,
    );
  }


  return data as Product;
}


export async function updateAdminProduct(
  token: string,
  productId: string,
  payload: AdminProductUpdatePayload,
): Promise<Product> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/products/${encodeURIComponent(
        productId,
      )}`,
      {
        method:
          "PATCH",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

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
        "Unable to update product.",
      ),
      response.status,
    );
  }


  return data as Product;
}


/* ============================================================
   ADMIN CATALOG
============================================================ */

export type AdminCategoryCreatePayload = {
  name: string;
  description: string | null;
  icon: string | null;
  subcategories: {
    name: string;
  }[];
};


export type AdminCategoryUpdatePayload = {
  name?: string;
  description?: string | null;
  icon?: string | null;
  subcategories?: {
    name: string;
  }[];
  is_active?: boolean;
};


export type AdminBrandCreatePayload = {
  name: string;
  description: string | null;
  country: string | null;
  website: string | null;
  logo_url: string | null;
};


export type AdminBrandUpdatePayload = {
  name?: string;
  description?: string | null;
  country?: string | null;
  website?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
};


export async function getAdminCategories(
  token: string,
): Promise<Category[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/categories`,
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
        "Unable to load admin categories.",
      ),
      response.status,
    );
  }


  return data as Category[];
}


export async function createAdminCategory(
  token: string,
  payload: AdminCategoryCreatePayload,
): Promise<Category> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/catalog/categories`,
      {
        method:
          "POST",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

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
        "Unable to create category.",
      ),
      response.status,
    );
  }


  return data as Category;
}


export async function updateAdminCategory(
  token: string,
  categoryId: string,
  payload: AdminCategoryUpdatePayload,
): Promise<Category> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/categories/${encodeURIComponent(
        categoryId,
      )}`,
      {
        method:
          "PATCH",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

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
        "Unable to update category.",
      ),
      response.status,
    );
  }


  return data as Category;
}


export async function getAdminBrands(
  token: string,
): Promise<Brand[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/brands`,
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
        "Unable to load admin brands.",
      ),
      response.status,
    );
  }


  return data as Brand[];
}


export async function createAdminBrand(
  token: string,
  payload: AdminBrandCreatePayload,
): Promise<Brand> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/catalog/brands`,
      {
        method:
          "POST",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

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
        "Unable to create brand.",
      ),
      response.status,
    );
  }


  return data as Brand;
}


export async function updateAdminBrand(
  token: string,
  brandId: string,
  payload: AdminBrandUpdatePayload,
): Promise<Brand> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/brands/${encodeURIComponent(
        brandId,
      )}`,
      {
        method:
          "PATCH",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

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
        "Unable to update brand.",
      ),
      response.status,
    );
  }


  return data as Brand;
}


/* ============================================================
   ADMIN FITMENTS
============================================================ */

export type AdminFitment = {
  id: string;
  product_id: string;

  make: string;
  model: string;

  make_normalized: string;
  model_normalized: string;

  year_start: number;
  year_end: number;

  engine: string | null;
  engine_normalized: string | null;

  transmission: string | null;
  transmission_normalized: string | null;

  is_active: boolean;

  created_at: string | null;
  updated_at: string | null;
};


export type AdminFitmentCreatePayload = {
  product_id: string;
  make: string;
  model: string;
  year_start: number;
  year_end: number;
  engine?: string | null;
  transmission?: string | null;
};


export type AdminFitmentUpdatePayload = {
  product_id?: string;
  make?: string;
  model?: string;
  year_start?: number;
  year_end?: number;
  engine?: string | null;
  transmission?: string | null;
  is_active?: boolean;
};


export async function getAdminFitments(
  token: string,
): Promise<AdminFitment[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/fitments`,
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
        "Unable to load admin fitments.",
      ),
      response.status,
    );
  }


  return data as AdminFitment[];
}


export async function createAdminFitment(
  token: string,
  payload: AdminFitmentCreatePayload,
): Promise<AdminFitment> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/fitments`,
      {
        method:
          "POST",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

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
        "Unable to create fitment.",
      ),
      response.status,
    );
  }


  return data as AdminFitment;
}


export async function updateAdminFitment(
  token: string,
  fitmentId: string,
  payload: AdminFitmentUpdatePayload,
): Promise<AdminFitment> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/fitments/${encodeURIComponent(
        fitmentId,
      )}`,
      {
        method:
          "PATCH",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

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
        "Unable to update fitment.",
      ),
      response.status,
    );
  }


  return data as AdminFitment;
}


/* ============================================================
   ADMIN USERS
============================================================ */

export type AdminUserRole =
  | "customer"
  | "admin";


export type AdminUser = {
  id: string;

  first_name: string;
  last_name: string;

  email: string;
  phone: string | null;

  role: string;
  is_active: boolean;

  created_at: string | null;
  updated_at: string | null;
};


export type AdminUserUpdatePayload = {
  role?: AdminUserRole;
  is_active?: boolean;
};


export async function getAdminUsers(
  token: string,
): Promise<AdminUser[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/users`,
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
        "Unable to load admin users.",
      ),
      response.status,
    );
  }


  return data as AdminUser[];
}


export async function getAdminUser(
  token: string,
  userId: string,
): Promise<AdminUser> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/users/${encodeURIComponent(
        userId,
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
        "Unable to load user.",
      ),
      response.status,
    );
  }


  return data as AdminUser;
}


export async function updateAdminUser(
  token: string,
  userId: string,
  payload: AdminUserUpdatePayload,
): Promise<AdminUser> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/users/${encodeURIComponent(
        userId,
      )}`,
      {
        method:
          "PATCH",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

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
        "Unable to update user.",
      ),
      response.status,
    );
  }


  return data as AdminUser;
}


/* ============================================================
   ADMIN REVIEWS
============================================================ */

export type AdminReview = {
  id: string;

  product_id: string;
  product_name: string;
  product_slug: string;
  product_sku: string;

  user_id: string;
  customer_name: string;
  customer_email: string;

  order_id: string;
  order_number: string;

  rating: number;
  comment: string;

  verified_purchase: boolean;
  is_active: boolean;

  created_at: string | null;
  updated_at: string | null;
};


export async function getAdminReviews(
  token: string,
): Promise<AdminReview[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/reviews`,
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
        "Unable to load admin reviews.",
      ),
      response.status,
    );
  }


  return data as AdminReview[];
}


export async function getAdminReview(
  token: string,
  reviewId: string,
): Promise<AdminReview> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/reviews/${encodeURIComponent(
        reviewId,
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
        "Unable to load review.",
      ),
      response.status,
    );
  }


  return data as AdminReview;
}


export async function updateAdminReviewStatus(
  token: string,
  reviewId: string,
  isActive: boolean,
): Promise<AdminReview> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/reviews/${encodeURIComponent(
        reviewId,
      )}/status`,
      {
        method:
          "PATCH",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            is_active:
              isActive,
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
        "Unable to update review visibility.",
      ),
      response.status,
    );
  }


  return data as AdminReview;
}


/* ============================================================
   ADMIN AI SESSIONS
============================================================ */

export type AdminAISessionStatus =
  | "waiting_for_user"
  | "analysis_ready"
  | "closed";


export type AdminAISafetyLevel =
  | "normal"
  | "caution"
  | "urgent";


export type AdminAIRelevanceLevel =
  | "high"
  | "medium"
  | "low";


export type AdminAIMessage = {
  role:
    | "user"
    | "assistant";

  content: string;

  created_at: string;
};


export type AdminAIPossibleCause = {
  cause: string;

  explanation: string;

  relevance:
    AdminAIRelevanceLevel;
};


export type AdminAIComponent = {
  component_key: string;

  label: string;

  catalog_key: string;

  hotspot_key: string;

  relevance:
    AdminAIRelevanceLevel;

  explanation: string;
};


export type AdminAITurn = {
  response_type:
    | "follow_up"
    | "analysis";

  assistant_message: string;

  follow_up_question:
    string | null;

  possible_causes:
    AdminAIPossibleCause[];

  components:
    AdminAIComponent[];

  safety: {
    level:
      AdminAISafetyLevel;

    message:
      string;
  };
};


export type AdminAISession = {
  id: string;

  user_id: string;

  customer_name: string;
  customer_email: string;

  vehicle_id: string;

  vehicle_year:
    number | null;

  vehicle_make: string;
  vehicle_model: string;

  vehicle_engine:
    string | null;

  vehicle_transmission:
    string | null;

  vehicle_nickname:
    string | null;

  status:
    AdminAISessionStatus;

  messages:
    AdminAIMessage[];

  latest_turn:
    AdminAITurn | null;

  message_count: number;

  safety_level:
    AdminAISafetyLevel | null;

  created_at: string;
  updated_at: string;
};


export async function getAdminAISessions(
  token: string,
): Promise<AdminAISession[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/ai-sessions`,
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
        "Unable to load AI sessions.",
      ),
      response.status,
    );
  }


  return data as AdminAISession[];
}


export async function getAdminAISession(
  token: string,
  sessionId: string,
): Promise<AdminAISession> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/ai-sessions/${encodeURIComponent(
        sessionId,
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
        "Unable to load AI session.",
      ),
      response.status,
    );
  }


  return data as AdminAISession;
}


/* ============================================================
   ADMIN NOTIFICATIONS
============================================================ */

export type AdminNotificationCategory =
  | "general"
  | "promotion"
  | "account";


export type AdminNotificationSource =
  | "admin"
  | "system";


export type AdminNotification = {
  id: string;

  user_id: string;

  recipient_name: string;
  recipient_email: string;

  category:
    AdminNotificationCategory;

  title: string;
  message: string;

  link: string | null;

  source:
    AdminNotificationSource;

  is_read: boolean;
  read_at: string | null;

  created_by_admin_id:
    string | null;

  created_at: string;
};


export type AdminNotificationCreatePayload = {
  audience:
    | "user"
    | "all_customers";

  user_id?: string;

  category:
    AdminNotificationCategory;

  title: string;
  message: string;

  link?: string | null;
};


export async function getAdminNotifications(
  token: string,
): Promise<AdminNotification[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/notifications`,
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
        "Unable to load notifications.",
      ),
      response.status,
    );
  }


  return data as AdminNotification[];
}


export async function createAdminNotification(
  token: string,
  payload:
    AdminNotificationCreatePayload,
): Promise<AdminNotification[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/admin/notifications`,
      {
        method:
          "POST",

        headers: {
          ...authHeaders(
            token,
          ),

          "Content-Type":
            "application/json",
        },

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
        "Unable to send notification.",
      ),
      response.status,
    );
  }


  return data as AdminNotification[];
}

