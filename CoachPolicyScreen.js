import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  useWindowDimensions, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, FileText,
  Users, MapPin, ChevronRight,
} from 'lucide-react-native';
import { useRally } from '../context/RallyContext';

const POLICIES = [
  {
    id: 'p1',
    icon: AlertTriangle,
    iconColor: '#FF3B30',
    iconBg: 'rgba(255,59,48,0.12)',
    title: 'Child Safety & Mandatory Reporting',
    description:
      'You are required by law to report any suspected abuse or neglect to the appropriate authorities. RallyUp coaches are mandatory reporters under NYC child protection laws.',
  },
  {
    id: 'p2',
    icon: Users,
    iconColor: '#FF9500',
    iconBg: 'rgba(255,149,0,0.12)',
    title: 'Code of Conduct',
    description:
      'All interactions with youth must remain professional, positive, and respectful at all times. Misconduct of any kind results in immediate suspension.',
  },
  {
    id: 'p3',
    icon: FileText,
    iconColor: '#0A84FF',
    iconBg: 'rgba(10,132,255,0.12)',
    title: 'Background Check Consent',
    description:
      "You consent to a third-party background check by RallyUp's institutional partners before leading any sessions. Annual rechecks are required.",
  },
  {
    id: 'p4',
    icon: ShieldCheck,
    iconColor: '#34C759',
    iconBg: 'rgba(52,199,89,0.12)',
    title: 'Parental Supervision Requirement',
    description:
      'A parent or guardian must be physically present and GPS-verified before any session begins. Sessions may never start without confirmed guardian presence.',
  },
  {
    id: 'p5',
    icon: MapPin,
    iconColor: '#BF5AF2',
    iconBg: 'rgba(191,90,242,0.12)',
    title: 'Safe Zone Policy',
    description:
      'All sessions must take place exclusively at RallyUp-certified partner sites. Private residences and unverified locations are strictly prohibited.',
  },
];

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

export default function CoachPolicyScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const { agreeToCoachPolicy } = useRally();
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24) }]}>

      {/* Header */}
      <StaggerItem delay={0}>
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <ShieldCheck color="#34C759" size={22} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Coach Policy Agreement</Text>
            <Text style={styles.headerSub}>Required before activating your account</Text>
          </View>
        </View>
      </StaggerItem>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <StaggerItem delay={60}>
          <Text style={styles.intro}>
            By activating your RallyUp coach account, you agree to uphold the following
            standards to protect the safety and wellbeing of every youth in the program.
          </Text>
        </StaggerItem>

        {POLICIES.map((policy, idx) => {
          const Icon = policy.icon;
          return (
            <StaggerItem key={policy.id} delay={120 + idx * 60}>
              <View style={styles.policyCard}>
                <View style={[styles.policyIconWrap, { backgroundColor: policy.iconBg }]}>
                  <Icon color={policy.iconColor} size={18} strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.policyTitle}>{policy.title}</Text>
                  <Text style={styles.policyDesc}>{policy.description}</Text>
                </View>
              </View>
            </StaggerItem>
          );
        })}

        <StaggerItem delay={480}>
          <AnimBtn
            style={[styles.ackBox, acknowledged && styles.ackBoxActive]}
            onPress={() => setAcknowledged(!acknowledged)}
          >
            <View style={[styles.checkbox, acknowledged && styles.checkboxActive]}>
              {acknowledged && <CheckCircle2 color="#FFFFFF" size={14} strokeWidth={3} />}
            </View>
            <Text style={styles.ackText}>
              I have read and understand all policies above
            </Text>
          </AnimBtn>
        </StaggerItem>
      </ScrollView>

      {/* Sticky agree button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <AnimBtn
          style={[styles.agreeBtn, !acknowledged && styles.agreeBtnDisabled]}
          onPress={() => acknowledged && agreeToCoachPolicy()}
          disabled={!acknowledged}
        >
          <ShieldCheck color="#FFFFFF" size={18} strokeWidth={2.5} />
          <Text style={styles.agreeBtnText}>Activate Account</Text>
          <ChevronRight color="#FFFFFF" size={18} strokeWidth={2.5} />
        </AnimBtn>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 18,
    borderBottomWidth: 1, borderBottomColor: '#1F1F22',
  },
  headerIconWrap: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(52,199,89,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(52,199,89,0.28)',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: '#8E8E93', fontSize: 13, marginTop: 2, fontWeight: '500' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  tabletContent: { maxWidth: 600, alignSelf: 'center', width: '100%' },

  intro: { color: '#AEAEB2', fontSize: 14, lineHeight: 22, marginBottom: 20, fontWeight: '500' },

  policyCard: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E', borderRadius: 16,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  policyIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  policyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  policyDesc: { color: '#8E8E93', fontSize: 13, lineHeight: 20, marginTop: 4, fontWeight: '500' },

  // Acknowledgment checkbox
  ackBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1C1C1E', borderRadius: 14,
    padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  ackBoxActive: {
    borderColor: '#FF9500',
    backgroundColor: 'rgba(255,149,0,0.06)',
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 7,
    borderWidth: 1.5, borderColor: '#3A3A3C',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: '#FF9500', borderColor: '#FF9500' },
  ackText: { color: '#E5E5EA', fontSize: 14, fontWeight: '600', flex: 1 },

  footer: {
    paddingHorizontal: 20, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: '#1F1F22',
    backgroundColor: '#000000',
  },
  agreeBtn: {
    backgroundColor: '#FF9500', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    boxShadow: '0 8px 22px rgba(255,149,0,0.4)',
  },
  agreeBtnDisabled: { opacity: 0.35, boxShadow: 'none' },
  agreeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
});
