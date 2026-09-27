import assert from "node:assert/strict";
import {
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

const shopPath =
  join(
    frontendRoot,
    "app",
    "shop",
    "page.tsx",
  );

const garagePath =
  join(
    frontendRoot,
    "app",
    "account",
    "garage",
    "page.tsx",
  );

const shopSource =
  readFileSync(
    shopPath,
    "utf8",
  );

const garageSource =
  readFileSync(
    garagePath,
    "utf8",
  );


/* ============================================================
   DEFAULT FITMENT BEHAVIOR
============================================================ */

assert.ok(
  shopSource.includes(
    'searchParams.get("fits")',
  ),
  "Shop must read the fits preference from the URL.",
);

assert.match(
  shopSource,
  /fitsParam\s*!==\s*"false"/,
  [
    "When a vehicle exists and the URL does not explicitly say",
    "fits=false, compatibility should default to ON.",
  ].join(" "),
);


/* ============================================================
   USER CAN EXPLICITLY TURN COMPATIBILITY OFF
============================================================ */

assert.ok(
  shopSource.includes(
    'checked ? "true" : "false"',
  ),
  [
    "Unchecking Fits my vehicle must persist fits=false.",
    "Removing the parameter would immediately turn the",
    "default compatibility behavior back on.",
  ].join(" "),
);


/* ============================================================
   HEADING MUST MATCH THE ACTUAL FILTER STATE
============================================================ */

assert.ok(
  shopSource.includes(
    'fitsOnly ? "Compatible products" : "All products"',
  ),
  [
    "The product-list heading must say Compatible products",
    "only while compatibility filtering is active.",
  ].join(" "),
);


/* ============================================================
   VEHICLE BANNER MUST MATCH FILTER STATE
============================================================ */

assert.ok(
  shopSource.includes(
    "filteringCompatible",
  ),
  [
    "VehicleBanner must know whether compatibility",
    "filtering is currently active.",
  ].join(" "),
);

assert.ok(
  shopSource.includes(
    "Showing products marked compatible with this vehicle",
  ),
  "Compatibility-on banner text is missing.",
);

assert.ok(
  shopSource.includes(
    "Compatibility filter is currently off",
  ),
  "Compatibility-off banner text is missing.",
);


/* ============================================================
   GARAGE LINKS MUST EXPLICITLY REQUEST COMPATIBILITY
============================================================ */

assert.match(
  garageSource,
  /\/shop\?vehicleId=\$\{vehicle\.id\}&fits=true/,
  "Garage Find Parts link must include fits=true.",
);

assert.match(
  garageSource,
  /\/shop\?vehicleId=\$\{activeVehicle\.id\}&fits=true/,
  "Browse Compatible Parts link must include fits=true.",
);


console.log(
  [
    "",
    "✓ Vehnexa default vehicle-fitment contract passed",
    "",
    "Verified:",
    "- active vehicle defaults compatibility filtering ON",
    "- fits=false can explicitly disable compatibility",
    "- product heading reflects real filter state",
    "- vehicle banner reflects real filter state",
    "- Garage Find Parts requests compatible products",
    "- Garage Browse Compatible Parts requests compatible products",
    "",
  ].join("\n"),
);