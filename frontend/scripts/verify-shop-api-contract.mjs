import assert from "node:assert/strict";
import {
  existsSync,
  readFileSync,
} from "node:fs";
import {
  dirname,
  join,
} from "node:path";
import {
  fileURLToPath,
} from "node:url";


const currentFile =
  fileURLToPath(import.meta.url);

const currentDirectory =
  dirname(currentFile);

const frontendRoot =
  join(
    currentDirectory,
    "..",
  );

const productsPath =
  join(
    frontendRoot,
    "lib",
    "products.ts",
  );


/*
 * ============================================================
 * FILE MUST EXIST
 * ============================================================
 */

assert.equal(
  existsSync(productsPath),
  true,
  [
    "",
    "Shop API contract failed.",
    "",
    "Missing file:",
    "lib/products.ts",
    "",
    "The Shop frontend API layer has not been implemented yet.",
    "",
  ].join("\n"),
);


const source =
  readFileSync(
    productsPath,
    "utf8",
  );


/*
 * ============================================================
 * PRODUCT TYPE
 * ============================================================
 */

assert.match(
  source,
  /export\s+type\s+Product\s*=/,
  "lib/products.ts must export Product.",
);

assert.match(
  source,
  /sale_price\s*\??:/,
  "Product must expose sale_price.",
);

assert.match(
  source,
  /stock_quantity\s*:/,
  "Product must expose stock_quantity.",
);

assert.match(
  source,
  /rating_average\s*:/,
  "Product must expose rating_average.",
);

assert.match(
  source,
  /review_count\s*:/,
  "Product must expose review_count.",
);

assert.match(
  source,
  /images\s*:/,
  "Product must expose images.",
);


/*
 * ============================================================
 * CATALOG TYPES
 * ============================================================
 */

assert.match(
  source,
  /export\s+type\s+Category\s*=/,
  "lib/products.ts must export Category.",
);

assert.match(
  source,
  /export\s+type\s+Brand\s*=/,
  "lib/products.ts must export Brand.",
);


/*
 * ============================================================
 * SORT CONTRACT
 * ============================================================
 */

assert.match(
  source,
  /export\s+type\s+ProductSort\s*=/,
  "lib/products.ts must export ProductSort.",
);

for (
  const sortValue of [
    "recommended",
    "price_asc",
    "price_desc",
    "rating",
    "newest",
  ]
) {
  assert.ok(
    source.includes(
      `"${sortValue}"`,
    ),
    `ProductSort must include "${sortValue}".`,
  );
}


/*
 * ============================================================
 * SHOP QUERY TYPE
 * ============================================================
 */

assert.match(
  source,
  /export\s+type\s+ProductQuery\s*=/,
  "lib/products.ts must export ProductQuery.",
);

for (
  const queryField of [
    "search",
    "category_id",
    "brand_id",
    "subcategory_slug",
    "min_price",
    "max_price",
    "in_stock",
    "sort",
  ]
) {
  assert.ok(
    source.includes(
      queryField,
    ),
    `ProductQuery must support "${queryField}".`,
  );
}


/*
 * ============================================================
 * URL SEARCH PARAMS
 * ============================================================
 */

assert.match(
  source,
  /new\s+URLSearchParams/,
  "Product queries must use URLSearchParams.",
);


/*
 * ============================================================
 * PUBLIC PRODUCT CATALOG
 * ============================================================
 */

assert.match(
  source,
  /export\s+async\s+function\s+getProducts\s*\(/,
  "lib/products.ts must export getProducts().",
);

assert.ok(
  source.includes(
    "/api/products",
  ),
  "getProducts() must call /api/products.",
);


/*
 * ============================================================
 * CATEGORIES
 * ============================================================
 */

assert.match(
  source,
  /export\s+async\s+function\s+getCategories\s*\(/,
  "lib/products.ts must export getCategories().",
);

assert.ok(
  source.includes(
    "/api/catalog/categories",
  ),
  "getCategories() must call /api/catalog/categories.",
);


/*
 * ============================================================
 * BRANDS
 * ============================================================
 */

assert.match(
  source,
  /export\s+async\s+function\s+getBrands\s*\(/,
  "lib/products.ts must export getBrands().",
);

assert.ok(
  source.includes(
    "/api/catalog/brands",
  ),
  "getBrands() must call /api/catalog/brands.",
);


/*
 * ============================================================
 * VEHICLE COMPATIBILITY
 * ============================================================
 */

assert.match(
  source,
  /export\s+async\s+function\s+getCompatibleProducts\s*\(/,
  "lib/products.ts must export getCompatibleProducts().",
);

assert.ok(
  source.includes(
    "/api/fitments/compatible/",
  ),
  [
    "getCompatibleProducts() must use",
    "/api/fitments/compatible/{vehicleId}.",
  ].join(" "),
);

assert.match(
  source,
  /Authorization\s*:/,
  [
    "Compatible-product requests must",
    "send the JWT Authorization header.",
  ].join(" "),
);

assert.match(
  source,
  /Bearer\s+\$\{/,
  [
    "Compatible-product requests must",
    "use a Bearer token.",
  ].join(" "),
);


/*
 * ============================================================
 * API ERRORS
 * ============================================================
 */

assert.match(
  source,
  /ApiError/,
  "Shop API helpers must use the existing ApiError class.",
);


/*
 * ============================================================
 * CACHE BEHAVIOR
 * ============================================================
 */

assert.ok(
  source.includes(
    'cache: "no-store"',
  ),
  [
    "Shop catalog requests should use",
    'cache: "no-store".',
  ].join(" "),
);


console.log(
  [
    "",
    "✓ Vehnexa Shop API contract passed",
    "",
    "Verified:",
    "- Product types",
    "- Category and brand types",
    "- Search/filter query contract",
    "- Product sorting contract",
    "- Public product catalog API",
    "- Category API",
    "- Brand API",
    "- Authenticated compatibility API",
    "- JWT Authorization handling",
    "",
  ].join("\n"),
);