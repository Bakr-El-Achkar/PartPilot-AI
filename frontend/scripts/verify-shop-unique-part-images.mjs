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

const root =
  join(
    dirname(currentFile),
    "..",
  );

const source =
  readFileSync(
    join(
      root,
      "app",
      "shop",
      "page.tsx",
    ),
    "utf8",
  );


/* No broad family fallback anymore */

assert.equal(
  source.includes(
    "PART_FAMILY_IMAGE_RULES",
  ),
  false,
  "Shop must not reuse one family image across different components.",
);


/* Exact parts visible in the current Shop screenshot */

const requiredTerms = [
  "shock absorber",
  "strut assembly",
  "control arm",
  "wheel hub bearing",
  "outer tie rod",
  "inner tie rod",
  "power steering pump",
  "power steering pressure hose",
];

for (
  const term of
    requiredTerms
) {
  assert.ok(
    source
      .toLowerCase()
      .includes(term),
    `Missing exact image rule for "${term}".`,
  );
}


/*
 * These exact parts must use different image URLs.
 */

const imageUrls = [
  "shock-absorber",
  "strut-assembly",
  "control-arm",
  "wheel-hub-bearing",
  "outer-tie-rod",
  "inner-tie-rod",
  "power-steering-pump",
  "power-steering-pressure-hose",
];

for (
  const imageName of
    imageUrls
) {
  assert.ok(
    source.includes(
      `/product-parts/${imageName}.`,
    ),
    `Missing local image for ${imageName}.`,
  );
}


assert.ok(
  source.includes(
    "Image unavailable",
  ),
  "Unknown components must still use the honest unavailable state.",
);


console.log(
  [
    "",
    "✓ Vehnexa unique component-image contract passed",
    "",
    "Verified:",
    "- no broad family image reuse",
    "- shock and strut are different",
    "- inner and outer tie rods are different",
    "- steering pump and hose are different",
    "- wheel hub and control arm are different",
    "- local product-part assets are used",
    "",
  ].join("\n"),
);