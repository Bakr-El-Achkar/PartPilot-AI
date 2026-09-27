type OrderAttemptRequest = {
  items: { product_id: string; quantity: number }[];
  shipping_address: string;
  payment_method: string;
  vehicle_id?: string | null;
};

type PendingAttempt = {
  fingerprint: string;
  key: string;
};

const STORAGE_KEY = "vehnexa_pending_order_attempt";
let memoryAttempt: PendingAttempt | null = null;

async function fingerprint(request: OrderAttemptRequest): Promise<string> {
  const quantities = new Map<string, number>();
  for (const item of request.items) {
    quantities.set(
      item.product_id,
      (quantities.get(item.product_id) ?? 0) + item.quantity,
    );
  }
  const canonical = JSON.stringify({
    items: [...quantities.entries()].sort(([a], [b]) => a.localeCompare(b)),
    shipping_address: request.shipping_address,
    payment_method: request.payment_method,
    vehicle_id: request.vehicle_id ?? null,
  });
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function readAttempt(): PendingAttempt | null {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (
        typeof parsed === "object" && parsed !== null &&
        "fingerprint" in parsed && "key" in parsed &&
        typeof parsed.fingerprint === "string" &&
        /^[0-9a-f]{64}$/.test(parsed.fingerprint) &&
        typeof parsed.key === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(parsed.key)
      ) {
        return parsed as PendingAttempt;
      }
    }
  } catch {
    // Storage may be unavailable; the in-memory attempt still supports retries.
  }
  return memoryAttempt;
}

export async function getOrderAttemptKey(
  request: OrderAttemptRequest,
): Promise<string> {
  const requestFingerprint = await fingerprint(request);
  const previous = readAttempt();
  if (previous?.fingerprint === requestFingerprint) {
    memoryAttempt = previous;
    return previous.key;
  }

  const attempt = {
    fingerprint: requestFingerprint,
    key: crypto.randomUUID(),
  };
  memoryAttempt = attempt;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
  } catch {
    // Continue with an in-memory key when browser storage is blocked.
  }
  return attempt.key;
}

export function clearOrderAttemptKey(): void {
  memoryAttempt = null;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // A completed checkout must remain successful if storage is blocked.
  }
}
