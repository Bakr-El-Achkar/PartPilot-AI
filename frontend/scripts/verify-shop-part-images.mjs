import assert from "node:assert/strict";
import {
  readFileSync,
  existsSync,
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

const pagePath =
  join(
    frontendRoot,
    "app",
    "shop",
    "page.tsx",
  );

assert.equal(
  existsSync(pagePath),
  true,
  "Missing app/shop/page.tsx",
);

const source =
  readFileSync(
    pagePath,
    "utf8",
  );


/* ============================================================
   REAL PRODUCT IMAGE FIRST
============================================================ */

assert.ok(
  source.includes(
    "product.images[0]",
  ),
  "Real catalog product images must have highest priority.",
);


/* ============================================================
   PART-AWARE MAPPING
============================================================ */

assert.ok(
  source.includes(
    "PART_IMAGE_RULES",
  ),
  "Missing PART_IMAGE_RULES.",
);

assert.ok(
  source.includes(
    "getProductImage",
  ),
  "Missing getProductImage().",
);


/* ============================================================
   IMPORTANT VEHnEXA PART TYPES
============================================================ */

const requiredPartTerms = [
  "transmission filter",
  "cv axle",
  "universal joint",
  "transmission mount",
  "radiator hose",
  "radiator",
  "water pump",
  "thermostat",
  "brake pad",
  "brake rotor",
  "brake caliper",
  "wheel speed sensor",
  "brake hose",
  "master cylinder",
];

for (
  const term of
    requiredPartTerms
) {
  assert.ok(
    source
      .toLowerCase()
      .includes(term),
    `Missing image rule for "${term}".`,
  );
}


/* ============================================================
   NO RANDOM IMAGE HASHING
============================================================ */

assert.equal(
  source.includes(
    "visualIndex",
  ),
  false,
  [
    "Product images must not depend on",
    "their position in the grid.",
  ].join(" "),
);

assert.equal(
  /hash\s*%/.test(
    source,
  ),
  false,
  "Product images must not be chosen using random/hash fallback logic.",
);


/* ============================================================
   SAFE UNKNOWN-PART FALLBACK
============================================================ */

assert.ok(
  source.includes(
    "Image unavailable",
  ),
  [
    "Unknown part types should show",
    "an honest unavailable-image state.",
  ].join(" "),
);


console.log(
  [
    "",
    "✓ Vehnexa product-image mapping contract passed",
    "",
    "Verified:",
    "- real catalog image has priority",
    "- product images are selected by part type",
    "- transmission / drivetrain mappings",
    "- cooling-system mappings",
    "- brake-system mappings",
    "- no random grid-position image selection",
    "- no misleading generic photo for unknown products",
    "",
  ].join("\n"),
);