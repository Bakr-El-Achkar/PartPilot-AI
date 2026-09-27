import type {
  Product,
} from "@/lib/products";


const CART_STORAGE_KEY =
  "vehnexa_cart";

export const CART_UPDATED_EVENT =
  "vehnexa-cart-updated";


/* ============================================================
   CART ITEM
============================================================ */

export type CartItem = {
  product_id: string;
  name: string;
  slug: string;
  sku: string;
  brand_id: string;
  category_id: string;
  image_url: string | null;

  price: number;
  sale_price: number | null;

  stock_quantity: number;
  quantity: number;
};


/* ============================================================
   BROWSER GUARD
============================================================ */

function canUseStorage(): boolean {
  return (
    typeof window !==
    "undefined"
  );
}


/* ============================================================
   READ CART
============================================================ */

export function getCartItems(): CartItem[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(
        CART_STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (
        item,
      ): item is CartItem => {
        if (
          typeof item !==
            "object" ||
          item === null
        ) {
          return false;
        }

        const candidate =
          item as Partial<CartItem>;

        return (
          typeof candidate.product_id ===
            "string" &&
          typeof candidate.name ===
            "string" &&
          typeof candidate.quantity ===
            "number" &&
          typeof candidate.stock_quantity ===
            "number"
        );
      },
    );
  } catch {
    return [];
  }
}


/* ============================================================
   WRITE CART
============================================================ */

function saveCartItems(
  items: CartItem[],
): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(items),
  );

  window.dispatchEvent(
    new Event(
      CART_UPDATED_EVENT,
    ),
  );
}


/* ============================================================
   PRODUCT → CART ITEM
============================================================ */

function productToCartItem(
  product: Product,
  quantity: number,
): CartItem {
  return {
    product_id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,

    brand_id:
      product.brand_id,

    category_id:
      product.category_id,

    image_url:
      product.images[0] ??
      null,

    price: product.price,

    sale_price:
      product.sale_price,

    stock_quantity:
      product.stock_quantity,

    quantity,
  };
}


/* ============================================================
   ADD TO CART
============================================================ */

export function addToCart(
  product: Product,
  quantity = 1,
): CartItem[] {
  const items =
    getCartItems();

  if (
    product.stock_quantity <=
    0
  ) {
    return items;
  }

  const safeRequestedQuantity =
    Math.max(
      1,
      Math.floor(quantity),
    );

  const existingIndex =
    items.findIndex(
      (item) =>
        item.product_id ===
        product.id,
    );

  if (existingIndex >= 0) {
    const existing =
      items[existingIndex];

    const updatedQuantity =
      Math.min(
        existing.quantity +
          safeRequestedQuantity,
        product.stock_quantity,
      );

    items[existingIndex] = {
      ...existing,

      name: product.name,
      slug: product.slug,
      sku: product.sku,

      brand_id:
        product.brand_id,

      category_id:
        product.category_id,

      image_url:
        product.images[0] ??
        null,

      price:
        product.price,

      sale_price:
        product.sale_price,

      stock_quantity:
        product.stock_quantity,

      quantity:
        updatedQuantity,
    };
  } else {
    const initialQuantity =
      Math.min(
        safeRequestedQuantity,
        product.stock_quantity,
      );

    items.push(
      productToCartItem(
        product,
        initialQuantity,
      ),
    );
  }

  saveCartItems(items);

  return items;
}


/* ============================================================
   UPDATE QUANTITY
============================================================ */

export function updateCartQuantity(
  productId: string,
  quantity: number,
): CartItem[] {
  const items =
    getCartItems();

  const index =
    items.findIndex(
      (item) =>
        item.product_id ===
        productId,
    );

  if (index < 0) {
    return items;
  }

  if (quantity <= 0) {
    const filtered =
      items.filter(
        (item) =>
          item.product_id !==
          productId,
      );

    saveCartItems(filtered);

    return filtered;
  }

  const item =
    items[index];

  const safeQuantity =
    Math.min(
      Math.max(
        1,
        Math.floor(quantity),
      ),
      item.stock_quantity,
    );

  items[index] = {
    ...item,
    quantity:
      safeQuantity,
  };

  saveCartItems(items);

  return items;
}


/* ============================================================
   REMOVE ITEM
============================================================ */

export function removeFromCart(
  productId: string,
): CartItem[] {
  const items =
    getCartItems().filter(
      (item) =>
        item.product_id !==
        productId,
    );

  saveCartItems(items);

  return items;
}


/* ============================================================
   CLEAR CART
============================================================ */

export function clearCart(): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(
      CART_STORAGE_KEY,
    );
  } catch {
    // The checkout can still finish when storage is unavailable.
  }

  window.dispatchEvent(
    new Event(
      CART_UPDATED_EVENT,
    ),
  );
}


/* ============================================================
   CART COUNT

   Counts quantities, not just distinct products.

   Example:
   Brake Pads × 2
   Oil Filter × 1

   count = 3
============================================================ */

export function getCartCount(): number {
  return getCartItems().reduce(
    (
      total,
      item,
    ) =>
      total +
      item.quantity,
    0,
  );
}


/* ============================================================
   CART SUBTOTAL
============================================================ */

export function getCartSubtotal(): number {
  return getCartItems().reduce(
    (
      total,
      item,
    ) => {
      const unitPrice =
        item.sale_price ??
        item.price;

      return (
        total +
        unitPrice *
          item.quantity
      );
    },
    0,
  );
}
