import { useCallback, useMemo, useState } from "react";

const STORAGE_KEY = "allal_product_favorites";
const DEFAULT_FAVORITE_PRODUCT_IDS = [1, 7, 13];

function normalizeIds(ids) {
  if (!Array.isArray(ids)) return DEFAULT_FAVORITE_PRODUCT_IDS;

  return ids
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

function readFavoriteIds() {
  if (typeof window === "undefined") {
    return DEFAULT_FAVORITE_PRODUCT_IDS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return DEFAULT_FAVORITE_PRODUCT_IDS;

    return normalizeIds(JSON.parse(raw));
  } catch (error) {
    return DEFAULT_FAVORITE_PRODUCT_IDS;
  }
}

function writeFavoriteIds(ids) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    // Keep the UI usable even when localStorage is unavailable.
  }
}

function useProductFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(readFavoriteIds);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const isFavorite = useCallback(
    (productId) => favoriteSet.has(Number(productId)),
    [favoriteSet]
  );

  const toggleFavorite = useCallback((productId) => {
    const normalizedId = Number(productId);

    if (!Number.isFinite(normalizedId) || normalizedId <= 0) return;

    setFavoriteIds((current) => {
      const nextSet = new Set(current);

      if (nextSet.has(normalizedId)) {
        nextSet.delete(normalizedId);
      } else {
        nextSet.add(normalizedId);
      }

      const nextIds = Array.from(nextSet);
      writeFavoriteIds(nextIds);

      return nextIds;
    });
  }, []);

  return {
    favoriteIds,
    favoriteSet,
    favoriteCount: favoriteIds.length,
    isFavorite,
    toggleFavorite,
  };
}

export default useProductFavorites;
