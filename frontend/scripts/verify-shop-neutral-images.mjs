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

const frontendRoot =
  join(
    dirname(currentFile),
    "..",
  );

const shopPagePath =
  join(
    frontendRoot,
    "app",
    "shop",
    "page.tsx",
  );

const source =
  readFileSync(
    shopPagePath,
    "utf8",
  );


/* ============================================================
   REQUIRED LOCAL BRAKE ASSETS
============================================================ */

const requiredBrakeAssets = [
  "/product-parts/brake-pad.svg",
  "/product-parts/brake-rotor.svg",
  "/product-parts/brake-caliper.svg",
  "/product-parts/abs-wheel-speed-sensor.svg",
  "/product-parts/brake-hose.svg",
  "/product-parts/brake-fluid.svg",
  "/product-parts/brake-master-cylinder.svg",
];

for (
  const asset of
    requiredBrakeAssets
) {
  assert.ok(
    source.includes(
      asset,
    ),
    `Missing local neutral brake image mapping: ${asset}`,
  );

  const actualFile =
    join(
      frontendRoot,
      "public",
      asset.replace(
        "/product-parts/",
        "product-parts/",
      ),
    );

  assert.ok(
    existsSync(
      actualFile,
    ),
    `Local brake image file does not exist: ${actualFile}`,
  );
}


/* ============================================================
   INSPECT ONLY THE BRAKE RULE SECTION
============================================================ */

const brakeStart =
  source.indexOf(
    "BRAKES",
  );

const sensorStart =
  source.indexOf(
    "SENSORS",
    brakeStart,
  );

assert.ok(
  brakeStart >= 0,
  "Could not find BRAKES image-rule section.",
);

assert.ok(
  sensorStart >
    brakeStart,
  "Could not determine the end of the BRAKES section.",
);

const brakeSection =
  source.slice(
    brakeStart,
    sensorStart,
  );


/* ============================================================
   BRAKE FALLBACKS MUST NOT USE EXTERNAL RETAILER IMAGES
============================================================ */

assert.equal(
  brakeSection.includes(
    "https://",
  ),
  false,
  "Brake reference images must be local, not remote URLs.",
);

assert.equal(
  brakeSection.includes(
    "http://",
  ),
  false,
  "Brake reference images must be local, not remote URLs.",
);


/* ============================================================
   REAL PRODUCT IMAGE STILL WINS
============================================================ */

assert.ok(
  source.includes(
    "product.images[0]",
  ),
  "Real catalog product images must remain highest priority.",
);


/* ============================================================
   HONEST REFERENCE LABEL
============================================================ */

assert.ok(
  source.includes(
    "Reference image",
  ),
  "Representative images must remain labelled as reference images.",
);


console.log(
  [
    "",
    "✓ Vehnexa neutral brake-image contract passed",
    "",
    "Verified:",
    "- brake pad uses local neutral asset",
    "- brake rotor uses local neutral asset",
    "- brake caliper uses local neutral asset",
    "- ABS sensor uses local neutral asset",
    "- brake hose uses local neutral asset",
    "- brake fluid uses local neutral asset",
    "- master cylinder uses local neutral asset",
    "- brake fallbacks do not depend on retailer URLs",
    "- all referenced local assets physically exist",
    "- real product images still have priority",
    "",
  ].join("\n"),
);