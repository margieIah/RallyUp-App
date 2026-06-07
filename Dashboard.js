import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  useWindowDimensions, Modal, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Activity, ShieldCheck, ShieldAlert, MapPin, CloudRain,
  CheckCircle2, XCircle, Star, Clock, Users, Trophy, Sparkles, Package,
} from 'lucide-react-native';
import { useRally } from '../context/RallyContext';

const SPORT_EMOJI  = { Basketball: '🏀', Soccer: '⚽', Volleyball: '🏐' };
const TIER_ICONS   = { Trained: '🎓', Veteran: '🔥', Master: '👑' };
const TIER_COLORS  = { Trained: '#AEAEB2', Veteran: '#FF9500', Master: '#34C759' };
const SPORT_COLOR  = { Basketball: '#FF9500', Soccer: '#34C759', Volleyball: '#0A84FF' };

// Single source of truth for tier — matches ProfileScreen.getTierInfo
function getTierInfo(hours) {
  if (hours >= 50) return { name: 'Master',  icon: '👑', color: '#34C759' };
  if (hours >= 10) return { name: 'Veteran', icon: '🔥', color: '#FF9500' };
  return                  { name: 'Trained', icon: '🎓', color: '#AEAEB2' };
}

// Subtle press (Emil: 0.97 is the sweet spot)
const AnimBtn = ({ onPress, style, children, disabled, scaleTo = 0.97 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => !disabled && Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  return (
    <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1} disabled={disabled}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Stagger entrance — 60ms between items (Emil: 30-80ms stagger feels natural)
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

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width > 768;

  const {
    userRole, userProfile, sessions, academyModules, pendingRequests,
    joinRallySession, verifySafeZoneArrival, connectParentDashboard,
    handlePendingRequest, triggerPanicButton, joinWaitlist,
    pendingCertificate, claimCertificate,
    showModal,
  } = useRally();

  const [selectedSportFilter, setSelectedSportFilter] = useState('All');
  const SPORT_FILTERS = ['All', ...new Set(sessions.map(s => s.sport))];
  const filteredSessions = sessions.filter(
    s => selectedSportFilter === 'All' || s.sport === selectedSportFilter
  );

  const completedModules = academyModules.filter(m => m.completed).length;
  const totalModules = academyModules.length;

  const handleJoinWithEquipment = (session) => {
    const gear = session.equipmentAvailable || [];
    if (gear.length === 0) {
      joinRallySession(session.id, []);
      return;
    }
    showModal({
      title: 'Need Equipment?',
      message: `Free gear available on-site:\n${gear.map(g => `  •  ${g}`).join('\n')}\n\nWould you like to reserve any?`,
      messageAlign: 'left',
      icon: Package,
      iconColor: '#0A84FF',
      buttons: [
        { label: 'Use My Own', onPress: () => joinRallySession(session.id, []) },
        { label: 'Reserve All', style: 'primary', onPress: () => joinRallySession(session.id, gear) },
      ],
    });
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>

      {/* Header — refined hierarchy, no cramping */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <StaggerItem delay={0}>
            <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
          </StaggerItem>
          <StaggerItem delay={40}>
            <Text style={styles.welcomeText} numberOfLines={1}>{userProfile.name}</Text>
          </StaggerItem>
          <StaggerItem delay={80}>
            <View style={styles.roleChipRow}>
              <View style={styles.roleChip}>
                <View style={[styles.roleDot, { backgroundColor: userRole === 'coach' ? '#34C759' : '#0A84FF' }]} />
                <Text style={styles.roleChipText}>{userRole === 'coach' ? 'Coach' : 'Student'}</Text>
              </View>
              <Text style={styles.locationText}>{userProfile.borough}</Text>
            </View>
          </StaggerItem>
        </View>
        <StaggerItem delay={120}>
          <View style={styles.weatherCard}>
            <CloudRain color="#0A84FF" size={18} strokeWidth={2.2} />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.weatherTemp}>68°</Text>
              <Text style={styles.weatherSub}>Rain</Text>
            </View>
          </View>
        </StaggerItem>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={[styles.bentoGrid, { flexDirection: isTablet ? 'row' : 'column' }]}>

          {/* ── Col 1 — Stats column ─────────────────────────── */}
          <View style={{ width: isTablet ? '36%' : '100%', gap: 14 }}>

            {/* Performance Card */}
            <StaggerItem delay={160}>
              <View style={styles.cell}>
                <View style={styles.cellHeader}>
                  <View style={styles.cellIconWrap}>
                    <Activity color="#FF9500" size={14} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.cellLabel}>Performance</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricBig}>{userProfile.hoursContributed}</Text>
                  <Text style={styles.metricUnit}>hrs</Text>
                </View>
                <Text style={styles.metricSub}>
                  {userRole === 'coach' ? 'Community service donated' : 'Logged in safe-zones'}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.badgePill}>
                    <Trophy color="#FF9500" size={11} strokeWidth={2.5} />
                    <Text style={styles.badgeText}>{userProfile.rankScore} XP</Text>
                  </View>
                  {(() => {
                    const tier = getTierInfo(userProfile.hoursContributed);
                    return (
                      <View style={[styles.badgePill, { borderColor: `${tier.color}40` }]}>
                        <Text style={styles.badgeTierIcon}>{tier.icon}</Text>
                        <Text style={[styles.badgeText, { color: tier.color }]}>{tier.name}</Text>
                      </View>
                    );
                  })()}
                </View>
              </View>
            </StaggerItem>

            {/* Safety Card */}
            <StaggerItem delay={220}>
              <View style={[styles.cell, styles.safetyCell]}>
                <View style={styles.cellHeader}>
                  <View style={[styles.cellIconWrap, { backgroundColor: 'rgba(52,199,89,0.16)' }]}>
                    <ShieldCheck color="#34C759" size={14} strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.cellLabel, { color: '#34C759' }]}>Safe-Zone Status</Text>
                </View>
                {userRole === 'student' ? (
                  <View>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Parent Link</Text>
                      <View style={styles.statusValueRow}>
                        <View style={[styles.statusDot, {
                          backgroundColor: userProfile.parentConnected ? '#34C759' : '#FF3B30',
                        }]} />
                        <Text style={[styles.statusValue, {
                          color: userProfile.parentConnected ? '#34C759' : '#FF3B30',
                        }]}>
                          {userProfile.parentConnected ? 'Secure' : 'Disconnected'}
                        </Text>
                      </View>
                    </View>
                    {!userProfile.parentConnected && (
                      <AnimBtn style={styles.secondaryBtn} onPress={connectParentDashboard}>
                        <ShieldCheck color="#34C759" size={14} strokeWidth={2.4} />
                        <Text style={styles.secondaryBtnText}>Connect Guardian</Text>
                      </AnimBtn>
                    )}
                  </View>
                ) : (
                  <View>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Vetting</Text>
                      <View style={styles.statusValueRow}>
                        <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
                        <Text style={[styles.statusValue, { color: '#34C759' }]}>Certified</Text>
                      </View>
                    </View>
                    <View style={styles.academyProgress}>
                      <Text style={styles.academyProgressLabel}>
                        Academy {completedModules}/{totalModules}
                      </Text>
                      <View style={styles.miniTrack}>
                        <View style={[styles.miniFill, { width: `${(completedModules / totalModules) * 100}%` }]} />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </StaggerItem>
          </View>

          {/* ── Col 2 — Sessions / Approvals ─────────────────── */}
          <View style={{ width: isTablet ? '64%' : '100%', flex: isTablet ? 1 : 0 }}>
            <StaggerItem delay={280}>
              <View style={styles.cell}>
                {userRole === 'student' ? (
                  <View>
                    <View style={styles.sectionHeadRow}>
                      <View style={styles.accentBar} />
                      <Text style={styles.cellTitleLg}>Available Safe-Zones</Text>
                      <View style={styles.countPill}>
                        <Text style={styles.countPillText}>{filteredSessions.length}</Text>
                      </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18, marginHorizontal: -4 }}>
                      <View style={styles.pillGroup}>
                        {SPORT_FILTERS.map(sport => {
                          const active = selectedSportFilter === sport;
                          return (
                            <AnimBtn
                              key={sport}
                              style={[styles.pill, active && styles.pillActive]}
                              onPress={() => setSelectedSportFilter(sport)}
                            >
                              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                {sport}
                              </Text>
                            </AnimBtn>
                          );
                        })}
                      </View>
                    </ScrollView>

                    {filteredSessions.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Sparkles color="#8E8E93" size={36} strokeWidth={1.8} />
                        <Text style={styles.emptyTitle}>No sessions found</Text>
                        <Text style={styles.emptyText}>Try a different sport filter</Text>
                      </View>
                    ) : (
                      filteredSessions.map((session, idx) => {
                        const isFull = session.attendees >= session.maxCapacity;
                        const accentColor = SPORT_COLOR[session.sport] || '#FF9500';
                        return (
                          <StaggerItem key={session.id} delay={340 + idx * 60}>
                            <View style={styles.sessionCard}>
                              <View style={[styles.sessionAccent, { backgroundColor: accentColor }]} />
                              <View style={{ flex: 1, paddingLeft: 14, paddingRight: 8 }}>
                                <View style={styles.sessionTitleRow}>
                                  <Text style={styles.sessionEmoji}>
                                    {SPORT_EMOJI[session.sport] || '🏃'}
                                  </Text>
                                  <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
                                </View>
                                <View style={styles.sessionMetaRow}>
                                  <MapPin color="#8E8E93" size={11} strokeWidth={2.2} />
                                  <Text style={styles.sessionMeta} numberOfLines={1}>
                                    {session.location}
                                  </Text>
                                </View>
                                <View style={styles.sessionMetaRow}>
                                  <Clock color={accentColor} size={11} strokeWidth={2.2} />
                                  <Text style={[styles.sessionTime, { color: accentColor }]}>
                                    {session.time} · {session.date}
                                  </Text>
                                </View>
                                <View style={styles.coachInfoRow}>
                                  <View style={styles.coachAvatarMini}>
                                    <Text style={styles.coachAvatarMiniChar}>
                                      {session.coachName.replace('Coach ', '').charAt(0)}
                                    </Text>
                                  </View>
                                  <Text style={styles.coachLine}>{session.coachName}</Text>
                                  <View style={styles.starRow}>
                                    <Star color="#FF9500" size={10} strokeWidth={2.4} fill="#FF9500" />
                                    <Text style={styles.coachRating}>{session.rating}</Text>
                                  </View>
                                </View>
                              </View>

                              <View style={styles.sessionRight}>
                                <View style={[styles.capacityBox, isFull && styles.capacityBoxFull]}>
                                  <Text style={[styles.capacityNum, isFull && { color: '#FF3B30' }]}>
                                    {session.attendees}<Text style={styles.capacityDenom}>/{session.maxCapacity}</Text>
                                  </Text>
                                  <Text style={[styles.capacityLabel, isFull && { color: '#FF3B30' }]}>
                                    {isFull ? 'FULL' : 'OPEN'}
                                  </Text>
                                </View>

                                {session.isUserEnrolled ? (
                                  <AnimBtn
                                    style={[styles.actionBtn, session.zoneVerified ? styles.btnVerified : styles.btnCheckin]}
                                    onPress={() => !session.zoneVerified && verifySafeZoneArrival(session.id)}
                                    disabled={session.zoneVerified}
                                  >
                                    {session.zoneVerified ? (
                                      <CheckCircle2 color="#FFFFFF" size={12} strokeWidth={2.6} />
                                    ) : (
                                      <MapPin color="#FFFFFF" size={12} strokeWidth={2.6} />
                                    )}
                                    <Text style={styles.actionText}>
                                      {session.zoneVerified ? 'Verified' : 'Check-In'}
                                    </Text>
                                  </AnimBtn>
                                ) : isFull ? (
                                  <AnimBtn
                                    style={[styles.actionBtn, styles.btnWaitlist]}
                                    onPress={() => joinWaitlist(session.id)}
                                  >
                                    <Text style={styles.actionText}>Waitlist</Text>
                                  </AnimBtn>
                                ) : (
                                  <AnimBtn
                                    style={[styles.actionBtn, styles.btnJoin]}
                                    onPress={() => handleJoinWithEquipment(session)}
                                  >
                                    <Text style={styles.actionText}>Join</Text>
                                  </AnimBtn>
                                )}
                              </View>
                            </View>
                          </StaggerItem>
                        );
                      })
                    )}
                  </View>
                ) : (
                  <View>
                    <View style={styles.sectionHeadRow}>
                      <View style={styles.accentBar} />
                      <Text style={styles.cellTitleLg}>Approvals Queue</Text>
                      <View style={styles.countPill}>
                        <Text style={styles.countPillText}>{pendingRequests.length}</Text>
                      </View>
                    </View>
                    {pendingRequests.length === 0 ? (
                      <View style={styles.emptyState}>
                        <CheckCircle2 color="#34C759" size={44} strokeWidth={1.8} />
                        <Text style={styles.emptyTitle}>All clear</Text>
                        <Text style={styles.emptyText}>No pending check-ins right now</Text>
                      </View>
                    ) : (
                      pendingRequests.map((req, idx) => (
                        <StaggerItem key={req.id} delay={340 + idx * 60}>
                          <View style={styles.requestCard}>
                            <View style={styles.requestAccent} />
                            <View style={{ flex: 1, paddingLeft: 14 }}>
                              <View style={styles.requestTitleRow}>
                                <View style={styles.requestAvatar}>
                                  <Text style={styles.requestAvatarChar}>
                                    {req.studentName.charAt(0)}
                                  </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.requestTitle}>{req.studentName}</Text>
                                  <Text style={styles.requestSport}>{req.sport} · {req.level}</Text>
                                </View>
                              </View>
                              <View style={styles.requestDetailRow}>
                                <MapPin color="#8E8E93" size={11} strokeWidth={2.2} />
                                <Text style={styles.requestSub}>{req.location}</Text>
                              </View>
                              <View style={styles.requestDetailRow}>
                                <Clock color="#FF9500" size={11} strokeWidth={2.2} />
                                <Text style={styles.requestTime}>{req.time}</Text>
                              </View>
                              {req.equipmentRequested?.length > 0 && (
                                <View style={styles.equipmentNeedBox}>
                                  <Text style={styles.equipmentNeedLabel}>EQUIPMENT</Text>
                                  <Text style={styles.equipmentNeedText}>
                                    {req.equipmentRequested.join(', ')}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.actionRow}>
                              <AnimBtn
                                style={[styles.circleBtn, styles.declineCircle]}
                                onPress={() => handlePendingRequest(req.id, 'decline')}
                                scaleTo={0.92}
                              >
                                <XCircle color="#FF3B30" size={22} strokeWidth={2.2} />
                              </AnimBtn>
                              <AnimBtn
                                style={[styles.circleBtn, styles.acceptCircle]}
                                onPress={() => handlePendingRequest(req.id, 'accept')}
                                scaleTo={0.92}
                              >
                                <CheckCircle2 color="#34C759" size={22} strokeWidth={2.2} />
                              </AnimBtn>
                            </View>
                          </View>
                        </StaggerItem>
                      ))
                    )}
                  </View>
                )}
              </View>
            </StaggerItem>
          </View>
        </View>
      </ScrollView>

      {/* Floating Safe-Zone footer + panic button */}
      <View style={[styles.footer, { bottom: insets.bottom + 72 }]}>
        <View style={styles.footerStatus}>
          <View style={styles.footerStatusDot} />
          <Text style={styles.footerText}>
            Safe-Zone <Text style={{ color: '#34C759', fontWeight: '800' }}>Active</Text>
          </Text>
        </View>
        <AnimBtn style={styles.panicBtn} onPress={triggerPanicButton} scaleTo={0.95}>
          <ShieldAlert color="#FFFFFF" size={14} strokeWidth={2.6} />
          <Text style={styles.panicText}>PANIC</Text>
        </AnimBtn>
      </View>

      {/* Certificate Modal */}
      {pendingCertificate && (
        <Modal visible transparent animationType="fade">
          <View style={styles.certOverlay}>
            <View style={styles.certCard}>
              <View style={styles.certEmojiWrap}>
                <Text style={styles.certEmoji}>{TIER_ICONS[pendingCertificate.tier]}</Text>
              </View>
              <Text style={styles.certHeading}>You've earned a</Text>
              <Text style={styles.certTitle}>Verified Community{'\n'}Service Certificate</Text>
              <View style={[styles.certTierBadge, { borderColor: TIER_COLORS[pendingCertificate.tier] }]}>
                <Text style={[styles.certTierText, { color: TIER_COLORS[pendingCertificate.tier] }]}>
                  {pendingCertificate.tier.toUpperCase()} TIER
                </Text>
              </View>
              <Text style={styles.certHours}>
                {pendingCertificate.hours.toFixed(1)} hrs documented
              </Text>
              {/* alignSelf: 'stretch' overrides certCard's alignItems: center so the
                  button fills the card width instead of collapsing to its text width. */}
              <View style={styles.certBtnWrap}>
                <AnimBtn style={styles.certBtn} onPress={claimCertificate}>
                  <Text style={styles.certBtnText}>Claim Certificate</Text>
                </AnimBtn>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 20 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingTop: 4, gap: 12 },
  welcomeLabel: { color: '#636366', fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 6 },
  welcomeText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -1, lineHeight: 32 },
  roleChipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1C1C1E', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1, borderColor: '#2C2C2E',
  },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleChipText: { color: '#E5E5EA', fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  locationText: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },

  weatherCard: {
    flexDirection: 'row', backgroundColor: '#1C1C1E',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E',
  },
  weatherTemp: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  weatherSub: { color: '#8E8E93', fontSize: 10, fontWeight: '600', marginTop: 1 },

  // Bento grid
  bentoGrid: { gap: 14 },
  cell: {
    backgroundColor: '#1C1C1E', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  safetyCell: {
    backgroundColor: '#0D1A0F',
    borderColor: 'rgba(52,199,89,0.22)',
  },
  cellHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cellIconWrap: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: 'rgba(255,149,0,0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  cellLabel: { color: '#AEAEB2', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },

  // Performance card
  metricRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  metricBig: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', letterSpacing: -2, lineHeight: 46 },
  metricUnit: { color: '#FF9500', fontSize: 16, fontWeight: '800' },
  metricSub: { color: '#8E8E93', fontSize: 12, marginTop: 4, fontWeight: '500' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  badgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#000000', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#2C2C2E',
  },
  badgeText: { color: '#E5E5EA', fontSize: 11, fontWeight: '700' },
  badgeTierIcon: { fontSize: 11 },

  // Safety card
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statusLabel: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  statusValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusValue: { fontSize: 13, fontWeight: '800', letterSpacing: -0.1 },

  secondaryBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(52,199,89,0.12)', paddingVertical: 11,
    borderRadius: 12, marginTop: 14, borderWidth: 1, borderColor: 'rgba(52,199,89,0.25)',
  },
  secondaryBtnText: { color: '#34C759', fontSize: 13, fontWeight: '700' },

  academyProgress: { marginTop: 12 },
  academyProgressLabel: { color: '#8E8E93', fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.2 },
  miniTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(52,199,89,0.15)', overflow: 'hidden' },
  miniFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 2 },

  // Section header
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  accentBar: { width: 3, height: 18, backgroundColor: '#FF9500', borderRadius: 2 },
  cellTitleLg: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.4, flex: 1 },
  countPill: {
    backgroundColor: 'rgba(255,149,0,0.12)', paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,149,0,0.22)',
  },
  countPillText: { color: '#FF9500', fontSize: 11, fontWeight: '800' },

  // Filter pills
  pillGroup: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  pill: {
    backgroundColor: '#000000', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 14, borderWidth: 1, borderColor: '#2C2C2E',
  },
  pillActive: {
    backgroundColor: '#FF9500', borderColor: '#FF9500',
    boxShadow: '0 6px 14px rgba(255,149,0,0.35)',
  },
  pillText: { color: '#8E8E93', fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: '#FFFFFF', fontWeight: '800' },

  // Session card
  sessionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0A0A0A', borderRadius: 14,
    paddingVertical: 14, paddingRight: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#1F1F1F', overflow: 'hidden',
  },
  sessionAccent: { width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: '#FF9500' },
  sessionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  sessionEmoji: { fontSize: 15 },
  sessionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: -0.2, flex: 1 },
  sessionMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  sessionMeta: { color: '#8E8E93', fontSize: 12, fontWeight: '500', flex: 1 },
  sessionTime: { fontSize: 12, fontWeight: '700' },
  coachInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 },
  coachAvatarMini: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,149,0,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  coachAvatarMiniChar: { color: '#FF9500', fontSize: 10, fontWeight: '800' },
  coachLine: { color: '#AEAEB2', fontSize: 12, fontWeight: '600', flex: 1 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  coachRating: { color: '#FF9500', fontSize: 11, fontWeight: '800' },

  sessionRight: { alignItems: 'flex-end', gap: 8, minWidth: 76 },
  capacityBox: {
    backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, alignItems: 'center', minWidth: 60,
  },
  capacityBoxFull: { backgroundColor: 'rgba(255,59,48,0.08)' },
  capacityNum: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: -0.4 },
  capacityDenom: { color: '#8E8E93', fontSize: 11, fontWeight: '600' },
  capacityLabel: { color: '#34C759', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginTop: 1 },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, minWidth: 76,
  },
  btnJoin: { backgroundColor: '#FF9500', boxShadow: '0 4px 10px rgba(255,149,0,0.35)' },
  btnCheckin: { backgroundColor: '#34C759', boxShadow: '0 4px 10px rgba(52,199,89,0.35)' },
  btnVerified: { backgroundColor: '#2C2C2E' },
  btnWaitlist: { backgroundColor: '#0A84FF', boxShadow: '0 4px 10px rgba(10,132,255,0.35)' },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.1 },

  // Request card (coach)
  requestCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0A0A0A', borderRadius: 14,
    paddingVertical: 14, paddingRight: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#1F1F1F', overflow: 'hidden',
  },
  requestAccent: { width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: '#FF9500' },
  requestTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  requestAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,149,0,0.16)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.28)',
  },
  requestAvatarChar: { color: '#FF9500', fontSize: 14, fontWeight: '800' },
  requestTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  requestSport: { color: '#FF9500', fontSize: 12, fontWeight: '700', marginTop: 2 },
  requestDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  requestSub: { color: '#8E8E93', fontSize: 12, fontWeight: '500' },
  requestTime: { color: '#E5E5EA', fontSize: 12, fontWeight: '700' },
  equipmentNeedBox: {
    backgroundColor: 'rgba(10,132,255,0.08)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    marginTop: 8, borderWidth: 1, borderColor: 'rgba(10,132,255,0.18)',
  },
  equipmentNeedLabel: { color: '#0A84FF', fontSize: 9, fontWeight: '800', letterSpacing: 0.6, marginBottom: 2 },
  equipmentNeedText: { color: '#E5E5EA', fontSize: 12, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  circleBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  acceptCircle: {
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderWidth: 1, borderColor: 'rgba(52,199,89,0.32)',
  },
  declineCircle: {
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,59,48,0.32)',
  },

  // Empty state
  emptyState: { paddingVertical: 44, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 4, letterSpacing: -0.2 },
  emptyText: { color: '#8E8E93', fontSize: 13, fontWeight: '500' },

  // Floating footer
  footer: {
    position: 'absolute', left: 20, right: 20, height: 54,
    backgroundColor: 'rgba(28,28,30,0.96)', borderRadius: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, borderWidth: 1, borderColor: '#2C2C2E',
    boxShadow: '0 -8px 24px rgba(0,0,0,0.45)',
  },
  footerStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759', boxShadow: '0 0 8px rgba(52,199,89,0.6)' },
  footerText: { color: '#AEAEB2', fontSize: 12, fontWeight: '600' },
  panicBtn: {
    backgroundColor: '#FF3B30', flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    boxShadow: '0 4px 14px rgba(255,59,48,0.55)',
  },
  panicText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },

  // Cert modal
  certOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  certCard: {
    backgroundColor: '#1C1C1E', borderRadius: 28, padding: 36, alignItems: 'center',
    borderWidth: 1, borderColor: '#2C2C2E', width: '100%',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  },
  certEmojiWrap: {
    width: 88, height: 88, borderRadius: 28, backgroundColor: '#000000',
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  certEmoji: { fontSize: 52 },
  certHeading: { color: '#8E8E93', fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.2 },
  certTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', textAlign: 'center', lineHeight: 30, marginBottom: 20, letterSpacing: -0.6 },
  certTierBadge: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, marginBottom: 16 },
  certTierText: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  certHours: { color: '#8E8E93', fontSize: 13, marginBottom: 32, fontWeight: '500' },
  certBtnWrap: { alignSelf: 'stretch' },
  certBtn: {
    backgroundColor: '#FF9500', borderRadius: 16, paddingVertical: 20,
    alignItems: 'center',
    boxShadow: '0 8px 22px rgba(255,149,0,0.4)',
  },
  certBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.2 },
});
