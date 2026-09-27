import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const productsPath = path.join(
  root,
  "lib",
  "products.ts",
);

const detailPath = path.join(
  root,
  "app",
  "product",
  "[slug]",
  "page.tsx",
);

const shopPath = path.join(
  root,
  "app",
  "shop",
  "page.tsx",
);

assert.equal(
  fs.existsSync(productsPath),
  true,
  "lib/products.ts must exist.",
);

assert.equal(
  fs.existsSync(detailPath),
  true,
  "Product Detail page must exist at app/product/[slug]/page.tsx.",
);

assert.equal(
  fs.existsSync(shopPath),
  true,
  "Shop page must exist.",
);

const productsSource =
  fs.readFileSync(
    productsPath,
    "utf8",
  );

const detailSource =
  fs.readFileSync(
    detailPath,
    "utf8",
  );

const shopSource =
  fs.readFileSync(
    shopPath,
    "utf8",
  );

assert.match(
  productsSource,
  /getProductBySlug/,
  "Product API client must expose getProductBySlug.",
);

assert.match(
  productsSource,
  /\/api\/products\/slug\//,
  "Product API client must call the slug endpoint.",
);

assert.match(
  detailSource,
  /Vehnexa/i,
  "Product Detail must use Vehnexa branding.",
);

assert.match(
  detailSource,
  /bg-\[#071b2d\]/,
  "Product Detail must use the dark navy Vehnexa navbar.",
);

assert.match(
  detailSource,
  /Overview/,
  "Product Detail must include Overview.",
);

assert.match(
  detailSource,
  /Specifications/,
  "Product Detail must include Specifications.",
);

assert.match(
  detailSource,
  /Fitment/,
  "Product Detail must include Fitment.",
);

assert.match(
  detailSource,
  /Add to cart/i,
  "Product Detail must include Add to cart.",
);

assert.match(
  detailSource,
  /warranty/i,
  "Product Detail must display warranty information.",
);

assert.match(
  detailSource,
  /part number/i,
  "Product Detail must display the part number.",
);

assert.match(
  detailSource,
  /getProductBySlug/,
  "Product Detail must load the real product by slug.",
);

assert.match(
  detailSource,
  /getVehicles/,
  "Product Detail must load Garage vehicle context.",
);

assert.match(
  detailSource,
  /getCompatibleProducts/,
  "Compatibility must come from the backend compatibility endpoint.",
);

assert.match(
  detailSource,
  /addToCart/,
  "Product Detail must use the existing cart helper.",
);

assert.match(
  detailSource,
  /not OEM-certified/i,
  "Product Detail must retain the demo-fitment disclaimer.",
);

assert.match(
  shopSource,
  /\/product\//,
  "Shop cards must link to Product Detail.",
);

assert.match(
  shopSource,
  /product\.slug/,
  "Shop Product Detail links must use product.slug.",
);

console.log(
  "Vehnexa Product Detail contract passed.",
);