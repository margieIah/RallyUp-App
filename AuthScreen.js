import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput,
  useWindowDimensions, KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Award, ShieldCheck, Users, MapPin, ArrowRight, CheckCircle,
  ChevronDown, ChevronLeft, Sparkles,
} from 'lucide-react-native';
import { useRally } from '../context/RallyContext';

const NYC_BOROUGHS = ['Brooklyn', 'Manhattan', 'Queens', 'The Bronx', 'Staten Island'];
const SPORTS = [
  { id: 1, label: 'Basketball', icon: '🏀' },
  { id: 2, label: 'Volleyball', icon: '🏐' },
  { id: 3, label: 'Soccer', icon: '⚽' },
];
const SKILLS = [
  { id: 1, label: 'Beginner' },
  { id: 2, label: 'Intermediate' },
  { id: 3, label: 'Expert' },
];

// Subtle press scale (Emil: 0.97 is the sweet spot; never aggressive)
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

// Staggered fade-in for entering elements
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

const BoroughPicker = ({ value, onSelect }) => {
  const [open, setOpen] = useState(false);
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rot, {
      toValue: open ? 1 : 0,
      duration: 180,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();
  }, [open]);

  const rotateDeg = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={{ width: '100%' }}>
      <Text style={styles.fieldLabel}>Borough</Text>
      <AnimBtn style={styles.dropdown} onPress={() => setOpen(!open)}>
        <Text style={{ color: value ? '#FFFFFF' : '#636366', fontSize: 16, fontWeight: value ? '600' : '400' }}>
          {value || 'Select your borough'}
        </Text>
        <Animated.View style={{ transform: [{ rotate: rotateDeg }] }}>
          <ChevronDown color="#8E8E93" size={18} />
        </Animated.View>
      </AnimBtn>
      {open && (
        <View style={styles.dropdownList}>
          {NYC_BOROUGHS.map((b, i) => (
            <TouchableOpacity
              key={b}
              style={[styles.dropdownItem, i === NYC_BOROUGHS.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => { onSelect(b); setOpen(false); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.dropdownText, value === b && { color: '#FF9500', fontWeight: '700' }]}>{b}</Text>
              {value === b && <CheckCircle color="#FF9500" size={16} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const ChipGroup = ({ label, options, selected, onSelect, withIcon }) => (
  <View style={styles.chipSection}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.chipRow}>
      {options.map(opt => {
        const active = selected === opt.label;
        return (
          <AnimBtn
            key={opt.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt.label)}
          >
            {withIcon && <Text style={styles.chipIcon}>{opt.icon}</Text>}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </AnimBtn>
        );
      })}
    </View>
  </View>
);

// Premium progress bar replaces dots — fills smoothly as user advances
const ProgressBar = ({ current, total = 3 }) => {
  const pct = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pct, {
      toValue: (current + 1) / total,
      duration: 420,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: false,
    }).start();
  }, [current]);
  const widthInterp = pct.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: widthInterp }]} />
      </View>
      <Text style={styles.progressLabel}>Step {current + 1} of {total}</Text>
    </View>
  );
};

export default function AuthScreen({ onComplete }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width > 768;
  const { setUserRole, setUserProfile } = useRally();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [borough, setBorough] = useState('');
  const [sport, setSport] = useState('');
  const [skill, setSkill] = useState('');
  const [nameError, setNameError] = useState('');

  // Slide + fade between steps (Emil: ease-out for entering, fast crossfade with light slide)
  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();
  }, [step]);

  const goToStep = (next) => {
    Animated.timing(stepAnim, {
      toValue: 0,
      duration: 140,
      easing: Easing.bezier(0.4, 0, 1, 1),
      useNativeDriver: true,
    }).start(() => setStep(next));
  };

  const handleFinish = () => {
    const trimmed = name.trim();
    if (!trimmed) { setNameError('Please enter your name.'); return; }
    setNameError('');
    setUserRole(role);
    setUserProfile({
      name: trimmed,
      borough: borough || 'Brooklyn',
      sport: sport || 'Basketball',
      skillLevel: skill || 'Intermediate',
      hoursContributed: role === 'student' ? 0 : 9,
      rankScore: role === 'student' ? 0 : 75,
      parentConnected: role === 'coach',
    });
    onComplete();
  };

  const stepTransform = stepAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 32) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, isTablet && styles.tabletCard]}>

          {/* Back chevron on step > 0 — predictable nav (UX rule) */}
          {step > 0 && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => goToStep(step - 1)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronLeft color="#8E8E93" size={22} />
            </TouchableOpacity>
          )}

          {/* Step 0: Splash */}
          {step === 0 && (
            <Animated.View
              style={[
                styles.stepContainer,
                { opacity: stepAnim, transform: [{ translateY: stepTransform }] },
              ]}
            >
              <StaggerItem delay={0}>
                <View style={styles.brandRow}>
                  <View style={styles.brandLogo}>
                    <Award color="#FF9500" size={32} strokeWidth={2.5} />
                  </View>
                </View>
              </StaggerItem>

              <StaggerItem delay={80}>
                <Text style={styles.brand}>RallyUp</Text>
              </StaggerItem>

              <StaggerItem delay={140}>
                <Text style={styles.hero}>Every kid deserves a coach.</Text>
              </StaggerItem>

              <StaggerItem delay={200} style={{ marginTop: 36 }}>
                <Text style={styles.lede}>
                  Free, community-led sports mentorship at verified NYC safe-zones.
                  Built for the kids the system forgot.
                </Text>
              </StaggerItem>

              <View style={{ marginTop: 32, gap: 12 }}>
                <StaggerItem delay={280}>
                  <View style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(52,199,89,0.12)' }]}>
                      <ShieldCheck color="#34C759" size={20} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>Verified safe-zones</Text>
                      <Text style={styles.featureSub}>GPS-confirmed, guardian-present</Text>
                    </View>
                  </View>
                </StaggerItem>

                <StaggerItem delay={340}>
                  <View style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(255,149,0,0.12)' }]}>
                      <Users color="#FF9500" size={20} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>Community-led coaches</Text>
                      <Text style={styles.featureSub}>Background-checked volunteers</Text>
                    </View>
                  </View>
                </StaggerItem>

                <StaggerItem delay={400}>
                  <View style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(10,132,255,0.12)' }]}>
                      <MapPin color="#0A84FF" size={20} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>NYC institutional sites</Text>
                      <Text style={styles.featureSub}>DYCD, NYCHA, partner schools</Text>
                    </View>
                  </View>
                </StaggerItem>
              </View>

              <StaggerItem delay={500} style={{ marginTop: 40 }}>
                <AnimBtn style={styles.primaryBtn} onPress={() => goToStep(1)}>
                  <Text style={styles.primaryText}>Get Started</Text>
                  <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} style={{ marginLeft: 6 }} />
                </AnimBtn>
              </StaggerItem>

              <StaggerItem delay={560} style={{ marginTop: 16 }}>
                <View style={styles.proofRow}>
                  <Sparkles color="#FF9500" size={12} strokeWidth={2.5} />
                  <Text style={styles.proofText}>JA Social Innovation Challenge — Finalist</Text>
                </View>
              </StaggerItem>
            </Animated.View>
          )}

          {/* Step 1: Role */}
          {step === 1 && (
            <Animated.View
              style={[
                styles.stepContainer,
                { opacity: stepAnim, transform: [{ translateY: stepTransform }] },
              ]}
            >
              <ProgressBar current={1} />
              <StaggerItem delay={60}>
                <Text style={styles.header}>How will you rally?</Text>
                <Text style={styles.subHeader}>Choose your role to personalize the experience.</Text>
              </StaggerItem>

              <View style={{ gap: 12, marginTop: 28 }}>
                <StaggerItem delay={140}>
                  <AnimBtn
                    style={[styles.roleBtn, role === 'coach' && styles.roleActive]}
                    onPress={() => setRole('coach')}
                  >
                    <View style={[styles.roleIconWrap, role === 'coach' && { backgroundColor: 'rgba(255,149,0,0.16)' }]}>
                      <ShieldCheck color={role === 'coach' ? '#FF9500' : '#8E8E93'} size={22} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleBtnText, role === 'coach' && { color: '#FFFFFF' }]}>
                        Volunteer Coach
                      </Text>
                      <Text style={styles.roleBtnSub}>Lead safe-zone sessions for youth</Text>
                    </View>
                    <View style={[styles.roleRadio, role === 'coach' && styles.roleRadioActive]}>
                      {role === 'coach' && <View style={styles.roleRadioInner} />}
                    </View>
                  </AnimBtn>
                </StaggerItem>

                <StaggerItem delay={200}>
                  <AnimBtn
                    style={[styles.roleBtn, role === 'student' && styles.roleActive]}
                    onPress={() => setRole('student')}
                  >
                    <View style={[styles.roleIconWrap, role === 'student' && { backgroundColor: 'rgba(255,149,0,0.16)' }]}>
                      <Users color={role === 'student' ? '#FF9500' : '#8E8E93'} size={22} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleBtnText, role === 'student' && { color: '#FFFFFF' }]}>
                        Student / Player
                      </Text>
                      <Text style={styles.roleBtnSub}>Join sessions and learn a sport</Text>
                    </View>
                    <View style={[styles.roleRadio, role === 'student' && styles.roleRadioActive]}>
                      {role === 'student' && <View style={styles.roleRadioInner} />}
                    </View>
                  </AnimBtn>
                </StaggerItem>
              </View>

              <StaggerItem delay={260} style={{ marginTop: 32 }}>
                <AnimBtn
                  style={[styles.primaryBtn, !role && styles.primaryBtnDisabled]}
                  onPress={() => role && goToStep(2)}
                  disabled={!role}
                >
                  <Text style={styles.primaryText}>Continue</Text>
                  <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} style={{ marginLeft: 6 }} />
                </AnimBtn>
              </StaggerItem>
            </Animated.View>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <Animated.View
              style={[
                styles.stepContainer,
                { opacity: stepAnim, transform: [{ translateY: stepTransform }] },
              ]}
            >
              <ProgressBar current={2} />
              <StaggerItem delay={60}>
                <Text style={styles.header}>Tell us about you</Text>
                <Text style={styles.subHeader}>We'll use this to find your safe-zones.</Text>
              </StaggerItem>

              <View style={{ gap: 22, marginTop: 28 }}>
                <StaggerItem delay={120}>
                  <View>
                    <Text style={styles.fieldLabel}>Your Name</Text>
                    <TextInput
                      style={[styles.input, nameError && styles.inputError]}
                      placeholder="e.g. Marcus Vance"
                      placeholderTextColor="#636366"
                      value={name}
                      onChangeText={t => { setName(t); setNameError(''); }}
                      autoCapitalize="words"
                      returnKeyType="done"
                    />
                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                  </View>
                </StaggerItem>

                <StaggerItem delay={180}>
                  <BoroughPicker value={borough} onSelect={setBorough} />
                </StaggerItem>

                <StaggerItem delay={240}>
                  <ChipGroup label="Primary Sport" options={SPORTS} selected={sport} onSelect={setSport} withIcon />
                </StaggerItem>

                <StaggerItem delay={300}>
                  <ChipGroup label="Skill Level" options={SKILLS} selected={skill} onSelect={setSkill} />
                </StaggerItem>
              </View>

              <StaggerItem delay={380} style={{ marginTop: 36 }}>
                <AnimBtn style={styles.primaryBtn} onPress={handleFinish}>
                  <Text style={styles.primaryText}>Complete Setup</Text>
                  <CheckCircle color="#FFFFFF" size={18} strokeWidth={2.5} style={{ marginLeft: 6 }} />
                </AnimBtn>
              </StaggerItem>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  card: { width: '100%' },
  tabletCard: { maxWidth: 480, alignSelf: 'center' },
  stepContainer: { flex: 1, justifyContent: 'center' },

  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#1C1C1E',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#2C2C2E',
  },

  // Progress bar (Step 1 + Step 2)
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#1C1C1E', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FF9500', borderRadius: 2 },
  progressLabel: { color: '#636366', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },

  // Splash hero
  brandRow: { alignItems: 'center', marginBottom: 24 },
  brandLogo: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.35)',
    boxShadow: '0 8px 28px rgba(255,149,0,0.25)',
  },
  brand: {
    color: '#FFFFFF', fontSize: 56, fontWeight: '900',
    textAlign: 'center', letterSpacing: -2.4, lineHeight: 60,
  },
  hero: {
    color: '#FF9500', fontSize: 16, fontWeight: '700',
    textAlign: 'center', marginTop: 8, letterSpacing: 0.1,
  },
  lede: {
    color: '#AEAEB2', fontSize: 15, lineHeight: 22,
    textAlign: 'center', fontWeight: '400',
  },

  // Feature rows on splash
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  featureIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  featureTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },
  featureSub: { color: '#8E8E93', fontSize: 12, marginTop: 2, fontWeight: '500' },

  // Primary CTA
  primaryBtn: {
    backgroundColor: '#FF9500', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    boxShadow: '0 10px 24px rgba(255,149,0,0.35)',
  },
  primaryBtnDisabled: { opacity: 0.35 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  proofRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center',
  },
  proofText: { color: '#8E8E93', fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },

  // Step headers
  header: {
    color: '#FFFFFF', fontSize: 30, fontWeight: '900',
    letterSpacing: -1.2, lineHeight: 34,
  },
  subHeader: {
    color: '#8E8E93', fontSize: 15, marginTop: 8,
    fontWeight: '400', lineHeight: 21,
  },

  // Role cards
  roleBtn: {
    flexDirection: 'row', backgroundColor: '#1C1C1E',
    borderWidth: 1.5, borderColor: '#2C2C2E', borderRadius: 18,
    padding: 18, alignItems: 'center', gap: 14,
  },
  roleActive: {
    borderColor: '#FF9500',
    backgroundColor: 'rgba(255,149,0,0.06)',
    boxShadow: '0 8px 20px rgba(255,149,0,0.15)',
  },
  roleIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center', alignItems: 'center',
  },
  roleBtnText: { color: '#AEAEB2', fontSize: 16, fontWeight: '700', letterSpacing: -0.1 },
  roleBtnSub: { color: '#636366', fontSize: 13, marginTop: 3, fontWeight: '500' },
  roleRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#3A3A3C',
    justifyContent: 'center', alignItems: 'center',
  },
  roleRadioActive: { borderColor: '#FF9500' },
  roleRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF9500' },

  // Form fields
  fieldLabel: {
    color: '#AEAEB2', fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 10, marginLeft: 2,
  },
  input: {
    backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#2C2C2E',
    borderRadius: 14, padding: 16, color: '#FFFFFF',
    fontSize: 16, fontWeight: '500',
  },
  inputError: { borderColor: '#FF3B30' },
  errorText: { color: '#FF3B30', fontSize: 13, marginTop: 8, marginLeft: 4, fontWeight: '500' },

  // Borough dropdown
  dropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#2C2C2E',
    borderRadius: 14, padding: 16,
  },
  dropdownList: {
    backgroundColor: '#1C1C1E', borderRadius: 14, padding: 4,
    marginTop: 8, borderWidth: 1, borderColor: '#2C2C2E',
    boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
  },
  dropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#2C2C2E',
  },
  dropdownText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },

  // Chips
  chipSection: { },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', backgroundColor: '#1C1C1E',
    borderWidth: 1, borderColor: '#2C2C2E', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11, alignItems: 'center', gap: 8,
  },
  chipActive: {
    backgroundColor: '#FF9500', borderColor: '#FF9500',
    boxShadow: '0 6px 16px rgba(255,149,0,0.35)',
  },
  chipIcon: { fontSize: 15 },
  chipText: { color: '#8E8E93', fontWeight: '700', fontSize: 14 },
  chipTextActive: { color: '#FFFFFF' },
});
