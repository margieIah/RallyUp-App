import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Modal, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User, Award, Shield, Zap, RefreshCw, CheckCircle2,
  BookOpen, ChevronRight, Trophy, Heart,
} from 'lucide-react-native';
import { useRally } from '../context/RallyContext';

function getTierInfo(hours) {
  if (hours >= 50) return { name: 'Master',  icon: '👑', color: '#34C759' };
  if (hours >= 10) return { name: 'Veteran', icon: '🔥', color: '#FF9500' };
  return                  { name: 'Trained', icon: '🎓', color: '#AEAEB2' };
}

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

// Animated progress fill — Emil: use transitions over keyframes for interruptible UI
const AnimatedProgressBar = ({ pct, color = '#FF9500' }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 800,
      delay: 200,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const widthInterp = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width: widthInterp, backgroundColor: color }]} />
    </View>
  );
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    userRole, setUserRole,
    userProfile, setUserProfile,
    academyModules, completeAcademyModule,
    agreeToCoachPolicy, resetDemo,
  } = useRally();

  const [showCertModal, setShowCertModal] = useState(false);
  const tierInfo = getTierInfo(userProfile.hoursContributed);

  const togglePersona = () => {
    const newRole = userRole === 'student' ? 'coach' : 'student';
    setUserRole(newRole);
    if (newRole === 'coach') agreeToCoachPolicy();
    setUserProfile({
      name: newRole === 'student' ? 'Marcus Vance' : 'Coach Elena',
      borough: 'Brooklyn',
      sport: newRole === 'student' ? 'Soccer' : 'Basketball',
      skillLevel: newRole === 'student' ? 'Intermediate' : 'Expert',
      hoursContributed: newRole === 'student' ? 12 : 9,
      rankScore: newRole === 'student' ? 124 : 75,
      parentConnected: newRole !== 'student',
    });
    Alert.alert('Persona Switched', `Switched to ${newRole.toUpperCase()} view across all tabs.`);
  };

  const allModulesComplete = academyModules.every(m => m.completed);
  const completedCount = academyModules.filter(m => m.completed).length;
  const progressPct = academyModules.length > 0 ? completedCount / academyModules.length : 0;

  // Next tier progress
  const nextTierHours = userProfile.hoursContributed >= 50 ? 50
    : userProfile.hoursContributed >= 10 ? 50 : 10;
  const prevTierHours = userProfile.hoursContributed >= 50 ? 50
    : userProfile.hoursContributed >= 10 ? 10 : 0;
  const tierProgress = userProfile.hoursContributed >= 50 ? 1
    : Math.min(1, (userProfile.hoursContributed - prevTierHours) / (nextTierHours - prevTierHours));

  return (
    <View style={[styles.outer, { paddingTop: Math.max(insets.top, 20) }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile Header ─────────────────────────────── */}
        <StaggerItem delay={0}>
          <View style={styles.profileCard}>
            <View style={styles.avatarGlow}>
              <View style={styles.avatar}>
                <User color="#FF9500" size={28} strokeWidth={2.2} />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 16, minWidth: 0 }}>
              <Text style={styles.userName} numberOfLines={1}>{userProfile.name}</Text>
              <Text style={styles.userSub} numberOfLines={1}>
                {userRole === 'student' ? 'Youth Athlete' : 'Verified Coach'} · {userProfile.borough}
              </Text>
              <View style={styles.sportRow}>
                <View style={styles.sportTag}>
                  <Text style={styles.sportTagText}>{userProfile.sport}</Text>
                </View>
                <View style={styles.sportTag}>
                  <Text style={styles.sportTagText}>{userProfile.skillLevel}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.roleBadge, userRole === 'coach' ? styles.coachBadge : styles.studentBadge]}>
              <View style={[styles.roleBadgeDot, { backgroundColor: userRole === 'coach' ? '#34C759' : '#0A84FF' }]} />
              <Text style={[styles.roleBadgeText, { color: userRole === 'coach' ? '#34C759' : '#0A84FF' }]}>
                {userRole.toUpperCase()}
              </Text>
            </View>
          </View>
        </StaggerItem>

        {/* ── Metrics ────────────────────────────────────── */}
        <StaggerItem delay={60} style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>
              {userProfile.hoursContributed}<Text style={styles.metricValUnit}>h</Text>
            </Text>
            <Text style={styles.metricLabel}>{userRole === 'student' ? 'Safe Hours' : 'Donated'}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>{userProfile.rankScore}</Text>
            <Text style={styles.metricLabel}>{userRole === 'student' ? 'Impact' : 'Mentor XP'}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricEmoji}>{tierInfo.icon}</Text>
            <Text style={[styles.metricLabel, { color: tierInfo.color }]}>{tierInfo.name}</Text>
          </View>
        </StaggerItem>

        {/* ── Tier Progress ──────────────────────────────── */}
        <StaggerItem delay={120}>
          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <View style={styles.tierIconWrap}>
                <Trophy color={tierInfo.color} size={14} strokeWidth={2.5} />
              </View>
              <Text style={styles.tierLabel}>TIER PROGRESS</Text>
              {userProfile.hoursContributed >= 50 ? (
                <Text style={[styles.tierEnd, { color: tierInfo.color }]}>MAX</Text>
              ) : (
                <Text style={styles.tierEnd}>
                  <Text style={{ color: tierInfo.color, fontWeight: '900' }}>
                    {(nextTierHours - userProfile.hoursContributed).toFixed(1)}h
                  </Text>
                  {' '}to next
                </Text>
              )}
            </View>
            <AnimatedProgressBar pct={tierProgress} color={tierInfo.color} />
          </View>
        </StaggerItem>

        {/* View Certificate */}
        {userRole === 'coach' && (
          <StaggerItem delay={180}>
            <AnimBtn style={styles.certViewBtn} onPress={() => setShowCertModal(true)}>
              <View style={styles.certViewIcon}>
                <Award color="#FF9500" size={15} strokeWidth={2.4} />
              </View>
              <Text style={styles.certViewBtnText}>View My Certificate</Text>
              <ChevronRight color="#FF9500" size={16} strokeWidth={2.4} />
            </AnimBtn>
          </StaggerItem>
        )}

        {/* ── Credentials ────────────────────────────────── */}
        <StaggerItem delay={240}>
          <View style={styles.sectionHeadRow}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>Institutional Credentials</Text>
          </View>
        </StaggerItem>

        <StaggerItem delay={280}>
          <View style={styles.infoBlock}>
            {userRole === 'student' ? (
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(52,199,89,0.12)' }]}>
                  <Shield color="#34C759" size={18} strokeWidth={2.3} />
                </View>
                <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
                  <Text style={styles.infoTitle}>Guardian Safe Link</Text>
                  <Text style={styles.infoSub}>
                    {userProfile.parentConnected ? 'Encrypted active channel' : 'Awaiting secure invite'}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: userProfile.parentConnected ? '#34C759' : '#FF3B30' }]} />
              </View>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(52,199,89,0.12)' }]}>
                    <CheckCircle2 color="#34C759" size={18} strokeWidth={2.3} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
                    <Text style={styles.infoTitle}>NYC DOJ Background Check</Text>
                    <Text style={styles.infoSub}>Cleared & certified through 2027</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(255,149,0,0.12)' }]}>
                    <Heart color="#FF9500" size={18} strokeWidth={2.3} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
                    <Text style={styles.infoTitle}>First Aid & CPR Certified</Text>
                    <Text style={styles.infoSub}>American Red Cross verified</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
                </View>
              </>
            )}
          </View>
        </StaggerItem>

        {/* ── Coach Academy ──────────────────────────────── */}
        {userRole === 'coach' && (
          <>
            <StaggerItem delay={340}>
              <View style={styles.sectionHeadRow}>
                <View style={styles.accentBar} />
                <Text style={styles.sectionTitle}>RallyUp Training Academy</Text>
                {allModulesComplete && (
                  <View style={styles.certBadge}>
                    <CheckCircle2 color="#34C759" size={11} strokeWidth={2.6} />
                    <Text style={styles.certText}>Certified</Text>
                  </View>
                )}
              </View>
            </StaggerItem>

            {!allModulesComplete && (
              <StaggerItem delay={380}>
                <View style={styles.progressContainer}>
                  <View style={{ flex: 1 }}>
                    <AnimatedProgressBar pct={progressPct} />
                  </View>
                  <Text style={styles.progressLabel}>{completedCount}/{academyModules.length}</Text>
                </View>
              </StaggerItem>
            )}

            <StaggerItem delay={420}>
              <View style={styles.academyCard}>
                {academyModules.map((mod, index) => (
                  <View key={mod.id}>
                    {index > 0 && <View style={styles.moduleDivider} />}
                    <View style={styles.moduleRow}>
                      <View style={[
                        styles.moduleIconWrap,
                        { backgroundColor: mod.completed ? 'rgba(52,199,89,0.12)' : '#2C2C2E' },
                      ]}>
                        <BookOpen
                          color={mod.completed ? '#34C759' : '#8E8E93'}
                          size={16}
                          strokeWidth={2.3}
                        />
                      </View>
                      <View style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
                        <Text style={[styles.moduleTitle, mod.completed && styles.struck]}>
                          {mod.title}
                        </Text>
                        <Text style={styles.moduleSub}>
                          {mod.duration} · +{mod.xp} XP
                        </Text>
                      </View>
                      {mod.completed ? (
                        <View style={styles.doneBadge}>
                          <CheckCircle2 color="#34C759" size={12} strokeWidth={2.6} />
                          <Text style={styles.doneText}>Done</Text>
                        </View>
                      ) : (
                        <AnimBtn style={styles.certifyBtn} onPress={() => completeAcademyModule(mod.id)}>
                          <Text style={styles.certifyText}>Certify</Text>
                        </AnimBtn>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </StaggerItem>
          </>
        )}

        {/* ── Presentation Controller ────────────────────── */}
        <StaggerItem delay={500}>
          <View style={styles.demoBox}>
            <View style={styles.demoHeader}>
              <Zap color="#FF3B30" size={13} strokeWidth={2.6} fill="#FF3B30" />
              <Text style={styles.demoTitle}>PRESENTATION CONTROLLER</Text>
            </View>
            <Text style={styles.demoSub}>
              Switch between student and coach views during your live pitch to demonstrate both sides of the platform.
            </Text>
            <AnimBtn style={styles.toggleStrip} onPress={togglePersona}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={styles.toggleIconWrap}>
                  <RefreshCw color="#FF9500" size={16} strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Switch Persona</Text>
                  <Text style={styles.toggleStatus}>
                    Currently: <Text style={{ color: '#FF9500', fontWeight: '800' }}>{userRole.toUpperCase()}</Text>
                  </Text>
                </View>
              </View>
              <ChevronRight color="#636366" size={18} strokeWidth={2.4} />
            </AnimBtn>
          </View>
        </StaggerItem>

        {/* Reset Demo */}
        <StaggerItem delay={560}>
          <AnimBtn style={styles.resetBtn} onPress={resetDemo}>
            <Text style={styles.resetBtnText}>Reset Demo</Text>
          </AnimBtn>
        </StaggerItem>

      </ScrollView>

      {/* Certificate Modal */}
      {showCertModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.certOverlay}>
            <View style={styles.certCard}>
              <View style={styles.certEmojiWrap}>
                <Text style={styles.certEmoji}>{tierInfo.icon}</Text>
              </View>
              <Text style={styles.certHeading}>Your Current Certificate</Text>
              <Text style={styles.certTitle}>Verified Community{'\n'}Service Certificate</Text>
              <View style={[styles.certTierBadge, { borderColor: tierInfo.color }]}>
                <Text style={[styles.certTierText, { color: tierInfo.color }]}>
                  {tierInfo.name.toUpperCase()} TIER
                </Text>
              </View>
              <Text style={styles.certHours}>
                {userProfile.hoursContributed.toFixed(1)} hrs documented
              </Text>
              <AnimBtn style={styles.certBtn} onPress={() => setShowCertModal(false)}>
                <Text style={styles.certBtnText}>Close</Text>
              </AnimBtn>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#000000' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },

  // Profile header
  profileCard: {
    flexDirection: 'row', backgroundColor: '#1C1C1E',
    borderRadius: 20, padding: 18, alignItems: 'center',
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  avatarGlow: {
    width: 64, height: 64, borderRadius: 22,
    backgroundColor: 'rgba(255,149,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.3)',
    boxShadow: '0 6px 18px rgba(255,149,0,0.18)',
  },
  avatar: {
    width: 50, height: 50, borderRadius: 18,
    backgroundColor: 'rgba(255,149,0,0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  userName: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
  userSub: { color: '#8E8E93', fontSize: 13, marginTop: 3, fontWeight: '500' },
  sportRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  sportTag: {
    backgroundColor: '#2C2C2E', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1, borderColor: '#3A3A3C',
  },
  sportTagText: { color: '#E5E5EA', fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },

  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1,
  },
  roleBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  studentBadge: { backgroundColor: 'rgba(10,132,255,0.1)', borderColor: 'rgba(10,132,255,0.3)' },
  coachBadge: { backgroundColor: 'rgba(52,199,89,0.1)', borderColor: 'rgba(52,199,89,0.3)' },
  roleBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  // Metrics row
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  metric: {
    flex: 1, backgroundColor: '#1C1C1E', paddingVertical: 16,
    paddingHorizontal: 12, borderRadius: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#2C2C2E', minHeight: 86,
    justifyContent: 'center',
  },
  metricVal: { color: '#FF9500', fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
  metricValUnit: { fontSize: 14, fontWeight: '800' },
  metricEmoji: { fontSize: 26, lineHeight: 30 },
  metricLabel: {
    color: '#8E8E93', fontSize: 10, marginTop: 5, fontWeight: '700',
    textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Tier progress
  tierCard: {
    backgroundColor: '#1C1C1E', borderRadius: 16,
    padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  tierHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tierIconWrap: {
    width: 22, height: 22, borderRadius: 7,
    backgroundColor: 'rgba(255,149,0,0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  tierLabel: { color: '#AEAEB2', fontSize: 11, fontWeight: '800', letterSpacing: 0.7, flex: 1 },
  tierEnd: { color: '#8E8E93', fontSize: 11, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#2C2C2E', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // Certificate view button
  certViewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 12, backgroundColor: '#1C1C1E',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.25)',
  },
  certViewIcon: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: 'rgba(255,149,0,0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  certViewBtnText: { color: '#FF9500', fontSize: 14, fontWeight: '800', flex: 1 },

  // Section headers
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 12 },
  accentBar: { width: 3, height: 14, backgroundColor: '#FF9500', borderRadius: 2 },
  sectionTitle: { color: '#AEAEB2', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 },
  certBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,199,89,0.12)',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(52,199,89,0.25)',
  },
  certText: { color: '#34C759', fontSize: 10, fontWeight: '800' },

  // Credential block
  infoBlock: {
    backgroundColor: '#1C1C1E', borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: '#2C2C2E',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center', alignItems: 'center',
  },
  infoTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },
  infoSub: { color: '#8E8E93', fontSize: 12, marginTop: 3, fontWeight: '500' },
  infoDivider: { height: 1, backgroundColor: '#2C2C2E', marginVertical: 14 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  // Academy
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  progressLabel: { color: '#AEAEB2', fontSize: 11, fontWeight: '800', minWidth: 32, textAlign: 'right' },

  academyCard: {
    backgroundColor: '#1C1C1E', borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: '#2C2C2E',
  },
  moduleRow: { flexDirection: 'row', alignItems: 'center' },
  moduleIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  moduleTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },
  struck: { color: '#636366', textDecorationLine: 'line-through' },
  moduleSub: { color: '#8E8E93', fontSize: 12, marginTop: 2, fontWeight: '500' },
  moduleDivider: { height: 1, backgroundColor: '#2C2C2E', marginVertical: 14 },
  doneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,199,89,0.12)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(52,199,89,0.25)',
  },
  doneText: { color: '#34C759', fontSize: 11, fontWeight: '800' },
  certifyBtn: {
    backgroundColor: '#0A84FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    boxShadow: '0 3px 10px rgba(10,132,255,0.4)',
  },
  certifyText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  // Demo box
  demoBox: {
    backgroundColor: '#140F0F', borderColor: 'rgba(255,59,48,0.22)',
    borderWidth: 1, borderRadius: 18, padding: 18, marginTop: 24, marginBottom: 10,
  },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  demoTitle: { color: '#FF3B30', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  demoSub: { color: '#8E8E93', fontSize: 13, lineHeight: 20, marginBottom: 2, fontWeight: '500' },
  toggleStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 14, backgroundColor: '#000000',
    padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  toggleIconWrap: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: 'rgba(255,149,0,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.22)',
  },
  toggleLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: -0.1 },
  toggleStatus: { color: '#8E8E93', fontSize: 12, fontWeight: '600', marginTop: 2 },

  resetBtn: {
    borderWidth: 1, borderColor: '#2C2C2E', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 12, marginBottom: 8,
  },
  resetBtnText: { color: '#636366', fontSize: 14, fontWeight: '700' },

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
  certHours: { color: '#8E8E93', fontSize: 13, marginBottom: 28, fontWeight: '500' },
  certBtn: {
    backgroundColor: '#FF9500', borderRadius: 16, paddingVertical: 18,
    width: '100%', alignItems: 'center',
    boxShadow: '0 8px 22px rgba(255,149,0,0.4)',
  },
  certBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.2 },
});
