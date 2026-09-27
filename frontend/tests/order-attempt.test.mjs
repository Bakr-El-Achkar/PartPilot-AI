import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  clearOrderAttemptKey,
  getOrderAttemptKey,
} from "../lib/order-attempt.ts";

const payload = {
  items: [{ product_id: "pad", quantity: 1 }],
  shipping_address: "Tripoli, Lebanon",
  payment_method: "cash_on_delivery",
  vehicle_id: null,
};

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values,
  };
}

afterEach(() => {
  clearOrderAttemptKey();
  delete globalThis.window;
});

test("same checkout attempt reuses a random UUID after reload", async () => {
  const sessionStorage = storage();
  globalThis.window = { sessionStorage };

  const first = await getOrderAttemptKey(payload);
  const afterReload = await import("../lib/order-attempt.ts?reload=1");
  const replay = await afterReload.getOrderAttemptKey(payload);

  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(replay, first);
  assert.equal(JSON.stringify([...sessionStorage.values.values()]).includes("Tripoli"), false);
});

test("changed checkout request and completed checkout get new keys", async () => {
  globalThis.window = { sessionStorage: storage() };

  const first = await getOrderAttemptKey(payload);
  const changed = await getOrderAttemptKey({
    ...payload,
    shipping_address: "Beirut, Lebanon",
  });
  clearOrderAttemptKey();
  const next = await getOrderAttemptKey(payload);

  assert.notEqual(changed, first);
  assert.notEqual(next, first);
  assert.notEqual(next, changed);
});

test("storage denial still reuses key within the current page", async () => {
  globalThis.window = {
    sessionStorage: {
      getItem() { throw new DOMException("blocked", "SecurityError"); },
      setItem() { throw new DOMException("blocked", "SecurityError"); },
      removeItem() { throw new DOMException("blocked", "SecurityError"); },
    },
  };

  const first = await getOrderAttemptKey(payload);
  const replay = await getOrderAttemptKey(payload);

  assert.equal(replay, first);
});
