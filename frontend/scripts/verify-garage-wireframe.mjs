import fs from "node:fs";
import assert from "node:assert/strict";

const pagePath = "app/account/garage/page.tsx";

assert.equal(
  fs.existsSync(pagePath),
  true,
  "app/account/garage/page.tsx does not exist",
);

const page = fs.readFileSync(pagePath, "utf8");

/*
 * Vehnexa branding
 */

assert.match(
  page,
  /Vehnexa/,
  "Vehnexa branding is missing",
);

assert.match(
  page,
  /bg-\[#071b2d\]/,
  "Dark navy Vehnexa navbar is missing",
);

/*
 * Screen 05 structure
 */

assert.match(page, /My Garage/);

assert.match(
  page,
  /Recommended for Your\s+Vehicles/,
);

assert.match(page, /View Details/);
assert.match(page, /Find Parts/);
assert.match(page, /Add Vehicle|Add vehicle/);

/*
 * Existing functionality
 */

assert.match(page, /getVehicles/);
assert.match(page, /setActiveVehicle/);
assert.match(page, /deleteVehicle/);
assert.match(page, /getAccessToken/);

/*
 * POLISH PASS
 *
 * Vehicle card should be more compact.
 */

assert.match(
  page,
  /h-\[125px\]/,
  "Vehicle image area has not been reduced to the compact wireframe height",
);

/*
 * Recommended area should no longer be
 * one giant empty placeholder.
 */

assert.equal(
  page.includes("min-h-[190px]"),
  false,
  "Large recommendation placeholder still exists",
);

assert.match(
  page,
  /RecommendationSkeletonCard/,
  "Compact recommendation skeleton cards are missing",
);

assert.match(
  page,
  /xl:grid-cols-3/,
  "Recommended products should use the three-card wireframe layout",
);

/*
 * We still must not fabricate product data.
 */

assert.equal(
  page.includes("Brake Pads (Front)"),
  false,
  "Fake recommendation product data was added",
);

assert.equal(
  page.includes("Oil Filter"),
  false,
  "Fake recommendation product data was added",
);

console.log(
  "Vehnexa My Garage polished wireframe contract passed.",
);