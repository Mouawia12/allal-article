import { inventoryApi, productsApi } from "services";

const TTL_MS = 5 * 60 * 1000;

const cache = {
  categories: { data: null, expires: 0, inflight: null },
  units:      { data: null, expires: 0, inflight: null },
  warehouses: { data: null, expires: 0, inflight: null },
};

const fetchers = {
  categories: () => productsApi.listCategories(),
  units:      () => productsApi.listUnits(),
  warehouses: () => inventoryApi.listWarehouses(),
};

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function get(key, { force = false } = {}) {
  const entry = cache[key];
  const fresh = !force && entry.data && Date.now() < entry.expires;
  if (fresh) return Promise.resolve(entry.data);
  if (entry.inflight) return entry.inflight;

  entry.inflight = fetchers[key]()
    .then((r) => {
      const list = extractList(r.data);
      entry.data = list;
      entry.expires = Date.now() + TTL_MS;
      return list;
    })
    .finally(() => { entry.inflight = null; });

  return entry.inflight;
}

export const referenceCache = {
  categories: (opts) => get("categories", opts),
  units:      (opts) => get("units", opts),
  warehouses: (opts) => get("warehouses", opts),
  peek: (key) => cache[key]?.data,
  invalidate: (key) => {
    if (key) { cache[key].data = null; cache[key].expires = 0; return; }
    Object.keys(cache).forEach((k) => { cache[k].data = null; cache[k].expires = 0; });
  },
};
