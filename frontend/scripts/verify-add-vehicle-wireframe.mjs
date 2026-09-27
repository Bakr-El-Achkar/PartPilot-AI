import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(
  process.cwd(),
  "app",
  "account",
  "garage",
  "add",
  "page.tsx",
);

const source = fs.readFileSync(
  pagePath,
  "utf8",
);

assert.match(
  source,
  /Vehnexa/,
  "Vehnexa branding is missing",
);

assert.match(
  source,
  /bg-\[#071b2d\]/,
  "Dark navy Vehnexa navbar is missing",
);

assert.match(
  source,
  /Back to My Garage/,
  "Back to My Garage link is missing",
);

assert.match(
  source,
  /MY GARAGE/,
  "MY GARAGE eyebrow is missing",
);

assert.match(
  source,
  /Add a vehicle/,
  "Add a vehicle heading is missing",
);

assert.match(
  source,
  /Smart vehicle matching/,
  "Smart vehicle matching badge is missing",
);

assert.match(
  source,
  /Vehicle details/,
  "Vehicle details card is missing",
);

assert.match(
  source,
  /Compatibility\s+profile/,
  "Compatibility profile panel is missing",
);

assert.match(
  source,
  /VEHICLE PREVIEW/,
  "Vehicle preview eyebrow is missing",
);

assert.match(
  source,
  /Your vehicle/,
  "Your vehicle title is missing",
);

assert.match(
  source,
  /getVehiclePreview/,
  "CarsXE vehicle preview integration must be preserved",
);

assert.match(
  source,
  /createVehicle/,
  "Vehicle creation flow must be preserved",
);

assert.match(
  source,
  /image_url/,
  "Detected vehicle image must still be saved",
);

assert.match(
  source,
  /grid-cols-2/,
  "Desktop two-column vehicle form is missing",
);

assert.match(
  source,
  /Cancel/,
  "Cancel action is missing",
);

assert.match(
  source,
  /Add vehicle/,
  "Add vehicle submit action is missing",
);

assert.match(
  source,
  /disabled:opacity-80/,
  "Disabled Add vehicle button should stay strongly red",
);

assert.match(
  source,
  /mt-10 grid gap-7/,
  "Main content spacing should match the reference",
);

assert.match(
  source,
  /w-\[130px\]/,
  "Vehicle placeholder should be slightly larger",
);

assert.match(
  source,
  /mt-6 flex items-center justify-end/,
  "Bottom action area should be tighter",
);

console.log(
  "Vehnexa Add Vehicle wireframe contract passed.",
);