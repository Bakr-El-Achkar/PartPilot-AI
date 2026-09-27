import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { test } from "node:test";

import { getVehicleVisualProfile } from "../lib/vehicle-visuals/vehicleVisualProfile.ts";
import { getExteriorCameraDistance } from "../lib/vehicle-visuals/stageFraming.ts";

test("the CR-V exterior model URL matches the asset's exact filename case", () => {
  const profile = getVehicleVisualProfile({
    year: 2026,
    make: "Honda",
    model: "CR-V",
  });
  const fileName = profile.visualModelUrl.split("/").at(-1);
  const assets = readdirSync(new URL("../public/models/vehicles/", import.meta.url));

  assert.equal(profile.bodyStyle, "suv");
  assert.ok(assets.includes(fileName), `${fileName} does not match an asset filename`);
});

test("exterior camera leaves room around a vehicle in narrow stages", () => {
  const radius = 4.4;
  const fov = 32;
  const wideDistance = getExteriorCameraDistance(radius, 1.5, fov);
  const narrowDistance = getExteriorCameraDistance(radius, 0.8, fov);
  const halfVertical = (fov * Math.PI) / 360;
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * 0.8);

  assert.ok(narrowDistance > wideDistance);
  assert.ok(narrowDistance * Math.tan(halfHorizontal) > radius);
  assert.ok(narrowDistance * Math.tan(halfVertical) > radius);
});
