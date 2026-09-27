import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { clearCart } from "../lib/cart.ts";
import { getAccessToken, removeAccessToken } from "../lib/auth.ts";

afterEach(() => {
  delete globalThis.window;
  delete globalThis.localStorage;
});

test("checkout cart cleanup continues when browser storage is blocked", () => {
  let updates = 0;
  globalThis.window = {
    localStorage: {
      removeItem() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    },
    dispatchEvent() {
      updates += 1;
    },
  };
  globalThis.localStorage = globalThis.window.localStorage;

  assert.doesNotThrow(clearCart);
  assert.equal(updates, 1);
});

test("session lookup treats blocked storage as signed out", () => {
  globalThis.window = {
    localStorage: {
      getItem() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
      removeItem() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    },
  };
  globalThis.localStorage = globalThis.window.localStorage;

  assert.equal(getAccessToken(), null);
  assert.doesNotThrow(removeAccessToken);
});
