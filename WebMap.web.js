import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

const SPORT_COLOR = { Basketball: '#FF9500', Soccer: '#34C759', Volleyball: '#0A84FF' };
const SPORT_LETTER = { Basketball: 'B', Soccer: 'S', Volleyball: 'V' };

// Dark-mode style that matches RallyUp's dark palette.
// Trimmed to the entries that actually affect visual density on a booth-phone-sized map.
const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0E0E10' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8E8E93' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0E0E10' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#AEAEB2' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#636366' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#13201A' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#34C759' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1F1F22' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0A0A0C' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9CA0A6' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2C2C2E' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#000000' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1A1A1C' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#06070C' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3A506B' }] },
];

// SVG data-URL marker: colored circle, white border, sport letter glyph.
// Matches the visual language of the native MapView pins.
function buildMarkerIcon(sport) {
  const color = SPORT_COLOR[sport] || '#FF9500';
  const letter = SPORT_LETTER[sport] || '?';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
      <defs>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="black" flood-opacity="0.55"/>
        </filter>
      </defs>
      <g filter="url(#s)">
        <circle cx="22" cy="22" r="18" fill="${color}" stroke="white" stroke-width="2.5"/>
        <text x="22" y="29" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="800"
              fill="white" text-anchor="middle">${letter}</text>
      </g>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * WebMap — Google Maps rendering for the web platform only.
 * Mounted by MapScreen via a `require()` guarded by Platform.OS === 'web', so
 * native bundles never resolve this file or its `@vis.gl/react-google-maps` dep.
 *
 * Props:
 *   apiKey:           string  — public Google Maps JS API key
 *   sessions:         Session[] — from RallyContext
 *   onSelectSession:  (s) => void — opens the shared detail panel
 *   initialRegion:    {latitude, longitude, latitudeDelta, longitudeDelta}
 */
export default function WebMap({ apiKey, sessions, onSelectSession, initialRegion }) {
  const [loadError, setLoadError] = useState(null);

  const center = {
    lat: initialRegion?.latitude ?? 40.730610,
    lng: initialRegion?.longitude ?? -73.935242,
  };
  // Convert latitudeDelta to approximate zoom — 0.25 delta ≈ zoom 10
  const zoom = initialRegion?.latitudeDelta
    ? Math.round(Math.log2(360 / initialRegion.latitudeDelta))
    : 11;

  if (loadError) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.errorTitle}>Map failed to load</Text>
        <Text style={styles.errorBody}>{loadError}</Text>
        <Text style={styles.errorHint}>Tap "Offline" at the top right to see cached safe-zones.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E10' }}>
      <APIProvider
        apiKey={apiKey}
        onError={(e) => setLoadError(e?.message || 'Could not reach Google Maps.')}
      >
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          styles={DARK_STYLE}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
          fullscreenControl={false}
          mapTypeControl={false}
          streetViewControl={false}
          zoomControl={true}
          backgroundColor="#0E0E10"
          style={{ width: '100%', height: '100%' }}
        >
          {sessions.map(s => (
            <Marker
              key={s.id}
              position={{ lat: s.coordinates.latitude, lng: s.coordinates.longitude }}
              icon={{
                url: buildMarkerIcon(s.sport),
                scaledSize: { width: 44, height: 56 },
                anchor: { x: 22, y: 40 },
              }}
              onClick={() => onSelectSession(s)}
              title={`${s.sport} · ${s.title}`}
            />
          ))}
        </Map>
      </APIProvider>

      {/* Soft loading state under the map until the script + tiles arrive */}
      <View pointerEvents="none" style={styles.loadingHint}>
        <ActivityIndicator color="#FF9500" size="small" />
      </View>
    </View>
  );
}

const styles = {
  errorWrap: {
    flex: 1, backgroundColor: '#0E0E10', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 8,
  },
  errorTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  errorBody:  { color: '#AEAEB2', fontSize: 13, textAlign: 'center', fontWeight: '500' },
  errorHint:  { color: '#FF9500', fontSize: 12, fontWeight: '700', marginTop: 8 },

  loadingHint: {
    position: 'absolute', top: '50%', left: '50%',
    marginLeft: -10, marginTop: -10, zIndex: -1,
  },
};
