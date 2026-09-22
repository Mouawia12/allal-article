/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PlaceIcon from "@mui/icons-material/Place";
import { loadGoogleMaps, mapsConfigured, googleMapsLink } from "utils/googleMaps";

// Read-only map showing a single marker. Used inside the customer/supplier
// detail dialog "الموقع" tab.
function LocationMap({ lat, lng, label = "", height = 320 }) {
  const hasCoords = lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
  const containerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasCoords || !mapsConfigured()) return undefined;
    let cancelled = false;
    setError("");
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const position = { lat: Number(lat), lng: Number(lng) };
        const map = new maps.Map(containerRef.current, {
          center: position,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
        });
        new maps.Marker({ position, map, title: label });
      })
      .catch((e) => !cancelled && setError(e.message || "تعذّر تحميل الخريطة"));
    return () => {
      cancelled = true;
    };
  }, [lat, lng, label, hasCoords]);

  if (!hasCoords) {
    return (
      <SoftBox textAlign="center" py={6}>
        <PlaceIcon sx={{ fontSize: 48, color: "#c7ccd6" }} />
        <SoftTypography variant="body2" color="secondary" mt={1}>
          لم يُحدَّد موقع لهذا السجل. عدّل البيانات لإضافة الموقع على الخريطة.
        </SoftTypography>
      </SoftBox>
    );
  }

  return (
    <SoftBox>
      {!mapsConfigured() && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          أضف مفتاح خرائط غوغل في ملف .env (REACT_APP_GOOGLE_MAPS_API_KEY) لعرض الخريطة. الإحداثيات
          محفوظة ويمكن فتحها مباشرة في خرائط غوغل.
        </Alert>
      )}
      {error && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      {mapsConfigured() && (
        <SoftBox
          ref={containerRef}
          sx={{ width: "100%", height, borderRadius: "12px", overflow: "hidden", mb: 1.5 }}
        />
      )}
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <SoftTypography variant="caption" color="text">
          الإحداثيات: {Number(lat).toFixed(6)}، {Number(lng).toFixed(6)}
        </SoftTypography>
        <SoftButton
          component="a"
          href={googleMapsLink(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          variant="gradient"
          color="info"
          size="small"
          startIcon={<PlaceIcon />}
        >
          فتح في خرائط غوغل
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

export default LocationMap;
