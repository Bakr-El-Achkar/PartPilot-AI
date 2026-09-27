import { ApiError } from "@/lib/api";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";


/* ============================================================
   PRODUCT TYPES
============================================================ */

export type Product = {
  id: string;
  name: string;
  slug: string;
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
  specifications: Record<
    string,
    unknown
  >;
  warranty: string | null;
  rating_average: number;
  review_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};


/* ============================================================
   CATEGORY TYPES
============================================================ */

export type CategorySubcategory = {
  name: string;
  slug: string;
  description?: string | null;
};


export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  subcategories: CategorySubcategory[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};


/* ============================================================
   BRAND TYPES
============================================================ */

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  country?: string | null;
  website?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};


/* ============================================================
   SORT
============================================================ */

export type ProductSort =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "newest";


/* ============================================================
   SHOP QUERY
============================================================ */

export type ProductQuery = {
  search?: string;
  category_id?: string;
  brand_id?: string;
  subcategory_slug?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort?: ProductSort;
};


/* ============================================================
   RESPONSE READER
============================================================ */

async function readResponse(
  response: Response,
) {
  if (response.status === 204) {
    return null;
  }

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


/* ============================================================
   PUBLIC JSON REQUEST
============================================================ */

async function getPublicJson<T>(
  url: string,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(
    url,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const data =
    await readResponse(
      response,
    );

  if (!response.ok) {
    throw new ApiError(
      data?.detail ??
        fallbackMessage,
      response.status,
    );
  }

  return data as T;
}


/* ============================================================
   GET PRODUCTS
============================================================ */

export async function getProducts(
  query: ProductQuery = {},
): Promise<Product[]> {
  const params =
    new URLSearchParams();

  if (
    query.search &&
    query.search.trim()
  ) {
    params.set(
      "search",
      query.search.trim(),
    );
  }

  if (query.category_id) {
    params.set(
      "category_id",
      query.category_id,
    );
  }

  if (query.brand_id) {
    params.set(
      "brand_id",
      query.brand_id,
    );
  }

  if (query.subcategory_slug) {
    params.set(
      "subcategory_slug",
      query.subcategory_slug,
    );
  }

  if (
    query.min_price !==
    undefined
  ) {
    params.set(
      "min_price",
      String(
        query.min_price,
      ),
    );
  }

  if (
    query.max_price !==
    undefined
  ) {
    params.set(
      "max_price",
      String(
        query.max_price,
      ),
    );
  }

  if (
    query.in_stock !==
    undefined
  ) {
    params.set(
      "in_stock",
      String(
        query.in_stock,
      ),
    );
  }

  if (query.sort) {
    params.set(
      "sort",
      query.sort,
    );
  }

  const queryString =
    params.toString();

  const url = queryString
    ? `${API_BASE_URL}/api/products?${queryString}`
    : `${API_BASE_URL}/api/products`;

  return getPublicJson<Product[]>(
    url,
    "Unable to load products.",
  );
}


/* ============================================================
   GET CATEGORIES
============================================================ */

export async function getCategories(): Promise<
  Category[]
> {
  return getPublicJson<
    Category[]
  >(
    `${API_BASE_URL}/api/catalog/categories`,
    "Unable to load categories.",
  );
}


/* ============================================================
   GET BRANDS
============================================================ */

export async function getBrands(): Promise<
  Brand[]
> {
  return getPublicJson<
    Brand[]
  >(
    `${API_BASE_URL}/api/catalog/brands`,
    "Unable to load brands.",
  );
}


/* ============================================================
   GET COMPATIBLE PRODUCTS
============================================================ */

export async function getCompatibleProducts(
  token: string,
  vehicleId: string,
): Promise<Product[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/fitments/compatible/${encodeURIComponent(
      vehicleId,
    )}`,
    {
      method: "GET",
      headers: {
        Accept:
          "application/json",
        Authorization:
          `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  const data =
    await readResponse(
      response,
    );

  if (!response.ok) {
    throw new ApiError(
      data?.detail ??
        "Unable to load compatible products.",
      response.status,
    );
  }

  return data as Product[];
}


/* ============================================================
   EFFECTIVE PRODUCT PRICE
============================================================ */

export function getEffectivePrice(
  product: Product,
): number {
  return (
    product.sale_price ??
    product.price
  );
}


export async function getProductBySlug(
  slug: string,
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/api/products/slug/${encodeURIComponent(
      slug,
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const contentType =
    response.headers.get(
      "content-type",
    );

  let data: unknown;

  if (
    contentType?.includes(
      "application/json",
    )
  ) {
    data =
      await response.json();
  } else {
    const text =
      await response.text();

    data = {
      detail:
        text ||
        "Unexpected server response.",
    };
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof (
        data as {
          detail?: unknown;
        }
      ).detail === "string"
        ? (
            data as {
              detail: string;
            }
          ).detail
        : "Unable to load product.";

    throw new ApiError(
      message,
      response.status,
    );
  }

  return data as Product;
}