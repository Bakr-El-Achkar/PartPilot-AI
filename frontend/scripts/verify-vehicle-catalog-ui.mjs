import fs from "node:fs";
import assert from "node:assert/strict";

const catalogPath = "lib/vehicleCatalog.ts";
const addVehiclePath = "app/account/garage/add/page.tsx";

assert.equal(
  fs.existsSync(catalogPath),
  true,
  "lib/vehicleCatalog.ts does not exist yet",
);

const catalog = fs.readFileSync(catalogPath, "utf8");
const addVehicle = fs.readFileSync(addVehiclePath, "utf8");

assert.match(catalog, /getVehicleMakes/);
assert.match(catalog, /getVehicleModels/);
assert.match(catalog, /getVehicleYears/);
assert.match(catalog, /getVehicleOptions/);

assert.match(addVehicle, /getVehicleMakes/);
assert.match(addVehicle, /getVehicleModels/);
assert.match(addVehicle, /getVehicleYears/);
assert.match(addVehicle, /getVehicleOptions/);

assert.match(addVehicle, /Vehnexa/);

assert.equal(
  addVehicle.includes("PARTPILOT"),
  false,
  "Old PartPilot branding still exists",
);

console.log("Vehnexa vehicle catalog UI contract passed.");