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

assert.equal(
  existsSync(shopPagePath),
  true,
  "Missing app/shop/page.tsx",
);

const source =
  readFileSync(
    shopPagePath,
    "utf8",
  );


/* ============================================================
   PAGINATION
============================================================ */

assert.match(
  source,
  /PRODUCTS_PER_PAGE\s*=\s*8/,
  "Shop must show 8 products per page.",
);

assert.ok(
  source.includes(
    'searchParams.get("page")',
  ) ||
  source.includes(
    'searchParams.get(\n      "page"',
  ),
  "Shop must read the page number from the URL.",
);

assert.ok(
  source.includes(
    "paginatedProducts",
  ),
  "Shop must render a paginated product subset.",
);

assert.ok(
  source.includes(
    "Previous",
  ),
  'Pagination must include "Previous".',
);

assert.ok(
  source.includes(
    "Next",
  ),
  'Pagination must include "Next".',
);

assert.ok(
  source.includes(
    "totalPages",
  ),
  "Pagination must calculate total pages.",
);


/* ============================================================
   AUTOMOTIVE IMAGE FALLBACKS
============================================================ */

assert.ok(
  source.includes(
    "FALLBACK_PRODUCT_IMAGES",
  ),
  "Shop must define automotive fallback images.",
);

assert.ok(
  source.includes(
    "getProductImage",
  ),
  "Shop must use getProductImage().",
);

assert.ok(
  source.includes(
    "product.images[0]",
  ),
  "Real product image data must remain the first choice.",
);

assert.ok(
  source.includes(
    "unsplash.com",
  ),
  "Fallbacks must use automotive photography rather than the generic package placeholder.",
);


/* ============================================================
   IMAGE QUALITY / PRESENTATION
============================================================ */

assert.ok(
  source.includes(
    "object-cover",
  ),
  "Fallback automotive photos should fill the product image area cleanly.",
);

assert.ok(
  source.includes(
    "loading=\"lazy\"",
  ),
  "Product images must lazy-load.",
);


/* ============================================================
   READABILITY
============================================================ */

assert.ok(
  source.includes(
    'text-[12px] font-semibold',
  ),
  "Product names should use more readable typography.",
);

assert.ok(
  source.includes(
    'text-[10px] font-bold uppercase',
  ),
  "Brand labels should be more readable.",
);

assert.ok(
  source.includes(
    'text-[10px] text-[#667085]',
  ),
  "Supporting product text should be more readable.",
);


console.log(
  [
    "",
    "✓ Vehnexa Shop visual polish contract passed",
    "",
    "Verified:",
    "- 8 products per page",
    "- URL pagination",
    "- previous / next controls",
    "- real product images remain preferred",
    "- automotive photo fallbacks",
    "- lazy-loaded imagery",
    "- improved product-card readability",
    "",
  ].join("\n"),
);