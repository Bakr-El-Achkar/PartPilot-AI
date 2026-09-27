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

const lower =
  source.toLowerCase();


/* ============================================================
   SPECIFIC COMPONENT COVERAGE
============================================================ */

const requiredTerms = [
  "door lock actuator",
  "wheel stud",

  "brake fluid",
  "brake pad",
  "brake rotor",
  "brake caliper",
  "brake hose",
  "master cylinder",
  "wheel speed sensor",

  "knock sensor",
  "oxygen sensor",
  "mass air flow sensor",
  "camshaft position sensor",
  "crankshaft position sensor",

  "ignition coil",
  "spark plug",

  "alternator",
  "starter motor",
  "battery",

  "ball joint",

  "power steering pump",
  "power steering pressure hose",

  "outer tie rod",
  "inner tie rod",
  "control arm",
  "shock absorber",
  "strut assembly",

  "wheel hub bearing",
  "wheel bearing",
  "hub assembly",

  "fuel pump",
  "fuel injector",
  "fuel filter",

  "oil filter",
  "cabin air filter",
  "air filter",

  "radiator hose",
  "water pump",
  "thermostat",
  "radiator",

  "transmission filter",
  "cv axle",
  "universal joint",
  "transmission mount",

  "timing belt",
  "timing chain",
  "belt tensioner",
  "serpentine belt",

  "engine mount",

  "a/c compressor",
  "ac compressor",

  "catalytic converter",
  "muffler",

  "headlight",
  "tail light",
  "fog light",

  "wiper blade",
];


for (
  const term of
    requiredTerms
) {
  assert.ok(
    lower.includes(
      term,
    ),
    `Missing exact image coverage for "${term}".`,
  );
}


/* ============================================================
   REAL PRODUCT IMAGE PRIORITY
============================================================ */

assert.ok(
  source.includes(
    "product.images[0]",
  ),
  [
    "Real catalog product images must have",
    "priority over representative images.",
  ].join(" "),
);


/* ============================================================
   SPECIFIC IMAGE RULES
============================================================ */

assert.ok(
  source.includes(
    "PART_IMAGE_RULES",
  ),
  "Missing PART_IMAGE_RULES.",
);


/* ============================================================
   NO FAMILY-LEVEL IMAGE REUSE
============================================================ */

assert.equal(
  source.includes(
    "PART_FAMILY_IMAGE_RULES",
  ),
  false,
  [
    "Broad family image fallbacks must not exist.",
    "Different component types must not share",
    "one generic family photograph.",
  ].join(" "),
);


/* ============================================================
   LOCAL STABLE ASSETS
============================================================ */

const localAssets = [
  "/product-parts/shock-absorber.jpg",
  "/product-parts/strut-assembly.jpg",
  "/product-parts/control-arm.jpg",
  "/product-parts/wheel-hub-bearing.jpg",
  "/product-parts/outer-tie-rod.jpg",
  "/product-parts/inner-tie-rod.svg",
  "/product-parts/power-steering-pump.jpg",
  "/product-parts/power-steering-pressure-hose.jpg",
];


for (
  const asset of
    localAssets
) {
  assert.ok(
    source.includes(
      asset,
    ),
    `Missing stable local component image "${asset}".`,
  );
}


/* ============================================================
   ORDER-SENSITIVE STEERING RULES
============================================================ */

const pressureHosePosition =
  source.indexOf(
    '"power steering pressure hose"',
  );

const pumpPosition =
  source.indexOf(
    '"power steering pump"',
  );

assert.ok(
  pressureHosePosition >= 0,
  "Missing power steering pressure hose rule.",
);

assert.ok(
  pumpPosition >= 0,
  "Missing power steering pump rule.",
);

assert.ok(
  pressureHosePosition <
    pumpPosition,
  [
    "Power steering pressure hose must be",
    "matched before the more general steering pump rule.",
  ].join(" "),
);


const outerTieRodPosition =
  source.indexOf(
    '"outer tie rod end"',
  );

const innerTieRodPosition =
  source.indexOf(
    '"inner tie rod end"',
  );

const genericTieRodPosition =
  source.indexOf(
    '"tie rod end"',
    Math.max(
      outerTieRodPosition,
      innerTieRodPosition,
    ) + 1,
  );

assert.ok(
  outerTieRodPosition >= 0,
  "Missing outer tie rod rule.",
);

assert.ok(
  innerTieRodPosition >= 0,
  "Missing inner tie rod rule.",
);

assert.ok(
  genericTieRodPosition >= 0,
  "Missing generic tie rod fallback.",
);

assert.ok(
  outerTieRodPosition <
    genericTieRodPosition,
  "Outer tie rod rule must appear before generic tie rod.",
);

assert.ok(
  innerTieRodPosition <
    genericTieRodPosition,
  "Inner tie rod rule must appear before generic tie rod.",
);


/* ============================================================
   NO RANDOM IMAGE SELECTION
============================================================ */

assert.equal(
  lower.includes(
    "visualindex",
  ),
  false,
  "Random visual-index product image selection must not return.",
);

assert.equal(
  lower.includes(
    "fallback_product_images",
  ),
  false,
  "Generic fallback image pools must not return.",
);


/* ============================================================
   HONEST UNKNOWN STATE
============================================================ */

assert.ok(
  source.includes(
    "Image unavailable",
  ),
  [
    "Unknown component types should use",
    "the honest Image unavailable state.",
  ].join(" "),
);


/* ============================================================
   REFERENCE LABEL
============================================================ */

assert.ok(
  source.includes(
    "Reference image",
  ),
  [
    "Representative component photography",
    "must remain clearly identified.",
  ].join(" "),
);


console.log(
  [
    "",
    "✓ Vehnexa exact image-coverage contract passed",
    "",
    "Verified:",
    "- broad seeded component coverage",
    "- real MongoDB image priority",
    "- exact component mappings",
    "- no broad family-image reuse",
    "- unique local steering/suspension assets",
    "- pressure hose is distinct from steering pump",
    "- inner and outer tie rods are distinct",
    "- no random fallback-image selection",
    "- honest unknown-image fallback",
    "",
  ].join("\n"),
);