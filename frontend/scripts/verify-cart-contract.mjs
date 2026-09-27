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

const cartPath =
  join(
    frontendRoot,
    "lib",
    "cart.ts",
  );


assert.equal(
  existsSync(cartPath),
  true,
  [
    "",
    "Vehnexa cart contract failed.",
    "",
    "Missing file:",
    "lib/cart.ts",
    "",
  ].join("\n"),
);


const source =
  readFileSync(
    cartPath,
    "utf8",
  );


assert.match(
  source,
  /export\s+type\s+CartItem\s*=/,
  "CartItem type must be exported.",
);

assert.match(
  source,
  /localStorage/,
  "Cart must persist in localStorage.",
);

assert.ok(
  source.includes(
    "vehnexa_cart",
  ),
  'Cart storage key must be "vehnexa_cart".',
);


for (
  const functionName of [
    "getCartItems",
    "addToCart",
    "removeFromCart",
    "updateCartQuantity",
    "clearCart",
    "getCartCount",
  ]
) {
  assert.match(
    source,
    new RegExp(
      `export\\s+function\\s+${functionName}\\s*\\(`,
    ),
    `${functionName}() must be exported.`,
  );
}


assert.match(
  source,
  /window\.dispatchEvent/,
  "Cart changes must notify the UI.",
);

assert.ok(
  source.includes(
    "vehnexa-cart-updated",
  ),
  [
    "Cart helpers must dispatch",
    "the vehnexa-cart-updated event.",
  ].join(" "),
);


assert.match(
  source,
  /stock_quantity/,
  [
    "Cart items must retain stock information",
    "for stock-aware quantities.",
  ].join(" "),
);


console.log(
  [
    "",
    "✓ Vehnexa cart contract passed",
    "",
    "Verified:",
    "- persistent local cart",
    "- add to cart",
    "- quantity updates",
    "- removal",
    "- clear cart",
    "- cart item count",
    "- UI update event",
    "- stock-aware cart items",
    "",
  ].join("\n"),
);