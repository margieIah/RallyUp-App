import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Platform, useWindowDimensions, Dimensions, Animated, Easing,
} from 'react-native';
import {
  MapPin, ShieldCheck, X, WifiOff, Layers,
  Clock, Star, Users, Package,
} from 'lucide-react-native';
import { useRally } from '../context/RallyContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Metro's platform-extension resolver picks the right implementation per platform:
//   NativeMap.js     → loaded on iOS / Android (uses react-native-maps / Apple Maps)
//   NativeMap.web.js → loaded on web          (stub returning null)
//   WebMap.web.js    → loaded on web          (uses @vis.gl/react-google-maps)
//   WebMap.js        → loaded on native       (stub returning null)
// Both components share the same prop interface so MapScreen just swaps by Platform.OS.
import NativeMap from '../components/NativeMap';
import WebMap from '../components/WebMap';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SPORT_EMOJI = { Basketball: '🏀', Soccer: '⚽', Volleyball: '🏐' };
const SPORT_COLOR = { Basketball: '#FF9500', Soccer: '#34C759', Volleyball: '#0A84FF' };

// Web-only Google Maps key — loaded from .env via Expo's EXPO_PUBLIC_* convention.
// Used by the Phase 2 Google Maps integration. Empty string when unset, which the
// integration will treat as "fall back to the offline blueprint" so the app still works
// during local dev without a key.
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const PressCard = ({ onPress, style, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  return (
    <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const AnimBtn = ({ onPress, style, children, scaleTo = 0.97 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  return (
    <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const StaggerItem = ({ delay = 0, children, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default function MapScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width > 768;

  const { sessions, joinRallySession, joinWaitlist, showModal } = useRally();
  const [selectedSession, setSelectedSession] = useState(null);
  const [offlineFallback, setOfflineFallback] = useState(false);

  // Panel enter: spring-driven slide+fade (Emil: springs feel alive, interruptible)
  const panelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedSession) {
      Animated.spring(panelAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(panelAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [selectedSession]);

  const closePanel = () => setSelectedSession(null);

  const initialRegion = {
    latitude: 40.730610, longitude: -73.935242,
    latitudeDelta: 0.25, longitudeDelta: 0.25,
  };

  const handleMapJoin = (session) => {
    const gear = session.equipmentAvailable || [];
    if (gear.length === 0) {
      joinRallySession(session.id, []);
      closePanel();
      return;
    }
    showModal({
      title: 'Need Equipment?',
      message: `Free gear on-site:\n${gear.map(g => `  •  ${g}`).join('\n')}\n\nReserve equipment?`,
      messageAlign: 'left',
      icon: Package,
      iconColor: '#0A84FF',
      buttons: [
        { label: 'No Thanks', onPress: () => { joinRallySession(session.id, []); closePanel(); } },
        { label: 'Reserve All', style: 'primary', onPress: () => { joinRallySession(session.id, gear); closePanel(); } },
      ],
    });
  };

  const renderOfflineBlueprint = () => (
    <View style={[styles.blueprintContainer, { paddingTop: Math.max(insets.top, 20) + 64 }]}>
      <StaggerItem delay={0}>
        <View style={styles.blueprintHeader}>
          <View style={styles.blueprintIconWrap}>
            <WifiOff color="#FF9500" size={16} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.blueprintTitle}>OFFLINE RADAR</Text>
            <Text style={styles.blueprintSub}>Displaying cached Safe-Zones</Text>
          </View>
          <View style={styles.zonesCountPill}>
            <Text style={styles.zonesCountText}>{sessions.length}</Text>
          </View>
        </View>
      </StaggerItem>

      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {sessions.map((session, idx) => {
          const accentColor = SPORT_COLOR[session.sport] || '#FF9500';
          const isActive = selectedSession?.id === session.id;
          return (
            <StaggerItem key={session.id} delay={80 + idx * 60}>
              <PressCard
                style={[styles.bpCard, isActive && styles.bpCardActive, { borderLeftColor: accentColor }]}
                onPress={() => setSelectedSession(session)}
              >
                <View style={styles.bpCardTop}>
                  <View style={styles.bpSportRow}>
                    <Text style={styles.bpEmoji}>{SPORT_EMOJI[session.sport] || '📍'}</Text>
                    <Text style={[styles.bpSport, { color: accentColor }]}>
                      {session.sport.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.securePill}>
                    <ShieldCheck color="#34C759" size={10} strokeWidth={2.6} />
                    <Text style={styles.securePillText}>SECURE</Text>
                  </View>
                </View>
                <Text style={styles.bpTitle} numberOfLines={1}>{session.title}</Text>
                <View style={styles.bpLocRow}>
                  <MapPin color="#8E8E93" size={11} strokeWidth={2.2} />
                  <Text style={styles.bpLoc} numberOfLines={1}>{session.location}</Text>
                </View>
                <View style={styles.bpFooter}>
                  <View style={styles.bpTimeRow}>
                    <Clock color={accentColor} size={11} strokeWidth={2.4} />
                    <Text style={[styles.bpTime, { color: accentColor }]}>
                      {session.time} · {session.date}
                    </Text>
                  </View>
                  <View style={styles.bpCapPill}>
                    <Users color="#8E8E93" size={10} strokeWidth={2.4} />
                    <Text style={styles.bpCap}>{session.attendees}/{session.maxCapacity}</Text>
                  </View>
                </View>
              </PressCard>
            </StaggerItem>
          );
        })}
      </ScrollView>
    </View>
  );

  const panelStyle = isTablet
    ? { width: 380, right: 0, top: 0, bottom: 0, borderLeftWidth: 1, paddingTop: Math.max(insets.top, 40) }
    : { left: 0, right: 0, bottom: 0, maxHeight: SCREEN_HEIGHT * 0.62, borderTopLeftRadius: 28, borderTopRightRadius: 28 };

  // Render decision:
  //   1. User toggled Offline                       → blueprint everywhere
  //   2. Web + Google Maps API key present          → WebMap   (Google)
  //   3. Native (iOS / Android)                     → NativeMap (Apple)
  //   4. Web without an API key                     → blueprint
  const showOnline = !offlineFallback;
  const isWeb = Platform.OS === 'web';
  const canShowWebLive = isWeb && Boolean(GOOGLE_MAPS_API_KEY);

  return (
    <View style={styles.container}>
      {!showOnline || (isWeb && !canShowWebLive)
        ? renderOfflineBlueprint()
        : isWeb
          ? (
            <WebMap
              apiKey={GOOGLE_MAPS_API_KEY}
              sessions={sessions}
              onSelectSession={setSelectedSession}
              initialRegion={initialRegion}
            />
          )
          : (
            <NativeMap
              sessions={sessions}
              onSelectSession={setSelectedSession}
              initialRegion={initialRegion}
            />
          )
      }

      {/* Mode toggle — direct TouchableOpacity so absolute positioning applies to the hit area */}
      <TouchableOpacity
        style={[styles.toggle, { top: Math.max(insets.top, 20) + 10 }]}
        onPress={() => setOfflineFallback(!offlineFallback)}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Layers color={offlineFallback ? '#34C759' : '#FF9500'} size={14} strokeWidth={2.4} />
        <Text style={[styles.toggleText, { color: offlineFallback ? '#34C759' : '#FFFFFF' }]}>
          {offlineFallback ? 'Live Map' : 'Offline'}
        </Text>
      </TouchableOpacity>

      {/* Detail Panel */}
      {selectedSession && (
        <Animated.View style={[
          styles.panel,
          panelStyle,
          { paddingBottom: Math.max(insets.bottom, 20) },
          {
            opacity: panelAnim,
            transform: [{
              translateY: panelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [isTablet ? 0 : 32, 0],
              }),
            }],
          },
        ]}>
          {!isTablet && <View style={styles.dragHandle} />}

          <View style={styles.panelTitleRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.panelSportRow}>
                <Text style={styles.panelEmoji}>{SPORT_EMOJI[selectedSession.sport] || '📍'}</Text>
                <Text style={[styles.panelSport, { color: SPORT_COLOR[selectedSession.sport] || '#FF9500' }]}>
                  {selectedSession.sport.toUpperCase()}
                </Text>
                <View style={styles.securePill}>
                  <ShieldCheck color="#34C759" size={10} strokeWidth={2.6} />
                  <Text style={styles.securePillText}>SECURE</Text>
                </View>
              </View>
              <Text style={styles.panelTitle} numberOfLines={2}>{selectedSession.title}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closePanel} activeOpacity={0.7}>
              <X color="#FFFFFF" size={16} strokeWidth={2.6} />
            </TouchableOpacity>
          </View>

          <View style={styles.metaCluster}>
            <View style={styles.metaRow}>
              <MapPin color="#8E8E93" size={13} strokeWidth={2.4} />
              <Text style={styles.metaText}>
                <Text style={styles.metaTextStrong}>{selectedSession.location}</Text>
                {'  ·  '}{selectedSession.borough}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Clock color="#8E8E93" size={13} strokeWidth={2.4} />
              <Text style={styles.metaText}>
                <Text style={styles.metaTextStrong}>{selectedSession.time}</Text>
                {'  ·  '}{selectedSession.date}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Users color="#8E8E93" size={13} strokeWidth={2.4} />
              <Text style={styles.metaText}>
                <Text style={[styles.metaTextStrong, selectedSession.attendees >= selectedSession.maxCapacity && { color: '#FF3B30' }]}>
                  {selectedSession.attendees}/{selectedSession.maxCapacity}
                </Text>
                {'  '}spots
                <Text style={{ color: selectedSession.attendees >= selectedSession.maxCapacity ? '#FF3B30' : '#34C759', fontWeight: '800' }}>
                  {'  ·  '}{selectedSession.attendees >= selectedSession.maxCapacity ? 'FULL' : 'OPEN'}
                </Text>
              </Text>
            </View>
          </View>

          {/* Coach card */}
          <View style={styles.coachRow}>
            <View style={styles.coachAvatarWrap}>
              <Text style={styles.coachAvatarChar}>
                {selectedSession.coachName.replace('Coach ', '').charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachName}>{selectedSession.coachName}</Text>
              <View style={styles.coachStatsRow}>
                <Star color="#FF9500" size={11} strokeWidth={2.4} fill="#FF9500" />
                <Text style={styles.coachStats}>{selectedSession.rating}</Text>
                <Text style={styles.coachDot}>·</Text>
                <Text style={styles.coachStats}>{selectedSession.hoursDonated} hrs donated</Text>
              </View>
            </View>
            <View style={styles.tierChip}>
              <Text style={styles.tierChipText}>{selectedSession.tier}</Text>
            </View>
          </View>

          {/* Equipment */}
          {selectedSession.equipmentAvailable?.length > 0 && (
            <View style={styles.equipmentRow}>
              <View style={styles.equipmentHeader}>
                <Text style={styles.equipmentBag}>🎒</Text>
                <Text style={styles.equipmentLabel}>FREE GEAR ON-SITE</Text>
              </View>
              <Text style={styles.equipmentList}>
                {selectedSession.equipmentAvailable.join(' · ')}
              </Text>
            </View>
          )}

          {/* Action */}
          {selectedSession.attendees >= selectedSession.maxCapacity ? (
            <AnimBtn
              style={[styles.panelBtn, styles.waitlistBtn]}
              onPress={() => { joinWaitlist(selectedSession.id); closePanel(); }}
            >
              <Users color="#FFFFFF" size={17} strokeWidth={2.4} />
              <Text style={styles.panelBtnText}>Join Waitlist</Text>
            </AnimBtn>
          ) : (
            <AnimBtn style={styles.panelBtn} onPress={() => handleMapJoin(selectedSession)}>
              <ShieldCheck color="#FFFFFF" size={17} strokeWidth={2.4} />
              <Text style={styles.panelBtnText}>Reserve Safe-Zone Spot</Text>
            </AnimBtn>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  map: { flex: 1 },
  pin: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },

  toggle: {
    position: 'absolute', right: 16,
    flexDirection: 'row', gap: 6,
    backgroundColor: 'rgba(28,28,30,0.96)',
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C',
    zIndex: 100,
    boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
  },
  toggleText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  // Offline blueprint
  blueprintContainer: { flex: 1, paddingHorizontal: 20, backgroundColor: '#060608' },
  blueprintHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
    backgroundColor: '#0E0E12', padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: '#1E1E26',
  },
  blueprintIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,149,0,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.28)',
  },
  blueprintTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.8 },
  blueprintSub: { color: '#8E8E93', fontSize: 12, marginTop: 2, fontWeight: '500' },
  zonesCountPill: {
    backgroundColor: 'rgba(255,149,0,0.14)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.25)',
  },
  zonesCountText: { color: '#FF9500', fontSize: 12, fontWeight: '900' },

  // Blueprint card
  bpCard: {
    backgroundColor: '#0E0E12', paddingVertical: 16, paddingHorizontal: 16,
    borderRadius: 16, borderWidth: 1, borderColor: '#1E1E26',
    borderLeftWidth: 3,
  },
  bpCardActive: {
    borderColor: '#FF9500',
    backgroundColor: '#120E06',
    boxShadow: '0 8px 20px rgba(255,149,0,0.18)',
  },
  bpCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bpSportRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  bpEmoji: { fontSize: 15 },
  bpSport: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  bpTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 6 },
  bpLocRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  bpLoc: { color: '#8E8E93', fontSize: 13, fontWeight: '500', flex: 1 },
  bpFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bpTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bpTime: { fontSize: 12, fontWeight: '700' },
  bpCapPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  bpCap: { color: '#AEAEB2', fontSize: 12, fontWeight: '700' },

  securePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,199,89,0.1)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(52,199,89,0.22)',
  },
  securePillText: { color: '#34C759', fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },

  // Detail panel
  panel: {
    position: 'absolute', backgroundColor: '#141416',
    padding: 22, borderColor: '#2C2C2E', borderWidth: 1,
    zIndex: 200,
    boxShadow: '0 -20px 48px rgba(0,0,0,0.7)',
  },
  dragHandle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: '#3A3A3C',
    alignSelf: 'center', marginBottom: 18,
  },

  panelTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  panelSportRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  panelEmoji: { fontSize: 14 },
  panelSport: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  panelTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', lineHeight: 28, letterSpacing: -0.6 },
  closeBtn: {
    backgroundColor: '#2C2C2E', padding: 9, borderRadius: 12, marginTop: 2,
  },

  // Meta info cluster
  metaCluster: {
    backgroundColor: '#0A0A0C', borderRadius: 14, padding: 14, gap: 10,
    borderWidth: 1, borderColor: '#1F1F22', marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: '#AEAEB2', fontSize: 13, fontWeight: '500', flex: 1 },
  metaTextStrong: { color: '#FFFFFF', fontWeight: '700' },

  // Coach card
  coachRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0A0A0C', padding: 14, borderRadius: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#1F1F22',
  },
  coachAvatarWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,149,0,0.18)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.3)',
  },
  coachAvatarChar: { color: '#FF9500', fontSize: 16, fontWeight: '900' },
  coachName: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  coachStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  coachStats: { color: '#AEAEB2', fontSize: 12, fontWeight: '600' },
  coachDot: { color: '#3A3A3C', fontSize: 12 },
  tierChip: {
    backgroundColor: 'rgba(255,149,0,0.1)',
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.25)',
  },
  tierChipText: { color: '#FF9500', fontSize: 11, fontWeight: '800' },

  // Equipment block
  equipmentRow: {
    backgroundColor: 'rgba(10,132,255,0.06)',
    padding: 14, borderRadius: 14, marginBottom: 4,
    borderWidth: 1, borderColor: 'rgba(10,132,255,0.18)',
  },
  equipmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  equipmentBag: { fontSize: 14 },
  equipmentLabel: { color: '#0A84FF', fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  equipmentList: { color: '#E5E5EA', fontSize: 13, fontWeight: '600' },

  // Primary action
  panelBtn: {
    backgroundColor: '#FF9500', flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, padding: 16, borderRadius: 16, marginTop: 16,
    boxShadow: '0 8px 20px rgba(255,149,0,0.4)',
  },
  waitlistBtn: {
    backgroundColor: '#0A84FF',
    boxShadow: '0 8px 20px rgba(10,132,255,0.4)',
  },
  panelBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },
});
