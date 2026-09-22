/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import {
  loadGoogleMaps,
  mapsConfigured,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from "utils/googleMaps";

// Interactive location picker: click on the map to place/move a marker, plus
// manual latitude/longitude inputs. The manual inputs always work, even when no
// Google Maps key is configured. Calls onChange({ lat, lng }) with numbers or null.
function LocationPicker({ lat, lng, onChange, height = 280 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapsRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [error, setError] = useState("");

  onChangeRef.current = onChange;

  const hasCoords = lat != null && lat !== "" && lng != null && lng !== "";

  // Initialise the map once.
  useEffect(() => {
    if (!mapsConfigured()) return undefined;
    let cancelled = false;
    setError("");
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsRef.current = maps;
        const start = hasCoords
          ? { lat: Number(lat), lng: Number(lng) }
          : DEFAULT_CENTER;
        const map = new maps.Map(containerRef.current, {
          center: start,
          zoom: hasCoords ? 15 : DEFAULT_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
        });
        mapRef.current = map;
        if (hasCoords) {
          markerRef.current = new maps.Marker({ position: start, map });
        }
        map.addListener("click", (e) => {
          const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          onChangeRef.current(next);
        });
      })
      .catch((e) => !cancelled && setError(e.message || "تعذّر تحميل الخريطة"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync with the current value (manual edit or map click).
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;
    if (!hasCoords) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      return;
    }
    const position = { lat: Number(lat), lng: Number(lng) };
    if (Number.isNaN(position.lat) || Number.isNaN(position.lng)) return;
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      markerRef.current = new maps.Marker({ position, map });
    }
    map.panTo(position);
  }, [lat, lng, hasCoords]);

  const setField = (key, raw) => {
    const value = raw === "" ? null : Number(raw);
    onChange({ lat: key === "lat" ? value : lat ?? null, lng: key === "lng" ? value : lng ?? null });
  };

  return (
    <SoftBox>
      {mapsConfigured() ? (
        <>
          {error && (
            <Alert severity="warning" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}
          <SoftTypography variant="caption" color="text" mb={0.5} display="block">
            انقر على الخريطة لتحديد الموقع، أو أدخل الإحداثيات يدويًا.
          </SoftTypography>
          <SoftBox
            ref={containerRef}
            sx={{ width: "100%", height, borderRadius: "12px", overflow: "hidden", mb: 1.5 }}
          />
        </>
      ) : (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          أضف مفتاح خرائط غوغل في ملف .env لعرض الخريطة التفاعلية. يمكنك حاليًا إدخال الإحداثيات يدويًا.
        </Alert>
      )}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="خط العرض (Latitude)"
            value={lat ?? ""}
            onChange={(e) => setField("lat", e.target.value)}
            inputProps={{ step: "any", min: -90, max: 90 }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="خط الطول (Longitude)"
            value={lng ?? ""}
            onChange={(e) => setField("lng", e.target.value)}
            inputProps={{ step: "any", min: -180, max: 180 }}
          />
        </Grid>
      </Grid>
    </SoftBox>
  );
}

export default LocationPicker;
