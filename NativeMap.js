import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const SPORT_EMOJI = { Basketball: '🏀', Soccer: '⚽', Volleyball: '🏐' };
const SPORT_COLOR = { Basketball: '#FF9500', Soccer: '#34C759', Volleyball: '#0A84FF' };

/**
 * NativeMap — Apple Maps (via react-native-maps) for iOS/Android.
 * Metro picks this file on native and the NativeMap.web.js stub on web,
 * so the web bundle never resolves react-native-maps (which imports
 * native-only React Native internals that fail under react-native-web).
 *
 * Props mirror WebMap so MapScreen can swap implementations purely by Platform.OS.
 */
export default function NativeMap({ sessions, onSelectSession, initialRegion }) {
  return (
    <MapView style={styles.map} initialRegion={initialRegion} userInterfaceStyle="dark">
      {sessions.map(s => (
        <Marker key={s.id} coordinate={s.coordinates} onPress={() => onSelectSession(s)}>
          <View style={[styles.pin, { backgroundColor: SPORT_COLOR[s.sport] || '#FF9500' }]}>
            <Text style={{ fontSize: 15 }}>{SPORT_EMOJI[s.sport] || '📍'}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  pin: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
});
