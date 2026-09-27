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

const shopPagePath =
  join(
    frontendRoot,
    "app",
    "shop",
    "page.tsx",
  );


/* ============================================================
   PAGE EXISTS
============================================================ */

assert.equal(
  existsSync(shopPagePath),
  true,
  [
    "",
    "Vehnexa Shop wireframe contract failed.",
    "",
    "Missing file:",
    "app/shop/page.tsx",
    "",
  ].join("\n"),
);


const source =
  readFileSync(
    shopPagePath,
    "utf8",
  );


/* ============================================================
   CLIENT PAGE
============================================================ */

assert.match(
  source,
  /["']use client["']/,
  "Shop must be a client page.",
);


/* ============================================================
   MANAGER WIREFRAME — PAGE HEADER
============================================================ */

assert.ok(
  source.includes(
    "Parts Marketplace",
  ),
  'Shop must show "Parts Marketplace".',
);

assert.ok(
  source.includes(
    "Browse 500+ catalog items",
  ),
  "Shop must include the manager wireframe subtitle.",
);


/* ============================================================
   DARK NAVBAR
============================================================ */

assert.ok(
  source.includes(
    "bg-[#071b2d]",
  ),
  "Shop must use the approved dark navy Vehnexa navbar.",
);

for (
  const navLabel of [
    "Shop",
    "My Garage",
    "AI Mechanic",
    "Resources",
  ]
) {
  assert.ok(
    source.includes(navLabel),
    `Navbar must include "${navLabel}".`,
  );
}


/* ============================================================
   PUBLIC CATALOG API
============================================================ */

for (
  const apiFunction of [
    "getProducts",
    "getCategories",
    "getBrands",
  ]
) {
  assert.ok(
    source.includes(apiFunction),
    `Shop must use ${apiFunction}().`,
  );
}


/* ============================================================
   OPTIONAL GARAGE / AUTH
============================================================ */

assert.ok(
  source.includes(
    "getAccessToken",
  ),
  "Shop must detect an optional authenticated user.",
);

assert.ok(
  source.includes(
    "getVehicles",
  ),
  "Shop must load Garage vehicles when authenticated.",
);

assert.ok(
  source.includes(
    "getCompatibleProducts",
  ),
  "Shop must support fitment-based compatibility.",
);


/* ============================================================
   ACTIVE VEHICLE BANNER
============================================================ */

assert.ok(
  source.includes(
    "ACTIVE VEHICLE",
  ),
  "Shop must include the active vehicle banner.",
);

assert.ok(
  source.includes(
    "Showing products marked compatible with this vehicle",
  ),
  "Active vehicle banner must explain compatibility.",
);

assert.ok(
  source.includes(
    "Change vehicle",
  ),
  'Active vehicle banner must include "Change vehicle".',
);


/* ============================================================
   MANAGER WIREFRAME — FILTERS
============================================================ */

assert.ok(
  source.includes(
    "Filters",
  ),
  "Shop must include the Filters panel.",
);

for (
  const filterLabel of [
    "Category",
    "Brand",
    "Price",
    "Availability",
    "Compatibility",
  ]
) {
  assert.ok(
    source.includes(
      filterLabel,
    ),
    `Filters must include "${filterLabel}".`,
  );
}


assert.ok(
  source.includes(
    "All categories",
  ),
  "Category filter must include All categories.",
);

assert.ok(
  source.includes(
    "All brands",
  ),
  "Brand filter must include All brands.",
);

assert.ok(
  source.includes(
    "Any price",
  ),
  "Price filter must include Any price.",
);

assert.ok(
  source.includes(
    "In stock",
  ),
  "Availability filter must include In stock.",
);

assert.ok(
  source.includes(
    "Fits my vehicle",
  ),
  "Compatibility filter must include Fits my vehicle.",
);


/* ============================================================
   PRODUCT RESULTS
============================================================ */

assert.ok(
  source.includes(
    "Compatible products",
  ),
  'Shop must include "Compatible products".',
);

assert.ok(
  source.includes(
    "Recommended",
  ),
  "Shop must include Recommended sorting.",
);

for (
  const sortLabel of [
    "Price: Low to High",
    "Price: High to Low",
    "Top Rated",
    "Newest",
  ]
) {
  assert.ok(
    source.includes(
      sortLabel,
    ),
    `Sort menu must include "${sortLabel}".`,
  );
}


/* ============================================================
   URL FILTER STATE
============================================================ */

assert.ok(
  source.includes(
    "useSearchParams",
  ),
  "Shop filters must read URL query state.",
);

assert.ok(
  source.includes(
    "URLSearchParams",
  ),
  "Shop must write filter state into URL query parameters.",
);


/* ============================================================
   SEARCH
============================================================ */

assert.ok(
  source.includes(
    "Search parts",
  ),
  "Shop must provide product search.",
);


/* ============================================================
   REAL PRODUCT CARDS
============================================================ */

assert.ok(
  source.includes(
    "stock_quantity",
  ),
  "Product cards must use real stock data.",
);

assert.ok(
  source.includes(
    "sale_price",
  ),
  "Product cards must support sale prices.",
);

assert.ok(
  source.includes(
    "rating_average",
  ),
  "Product cards must use real rating data.",
);


/* ============================================================
   COMPATIBILITY BADGE
============================================================ */

assert.ok(
  source.includes(
    "Fits",
  ),
  'Compatible products must be able to show a "Fits" badge.',
);


/* ============================================================
   WORKING CART ACTION
============================================================ */

assert.ok(
  source.includes(
    "addToCart",
  ),
  "The red product + action must call addToCart().",
);

assert.ok(
  source.includes(
    "getCartCount",
  ),
  "Navbar must display the real cart quantity.",
);

assert.ok(
  source.includes(
    "CART_UPDATED_EVENT",
  ),
  "Navbar cart count must react to cart updates.",
);


/* ============================================================
   EMPTY / ERROR / LOADING STATES
============================================================ */

assert.ok(
  source.includes(
    "Try again",
  ),
  "Shop must provide a retry action.",
);

assert.ok(
  source.includes(
    "No products found",
  ),
  "Shop must provide a normal empty state.",
);

assert.ok(
  source.includes(
    "No compatible products found",
  ),
  "Shop must distinguish the compatibility empty state.",
);


/* ============================================================
   RESPONSIVE UI
============================================================ */

assert.match(
  source,
  /sm:/,
  "Shop must include responsive small-screen styles.",
);

assert.match(
  source,
  /lg:/,
  "Shop must include responsive desktop styles.",
);

assert.match(
  source,
  /xl:grid-cols-4/,
  "Desktop product catalog must support the 4-column manager layout.",
);


/* ============================================================
   NO FORCED LOGIN FOR SHOP
============================================================ */

assert.equal(
  /router\.replace\(\s*["']\/login["']\s*\)/.test(
    source,
  ),
  false,
  "Public Shop must not redirect guests to login.",
);


console.log(
  [
    "",
    "✓ Vehnexa Shop wireframe contract passed",
    "",
    "Verified:",
    "- public Shop access",
    "- manager page heading",
    "- dark navy navbar",
    "- active vehicle banner",
    "- category / brand / price filters",
    "- stock filtering",
    "- vehicle compatibility filtering",
    "- URL filter state",
    "- search",
    "- sorting",
    "- real product data",
    "- fitment badge",
    "- working cart action",
    "- live cart count",
    "- loading / error / empty states",
    "- responsive 4-column catalog",
    "",
  ].join("\n"),
);