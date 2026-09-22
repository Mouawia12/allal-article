/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import PlaceIcon from "@mui/icons-material/Place";
import {
  loadGoogleMaps,
  mapsConfigured,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from "utils/googleMaps";

// Aggregated map: renders many markers (customers or suppliers) and fits the
// viewport to all of them. Clicking a marker calls onSelect(item).
function EntitiesMap({ items = [], onSelect, height = 500 }) {
  const containerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [error, setError] = useState("");

  onSelectRef.current = onSelect;

  const points = items.filter(
    (it) => it.lat != null && it.lng != null && !isNaN(Number(it.lat)) && !isNaN(Number(it.lng))
  );

  useEffect(() => {
    if (!mapsConfigured() || points.length === 0) return undefined;
    let cancelled = false;
    setError("");
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
        });
        const bounds = new maps.LatLngBounds();
        const info = new maps.InfoWindow();
        points.forEach((it) => {
          const position = { lat: Number(it.lat), lng: Number(it.lng) };
          const marker = new maps.Marker({ position, map, title: it.name });
          bounds.extend(position);
          marker.addListener("click", () => {
            const subtitle = it.subtitle ? `<div style="color:#67748e">${it.subtitle}</div>` : "";
            info.setContent(
              `<div style="font-family:inherit;text-align:right;min-width:120px">` +
                `<div style="font-weight:bold;color:#344767">${it.name || ""}</div>${subtitle}</div>`
            );
            info.open({ anchor: marker, map });
            if (onSelectRef.current) onSelectRef.current(it);
          });
        });
        map.fitBounds(bounds);
        if (points.length === 1) {
          maps.event.addListenerOnce(map, "idle", () => map.setZoom(15));
        }
      })
      .catch((e) => !cancelled && setError(e.message || "تعذّر تحميل الخريطة"));
    return () => {
      cancelled = true;
    };
  }, [points]);

  if (!mapsConfigured()) {
    return (
      <Alert severity="info">
        أضف مفتاح خرائط غوغل في ملف .env (REACT_APP_GOOGLE_MAPS_API_KEY) لعرض الخريطة المجمّعة.
      </Alert>
    );
  }

  if (points.length === 0) {
    return (
      <SoftBox textAlign="center" py={6}>
        <PlaceIcon sx={{ fontSize: 48, color: "#c7ccd6" }} />
        <SoftTypography variant="body2" color="secondary" mt={1}>
          لا توجد سجلات محدَّدة المواقع للعرض. أضف الإحداثيات من نافذة التعديل.
        </SoftTypography>
      </SoftBox>
    );
  }

  return (
    <SoftBox>
      {error && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      <SoftTypography variant="caption" color="text" mb={1} display="block">
        {points.length} موقع على الخريطة
      </SoftTypography>
      <SoftBox
        ref={containerRef}
        sx={{ width: "100%", height, borderRadius: "12px", overflow: "hidden" }}
      />
    </SoftBox>
  );
}

export default EntitiesMap;
