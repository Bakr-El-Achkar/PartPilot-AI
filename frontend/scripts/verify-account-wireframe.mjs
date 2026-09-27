import fs from "node:fs";
import assert from "node:assert/strict";

const pagePath = "app/account/page.tsx";

assert.equal(
  fs.existsSync(pagePath),
  true,
  "app/account/page.tsx does not exist",
);

const page = fs.readFileSync(
  pagePath,
  "utf8",
);

/*
 * Vehnexa branding
 */

assert.match(
  page,
  /VEHNEXA/,
  "Vehnexa branding is missing",
);

assert.equal(
  page.includes("PARTPILOT"),
  false,
  "Old PartPilot branding still exists",
);

/*
 * Screen 08 structure
 */

assert.match(
  page,
  /My Orders/,
);

assert.match(
  page,
  /Overview/,
);

assert.match(
  page,
  /Orders/,
);

assert.match(
  page,
  /My Vehicles/,
);

assert.match(
  page,
  /Addresses/,
);

assert.match(
  page,
  /Payment Methods/,
);

assert.match(
  page,
  /Account Settings/,
);

assert.match(
  page,
  /Notifications/,
);

/*
 * Keep real authentication
 */

assert.match(
  page,
  /getCurrentUser/,
);

assert.match(
  page,
  /getAccessToken/,
);

/*
 * Old dashboard should disappear
 */

assert.equal(
  page.includes("YOUR GARAGE IS ONLINE"),
  false,
  "Old account hero still exists",
);

assert.equal(
  page.includes("Quick access"),
  false,
  "Old quick-access dashboard still exists",
);

console.log(
  "Vehnexa account wireframe contract passed.",
);