import React, { createContext, useContext, useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  Alert, TextInput, Modal, KeyboardAvoidingView, Platform, StatusBar,
  Dimensions, Switch, FlatList
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  ShieldCheck, MapPin, Calendar, User, Award, ArrowRight, CheckCircle,
  Activity, Star, Users, XCircle, MessageSquare, ChevronDown, Send,
  AlertTriangle, CloudRain, Zap, Heart, ShoppingBag, ShieldAlert,
  BookOpen, ChevronRight, Filter, Clock, PlusCircle, ThumbsUp
} from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// 1. STATE MANAGEMENT & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const RallyContext = createContext();
const NYC_BOROUGHS = ['Brooklyn', 'Manhattan', 'Queens', 'The Bronx', 'Staten Island'];
const TOP_PADDING = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Coach tier thresholds as defined in the organizer
const COACH_TIERS = [
  { label: 'Trained',   minHours: 0,  icon: '🎓', color: '#AEAEB2' },
  { label: 'Veteran',   minHours: 10, icon: '🔥', color: '#FF9500' },
  { label: 'Master',    minHours: 50, icon: '⚡', color: '#FFD600' },
];

const getCoachTier = (hours) =>
  [...COACH_TIERS].reverse().find((t) => hours >= t.minHours) || COACH_TIERS[0];

// Coach Academy modules required before a coach can go live (from organizer Section VIII)
const ACADEMY_MODULES = [
  { id: 'safety',    title: 'Child Safety & Mandatory Reporting',      icon: '🛡️' },
  { id: 'pedagogy',  title: 'Age-Appropriate Pedagogy',                icon: '📚' },
  { id: 'conflict',  title: 'Conflict Resolution & Positive Reinforcement', icon: '🤝' },
];

// Seed anchor sessions: coaches post these, students browse & join
const SEED_SESSIONS = [
  {
    id: 'a1', coachName: 'Coach Elena', sport: 'Volleyball', skill: 'Beginner',
    location: 'Betsy Head Park • Brownsville', borough: 'Brooklyn',
    date: 'Tue Apr 8', time: '4:00 PM – 5:30 PM',
    maxStudents: 6, enrolled: 4, partner: true, coachHours: 152,
  },
  {
    id: 'a2', coachName: 'Coach Marcus', sport: 'Basketball', skill: 'Intermediate',
    location: 'Rucker Park • Harlem', borough: 'Manhattan',
    date: 'Wed Apr 9', time: '3:30 PM – 5:00 PM',
    maxStudents: 8, enrolled: 8, partner: true, coachHours: 124,
  },
  {
    id: 'a3', coachName: 'Coach Sarah', sport: 'Soccer', skill: 'Beginner',
    location: 'Roberto Clemente Park • South Bronx', borough: 'The Bronx',
    date: 'Thu Apr 10', time: '4:30 PM – 6:00 PM',
    maxStudents: 6, enrolled: 3, partner: false, coachHours: 98,
  },
  {
    id: 'a4', coachName: 'Coach Devon', sport: 'Basketball', skill: 'Advanced',
    location: 'Flushing Meadows Park • Queens', borough: 'Queens',
    date: 'Fri Apr 11', time: '5:00 PM – 6:30 PM',
    maxStudents: 5, enrolled: 5, partner: true, coachHours: 67,
  },
];

const RallyProvider = ({ children }) => {
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [regData, setRegData] = useState({
    role: '',
    name: '',
    neighborhood: '',
    sport: '',
    skill: '',
    isPro: true,
    parentConnected: false,
    parentOnSite: false,
    // Coach Academy state
    academyModules: {},   // { moduleId: true } when completed
    academyComplete: false,
    coachHours: 0,        // drives tier badge on profile
  });

  // Waitlist state: { sessionId: true } for sessions the user has joined the waitlist for
  const [waitlist, setWaitlist] = useState({});

  // Post-session rating modal
  const [ratingModal, setRatingModal] = useState({ visible: false, sessionId: null });

  const attemptCheckIn = () => {
    if (!regData.parentOnSite && regData.role === 'child') {
      Alert.alert(
        'Safety Hold',
        "Protocol requires a Parent/Guardian to be physically present and toggled 'On-Site' before session start."
      );
      return;
    }
    Alert.alert('Safe Zone Verified', 'GPS & Guardian Presence confirmed at NYC Partner Site. Session is live.');
  };

  const triggerPanic = () => {
    Alert.alert(
      'Emergency Alert',
      'Dispatching community safety alert and notifying NYC emergency contacts immediately.',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', style: 'destructive' }]
    );
  };

  const joinWaitlist = (sessionId) => {
    setWaitlist((prev) => ({ ...prev, [sessionId]: true }));
    Alert.alert(
      '📋 Added to Waitlist',
      "You're on the waitlist! We'll notify you if a spot opens — and we'll work on finding more coaches in this area."
    );
  };

  const completeAcademyModule = (moduleId) => {
    const updated = { ...regData.academyModules, [moduleId]: true };
    const allDone = ACADEMY_MODULES.every((m) => updated[m.id]);
    setRegData((prev) => ({ ...prev, academyModules: updated, academyComplete: allDone }));
  };

  const submitCoachRating = (sessionId, rating) => {
    setRatingModal({ visible: false, sessionId: null });
    Alert.alert('Thank you!', `Your ${rating}-star rating has been submitted. Your feedback helps keep RallyUp safe.`);
  };

  return (
    <RallyContext.Provider value={{
      onboardingStep, setOnboardingStep,
      regData, setRegData,
      waitlist, joinWaitlist,
      ratingModal, setRatingModal, submitCoachRating,
      attemptCheckIn, triggerPanic,
      completeAcademyModule,
    }}>
      {children}
    </RallyContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const PartnerBadge = ({ label = 'Partner Verified' }) => (
  <View style={styles.partnerBadge}>
    <ShieldCheck color="white" size={12} />
    <Text style={styles.partnerBadgeText}>{label}</Text>
  </View>
);

// Dynamic tier badge driven by coach hours
const TierBadge = ({ hours }) => {
  const tier = getCoachTier(hours);
  return (
    <View style={[styles.tierBadge, { borderColor: tier.color }]}>
      <Text style={styles.tierBadgeIcon}>{tier.icon}</Text>
      <Text style={[styles.tierBadgeText, { color: tier.color }]}>{tier.label}</Text>
    </View>
  );
};

const ImpactTicker = () => (
  <View style={styles.tickerContainer}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Text style={styles.tickerText}>🔥 IMPACT: 450 hrs in Brooklyn </Text>
      <Text style={styles.tickerText}> | 210 hrs in Queens </Text>
      <Text style={styles.tickerText}> | 185 hrs in Manhattan </Text>
      <Text style={styles.tickerText}> | 95 hrs in Bronx </Text>
    </ScrollView>
  </View>
);

const WeatherWidget = () => (
  <View style={styles.weatherCard}>
    <CloudRain color="#0A84FF" size={24} />
    <View style={{ marginLeft: 12 }}>
      <Text style={styles.weatherTitle}>68°F • Light Rain</Text>
      <Text style={styles.weatherSubText}>Indoor Safe-Zones Recommended</Text>
    </View>
  </View>
);

const EquipmentRequestModal = ({ visible, onClose, coachName }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <ShoppingBag color="#FF9500" size={40} style={{ alignSelf: 'center', marginBottom: 15 }} />
        <Text style={styles.sectionTitle}>Equipment Request</Text>
        <Text style={styles.subText}>Coach {coachName} will bring gear to the Partner Site.</Text>
        {['Basketball / Gear', 'Proper Footwear', 'Water Bottle'].map((item) => (
          <TouchableOpacity key={item} style={styles.checkRow} onPress={() => Alert.alert('Noted!')}>
            <View style={styles.squareCheck} />
            <Text style={styles.checkText}>{item}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.onboardingButton} onPress={onClose}>
          <Text style={styles.buttonText}>Confirm & Book</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// Post-session parent rating modal (organizer Section VIII)
const ParentRatingModal = ({ visible, onSubmit, onClose }) => {
  const [selected, setSelected] = useState(0);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ThumbsUp color="#34C759" size={40} style={{ alignSelf: 'center', marginBottom: 15 }} />
          <Text style={styles.sectionTitle}>Rate Your Coach</Text>
          <Text style={styles.subText}>How well did the coach teach your child today?</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 10 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setSelected(n)}>
                <Star
                  color={n <= selected ? '#FFD600' : '#3A3A3C'}
                  fill={n <= selected ? '#FFD600' : 'transparent'}
                  size={36}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.onboardingButton, { marginTop: 25 }]}
            onPress={() => { if (selected > 0) onSubmit(selected); else Alert.alert('Please select a rating.'); }}
          >
            <Text style={styles.buttonText}>Submit Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 15, alignSelf: 'center' }}>
            <Text style={{ color: '#8E8E93', fontWeight: '600' }}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const BoroughPicker = ({ value, onSelect }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ width: '100%', marginTop: 15 }}>
      <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setVisible(true)}>
        <Text style={{ color: value ? 'white' : '#8E8E93' }}>{value || 'Select Borough'}</Text>
        <ChevronDown color="#8E8E93" size={20} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Select Neighborhood</Text>
            {NYC_BOROUGHS.map((b) => (
              <TouchableOpacity key={b} style={styles.modalOption} onPress={() => { onSelect(b); setVisible(false); }}>
                <Text style={styles.buttonText}>{b}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setVisible(false)} style={{ marginTop: 20 }}>
              <Text style={{ color: '#FF3B30', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SelectionGroup = ({ label, options, selectedValue, onSelect }) => (
  <View style={styles.selectionWrapper}>
    <Text style={styles.selectionLabel}>{label}</Text>
    <View style={styles.chipContainer}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.chip, selectedValue === opt.label && styles.chipActive]}
          onPress={() => onSelect(opt.label)}
        >
          <Text style={styles.chipIcon}>{opt.icon}</Text>
          <Text style={[styles.chipText, selectedValue === opt.label && styles.chipTextActive]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const SessionItem = ({ title, subtitle, time, date, isPast, onConfirm, onDecline, onChat }) => (
  <View style={[styles.miniSessionCard, isPast && { opacity: 0.6 }]}>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.miniSessionTitle}>{title}</Text>
        <PartnerBadge />
      </View>
      <Text style={styles.miniSessionSub}>{subtitle ? `${subtitle} • ` : ''}{date} • {time}</Text>
    </View>
    {!isPast && (
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={onChat} style={styles.actionIcon}><MessageSquare color="#FF9500" size={20} /></TouchableOpacity>
        <TouchableOpacity onPress={onDecline} style={styles.actionIcon}><XCircle color="#FF3B30" size={22} /></TouchableOpacity>
        <TouchableOpacity onPress={onConfirm} style={styles.actionIcon}><CheckCircle color="#34C759" size={22} /></TouchableOpacity>
      </View>
    )}
  </View>
);

// Anchor session card — used in both ExploreScreen and a coach's PostSessionScreen
const AnchorCard = ({ session, onJoin, onWaitlist, isWaitlisted }) => {
  const isFull = session.enrolled >= session.maxStudents;
  const tier = getCoachTier(session.coachHours);
  const spotsLeft = session.maxStudents - session.enrolled;

  return (
    <View style={styles.anchorCard}>
      <View style={styles.anchorCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.anchorCoach}>{session.coachName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text style={styles.tierBadgeIcon}>{tier.icon}</Text>
            <Text style={[styles.anchorTierLabel, { color: tier.color }]}>{tier.label}</Text>
            {session.partner && <PartnerBadge label="DYCD Verified" />}
          </View>
        </View>
        <View style={[styles.sportPill, isFull && { backgroundColor: '#2C2C2E' }]}>
          <Text style={[styles.sportPillText, isFull && { color: '#8E8E93' }]}>
            {isFull ? 'FULL' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
          </Text>
        </View>
      </View>

      <View style={styles.anchorMeta}>
        <Text style={styles.anchorMetaText}>🏅 {session.sport} • {session.skill}</Text>
        <Text style={styles.anchorMetaText}>📍 {session.location}</Text>
        <Text style={styles.anchorMetaText}>🗓 {session.date} · {session.time}</Text>
        <Text style={styles.anchorMetaText}>
          👥 {session.enrolled}/{session.maxStudents} students
        </Text>
      </View>

      {isFull ? (
        <TouchableOpacity
          style={[styles.anchorJoinButton, isWaitlisted && styles.anchorWaitlistActive]}
          onPress={isWaitlisted ? undefined : onWaitlist}
          disabled={isWaitlisted}
        >
          <Clock color="white" size={16} style={{ marginRight: 6 }} />
          <Text style={styles.buttonText}>{isWaitlisted ? 'On Waitlist ✓' : 'Join Waitlist'}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.anchorJoinButton} onPress={onJoin}>
          <Text style={styles.buttonText}>Join Cohort →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. ONBOARDING FLOW
// ─────────────────────────────────────────────────────────────────────────────

const OnboardingFlow = () => {
  const { onboardingStep, setOnboardingStep, regData, setRegData, completeAcademyModule } = useContext(RallyContext);

  // Step 0 — Splash / safety overview
  if (onboardingStep === 0) {
    return (
      <View style={[styles.onboardingContainer, { paddingTop: TOP_PADDING }]}>
        <View style={styles.onboardingContent}>
          <View style={styles.iconCircle}><Award color="#FF9500" size={60} /></View>
          <Text style={styles.onboardingTitle}>RallyUp</Text>
          <Text style={styles.heroText}>Every Kid Deserves A Coach.</Text>
          <View style={styles.safetyBox}>
            <View style={styles.safetyItem}><ShieldCheck color="#34C759" size={18} /><Text style={styles.safetyText}>Mandatory Parental Presence</Text></View>
            <View style={styles.safetyItem}><Users color="#FF9500" size={18} /><Text style={styles.safetyText}>Institutional Partner Sites</Text></View>
            <View style={styles.safetyItem}><MapPin color="#5856D6" size={18} /><Text style={styles.safetyText}>GPS Permit-Zone Verification</Text></View>
          </View>
          <TouchableOpacity style={styles.onboardingButton} onPress={() => setOnboardingStep(1)}>
            <Text style={styles.buttonText}>Get Started</Text>
            <ArrowRight color="white" size={20} style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 1 — Role selection
  if (onboardingStep === 1) {
    return (
      <View style={[styles.onboardingContainer, { paddingTop: TOP_PADDING }]}>
        <View style={styles.onboardingContent}>
          <Text style={styles.header}>Create Account</Text>
          <TouchableOpacity
            style={[styles.roleButton, regData.role === 'volunteer' && styles.roleActive]}
            onPress={() => setRegData({ ...regData, role: 'volunteer' })}
          >
            <Text style={styles.buttonText}>I am a Volunteer Coach</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, regData.role === 'child' && styles.roleActive]}
            onPress={() => setRegData({ ...regData, role: 'child' })}
          >
            <Text style={styles.buttonText}>I am a Student / Player</Text>
          </TouchableOpacity>
          {regData.role !== '' && (
            <TouchableOpacity style={styles.onboardingButton} onPress={() => setOnboardingStep(2)}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Step 2 — Profile info (name, borough, sport, skill)
  if (onboardingStep === 2) {
    const sports = [
      { id: 1, label: 'Basketball', icon: '🏀' },
      { id: 2, label: 'Volleyball', icon: '🏐' },
      { id: 3, label: 'Swimming',   icon: '🏊' },
      { id: 4, label: 'Tennis',     icon: '🎾' },
      { id: 5, label: 'Soccer',     icon: '⚽' },
    ];
    const skills = [
      { id: 1, label: 'Beginner',     icon: '🌱' },
      { id: 2, label: 'Intermediate', icon: '🔥' },
      { id: 3, label: 'Advanced',     icon: '🏆' },
      { id: 4, label: 'Expert',       icon: '⚡' },
    ];
    // Coaches go to Coach Academy next; students go straight to the app
    const nextStep = regData.role === 'volunteer' ? 3 : 4;
    return (
      <View style={[styles.onboardingContainer, { paddingTop: TOP_PADDING }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
          <View style={styles.onboardingContent}>
            <Text style={styles.header}>Tell us about you</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#8E8E93"
              onChangeText={(t) => setRegData({ ...regData, name: t })}
            />
            <BoroughPicker value={regData.neighborhood} onSelect={(val) => setRegData({ ...regData, neighborhood: val })} />
            <SelectionGroup label="Choose your Sport" options={sports} selectedValue={regData.sport} onSelect={(val) => setRegData({ ...regData, sport: val })} />
            <SelectionGroup label="Your Skill Level" options={skills} selectedValue={regData.skill} onSelect={(val) => setRegData({ ...regData, skill: val })} />
            <TouchableOpacity style={styles.onboardingButton} onPress={() => setOnboardingStep(nextStep)}>
              <Text style={styles.buttonText}>{regData.role === 'volunteer' ? 'Continue to Coach Academy' : 'Complete Setup'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Step 3 — Coach Academy (coaches only; students skip to step 4)
  if (onboardingStep === 3 && regData.role === 'volunteer') {
    const allDone = ACADEMY_MODULES.every((m) => regData.academyModules[m.id]);

    return (
      <View style={[styles.onboardingContainer, { paddingTop: TOP_PADDING }]}>
        <ScrollView contentContainerStyle={{ padding: 30, paddingBottom: 60 }}>
          <View style={styles.iconCircle}><BookOpen color="#FF9500" size={48} /></View>
          <Text style={[styles.header, { textAlign: 'center', marginTop: 10 }]}>Coach Academy</Text>
          <Text style={[styles.subText, { textAlign: 'center', marginBottom: 20 }]}>
            Complete all three modules before your first session.
          </Text>

          {ACADEMY_MODULES.map((mod) => {
            const done = !!regData.academyModules[mod.id];
            return (
              <TouchableOpacity
                key={mod.id}
                style={[styles.academyModuleCard, done && styles.academyModuleDone]}
                onPress={() => {
                  if (!done) {
                    Alert.alert(
                      mod.title,
                      'Complete this training module to unlock the next step.',
                      [
                        { text: 'Later', style: 'cancel' },
                        { text: 'Mark Complete ✓', onPress: () => completeAcademyModule(mod.id) },
                      ]
                    );
                  }
                }}
              >
                <Text style={styles.academyModuleIcon}>{mod.icon}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.academyModuleTitle, done && { color: '#34C759' }]}>{mod.title}</Text>
                  <Text style={styles.academyModuleSub}>{done ? 'Completed ✓' : 'Tap to complete'}</Text>
                </View>
                {done
                  ? <CheckCircle color="#34C759" size={22} />
                  : <ChevronRight color="#3A3A3C" size={22} />
                }
              </TouchableOpacity>
            );
          })}

          {allDone && (
            <TouchableOpacity style={[styles.onboardingButton, { marginTop: 30 }]} onPress={() => setOnboardingStep(4)}>
              <Text style={styles.buttonText}>Enter RallyUp 🎉</Text>
            </TouchableOpacity>
          )}

          {!allDone && (
            <Text style={[styles.subText, { textAlign: 'center', marginTop: 25 }]}>
              Complete all modules to unlock the app.
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }

  return null; // step 4+ handled by RallyConsumer → main nav
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. MAIN SCREENS
// ─────────────────────────────────────────────────────────────────────────────

const HomeScreen = ({ navigation }) => {
  const { regData, setRegData, attemptCheckIn, triggerPanic, setRatingModal } = useContext(RallyContext);
  const isCoach = regData.role === 'volunteer';

  return (
    <View style={[styles.container, { paddingTop: TOP_PADDING }]}>
      <ImpactTicker />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.header}>{isCoach ? 'Coach Dashboard' : 'Student Dashboard'}</Text>
            <Text style={styles.subText}>Welcome back, {regData.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={triggerPanic} style={styles.panicButtonCircle}>
            <AlertTriangle color="white" size={24} />
          </TouchableOpacity>
        </View>

        <WeatherWidget />

        {/* Active session card */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View>
              <Text style={styles.sessionTitle}>{regData.sport || 'Basketball'} Practice</Text>
              <PartnerBadge label="DYCD Partner Site" />
            </View>
            <View style={styles.liveBadge}><Text style={styles.liveText}>TODAY</Text></View>
          </View>
          <View style={styles.sessionDetailRow}><Calendar color="#8E8E93" size={16} /><Text style={styles.sessionDetailText}>4:00 PM – 5:30 PM</Text></View>
          <View style={styles.sessionDetailRow}><MapPin color="#8E8E93" size={16} /><Text style={styles.sessionDetailText}>Central Park Safe-Zone • Court 4</Text></View>

          <View style={styles.coachStrip}>
            <View style={styles.coachAvatar}>
              {isCoach ? <Users color="white" size={14} /> : <User color="white" size={14} />}
            </View>
            <View>
              <Text style={styles.coachName}>{isCoach ? '12 Students Attending' : 'Coach Marcus'}</Text>
              <Text style={styles.coachStatus}>{isCoach ? 'Check-in list ready' : 'Veteran Coach • 4.9 ★'}</Text>
            </View>
          </View>

          {/* Mandatory parent presence toggle (student view) */}
          {!isCoach && (
            <View style={styles.liabilityBox}>
              <View style={styles.rowCentered}>
                <ShieldAlert color={regData.parentOnSite ? '#34C759' : '#FF3B30'} size={20} />
                <Text style={styles.liabilityText}>Guardian Physically Present?</Text>
                <Switch
                  value={regData.parentOnSite}
                  onValueChange={(val) => setRegData({ ...regData, parentOnSite: val })}
                  thumbColor={regData.parentOnSite ? '#34C759' : '#f4f3f4'}
                />
              </View>
              {!regData.parentOnSite && <Text style={styles.liabilityWarning}>* Required for session start</Text>}
            </View>
          )}

          {!isCoach && (
            <TouchableOpacity
              style={[styles.checkInButton, !regData.parentOnSite && { backgroundColor: '#3A3A3C' }]}
              onPress={attemptCheckIn}
            >
              <ShieldCheck color="white" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Verify Safe-Zone Arrival</Text>
            </TouchableOpacity>
          )}

          {/* Post-session rating trigger (parent view after session) */}
          {!isCoach && (
            <TouchableOpacity
              style={[styles.checkInButton, { backgroundColor: '#2C2C2E', marginTop: 8 }]}
              onPress={() => setRatingModal({ visible: true, sessionId: 'a1' })}
            >
              <Star color="#FFD600" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Rate Today's Coach</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Community impact shortcuts */}
        <Text style={styles.sectionTitle}>Community Impact</Text>
        <TouchableOpacity style={styles.topCoachesGui} onPress={() => navigation.navigate('Explore')}>
          <View style={{ flex: 1 }}>
            <Text style={styles.topCoachesTitle}>Top Coaches in {regData.neighborhood || 'NYC'}</Text>
            <Text style={styles.topCoachesSub}>Based on Volunteer Hours Donated</Text>
          </View>
          <Award color="#FFD600" size={24} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryActionCard} onPress={() => navigation.navigate('Explore')}>
          <MapPin color="#FF9500" size={20} />
          <Text style={styles.secondaryActionText}>
            Browse Anchor Sessions in {regData.neighborhood || 'Brooklyn'}
          </Text>
          <ArrowRight color="#8E8E93" size={18} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── Explore Screen ───────────────────────────────────────────────────────────
const ExploreScreen = ({ navigation }) => {
  const { regData } = useContext(RallyContext);
  const { waitlist, joinWaitlist } = useContext(RallyContext);
  const isCoach = regData.role === 'volunteer';

  const [activeItem, setActiveItem] = useState(null);
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [sportFilter, setSportFilter] = useState('All');
  const [viewMode, setViewMode] = useState('sessions'); // 'sessions' | 'map'

  const sports = ['All', 'Basketball', 'Volleyball', 'Soccer', 'Tennis'];

  const filteredSessions = sportFilter === 'All'
    ? SEED_SESSIONS
    : SEED_SESSIONS.filter((s) => s.sport === sportFilter);

  const leaders = [
    { id: 1, name: 'Coach Elena',  hours: 152, sport: 'Volleyball', top: 200, left: 150, partner: true },
    { id: 2, name: 'Coach Marcus', hours: 124, sport: 'Basketball',  top: 500, left: 300, partner: true },
    { id: 3, name: 'Coach Sarah',  hours: 98,  sport: 'Soccer',      top: 800, left: 100, partner: false },
  ];

  return (
    <View style={[styles.container, { paddingTop: TOP_PADDING }]}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={styles.header}>Explore</Text>
        <Text style={styles.subText}>
          {isCoach ? 'Manage your anchor sessions' : `Find sessions near ${regData.neighborhood || 'NYC'}`}
        </Text>

        {/* View mode toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'sessions' && styles.toggleBtnActive]}
            onPress={() => setViewMode('sessions')}
          >
            <Text style={[styles.toggleBtnText, viewMode === 'sessions' && { color: 'white' }]}>Sessions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.toggleBtnText, viewMode === 'map' && { color: 'white' }]}>Map</Text>
          </TouchableOpacity>
        </View>

        {/* Sport filter chips */}
        {viewMode === 'sessions' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {sports.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.filterChip, sportFilter === s && styles.filterChipActive]}
                onPress={() => setSportFilter(s)}
              >
                <Text style={[styles.filterChipText, sportFilter === s && { color: 'white' }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {viewMode === 'sessions' ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {isCoach && (
            <TouchableOpacity style={styles.postSessionButton} onPress={() => Alert.alert('Post Anchor Session', 'Session posting coming in next build.')}>
              <PlusCircle color="white" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Post an Anchor Session</Text>
            </TouchableOpacity>
          )}

          {filteredSessions.length === 0 ? (
            <Text style={[styles.subText, { textAlign: 'center', marginTop: 40 }]}>
              No sessions found for {sportFilter}. Check back soon!
            </Text>
          ) : (
            filteredSessions.map((session) => (
              <AnchorCard
                key={session.id}
                session={session}
                isWaitlisted={!!waitlist[session.id]}
                onJoin={() => {
                  setActiveItem(session);
                  setShowEquipModal(true);
                }}
                onWaitlist={() => joinWaitlist(session.id)}
              />
            ))
          )}

          {/* Leaderboard */}
          <Text style={styles.sectionTitle}>🏆 Volunteer Leaderboard</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {leaders.map((l, index) => (
              <View key={l.id} style={styles.leaderCard}>
                <Text style={styles.leaderRank}>#{index + 1}</Text>
                <TierBadge hours={l.hours} />
                <Text style={styles.leaderName}>{l.name}</Text>
                <Text style={styles.leaderHours}>{l.hours} hrs</Text>
              </View>
            ))}
          </ScrollView>
        </ScrollView>
      ) : (
        // Map view (original behavior preserved)
        <>
          <View style={styles.mockMapContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ width: 1000, height: 1000 }}>
                <View style={styles.mapGridLineH} />
                <View style={styles.mapGridLineV} />
                {leaders.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.mapPin, { top: item.top, left: item.left }]}
                    onPress={() => setActiveItem(item)}
                  >
                    <MapPin color={item.partner ? '#34C759' : '#FF9500'} size={45} />
                    {item.partner && <View style={styles.pinShield}><ShieldCheck color="white" size={10} /></View>}
                    <View style={styles.pinLabel}><Text style={styles.pinLabelText}>{item.name}</Text></View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>
          </View>

          {activeItem && (
            <View style={styles.mapSheet}>
              <View style={styles.sheetHeader}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.sheetName}>{activeItem.name}</Text>
                    <CheckCircle color="#34C759" size={16} style={{ marginLeft: 8 }} />
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    <PartnerBadge label={activeItem.partner ? 'DYCD Partner Verified' : 'Public Space'} />
                  </View>
                  <Text style={styles.sheetBio}>{activeItem.hours} hrs Contributed • {activeItem.sport}</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveItem(null)}><XCircle color="#8E8E93" size={24} /></TouchableOpacity>
              </View>
              <View style={styles.actionRowMap}>
                <TouchableOpacity style={[styles.sheetButton, { flex: 1 }]} onPress={() => setShowEquipModal(true)}>
                  <Text style={styles.buttonText}>Join Cohort</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.messageButtonCircle}
                  onPress={() => { setActiveItem(null); navigation.navigate('Inbox', { chatWith: activeItem.name }); }}
                >
                  <MessageSquare color="white" size={24} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      <EquipmentRequestModal
        visible={showEquipModal}
        onClose={() => { setShowEquipModal(false); setActiveItem(null); }}
        coachName={activeItem?.coachName || activeItem?.name}
      />
    </View>
  );
};

// ─── Inbox Screen ─────────────────────────────────────────────────────────────
const InboxScreen = ({ route, navigation }) => {
  const { regData } = useContext(RallyContext);
  const isCoach = regData.role === 'volunteer';
  const [chatUser, setChatUser] = useState(route.params?.chatWith || null);
  const [msg, setMsg] = useState('');

  if (chatUser) {
    return (
      <View style={[styles.container, { paddingTop: TOP_PADDING }]}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setChatUser(null)} style={styles.backButton}>
            <ArrowRight size={24} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.backText}>Exit</Text>
          </TouchableOpacity>
          <Text style={styles.chatTitle}>{chatUser}</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <View style={styles.receivedMsg}>
            <Text style={styles.msgText}>
              Hey! Looking forward to our {regData.sport} session at the Partner Center.
            </Text>
          </View>
        </ScrollView>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputArea}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type message..."
            placeholderTextColor="#8E8E93"
            value={msg}
            onChangeText={setMsg}
          />
          <TouchableOpacity onPress={() => { Alert.alert('Sent!'); setMsg(''); }} style={styles.sendIcon}>
            <Send color="#FF9500" size={24} />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: TOP_PADDING }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>Inbox</Text>
        <Text style={styles.sectionTitle}>Active Conversations</Text>
        <TouchableOpacity
          style={styles.miniSessionCard}
          onPress={() => setChatUser(isCoach ? 'Student Leo' : 'Coach Elena')}
        >
          <View style={styles.coachAvatar}><User color="white" size={14} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniSessionTitle}>{isCoach ? 'Student Leo' : 'Coach Elena'}</Text>
            <Text style={styles.miniSessionSub}>Are we still on for today?</Text>
          </View>
          <ArrowRight color="#3A3A3C" size={18} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          {isCoach ? 'Pending Student Requests' : 'Pending Coach Requests'}
        </Text>
        <SessionItem
          title={isCoach ? 'Student Maya' : 'Coach Elena'}
          subtitle={isCoach ? 'Wants to learn Soccer' : 'Expert Volleyball'}
          date="Apr 8" time="4:00 PM"
          onChat={() => setChatUser(isCoach ? 'Student Maya' : 'Coach Elena')}
          onConfirm={() => Alert.alert('Accepted')}
          onDecline={() => Alert.alert('Declined')}
        />
      </ScrollView>
    </View>
  );
};

// ─── Profile Screen ───────────────────────────────────────────────────────────
const ProfileScreen = () => {
  const { regData, setRegData } = useContext(RallyContext);
  const isCoach = regData.role === 'volunteer';
  const tier = getCoachTier(regData.coachHours);

  return (
    <View style={[styles.container, { paddingTop: TOP_PADDING }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.iconCircle}><User color="#FF9500" size={40} /></View>
        <Text style={[styles.header, { textAlign: 'center' }]}>{regData.name}</Text>

        {/* Badge row */}
        <View style={styles.badgeRow}>
          {isCoach ? (
            <>
              <View style={styles.pillBadge}>
                <BookOpen size={12} color="#FF9500" />
                <Text style={styles.pillText}>Academy Grad</Text>
              </View>
              <TierBadge hours={regData.coachHours} />
              <View style={styles.pillBadge}>
                <Star size={12} color="#FFD600" />
                <Text style={styles.pillText}>Verified Coach</Text>
              </View>
            </>
          ) : (
            <View style={styles.pillBadge}>
              <ShieldCheck size={12} color="#34C759" />
              <Text style={styles.pillText}>Safe-Zone Access Verified</Text>
            </View>
          )}
        </View>

        {/* Parent connect (student) */}
        {!isCoach && (
          <TouchableOpacity
            style={[styles.card, regData.parentConnected && { borderColor: '#34C759', borderWidth: 1 }]}
            onPress={() => setRegData({ ...regData, parentConnected: true })}
          >
            <Zap color={regData.parentConnected ? '#34C759' : '#8E8E93'} size={20} />
            <Text style={{ color: 'white', marginLeft: 10 }}>
              {regData.parentConnected ? 'Parent Dashboard Connected' : 'Connect Parent/Guardian'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <Activity color="#FF9500" size={20} />
          <Text style={{ color: 'white', marginLeft: 10 }}>{regData.sport} • {regData.skill}</Text>
        </View>

        {/* Stats grid */}
        <Text style={styles.sectionTitle}>{isCoach ? 'Coach Analytics' : 'My Personal Best'}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statsCard}>
            <Award color="#FF9500" size={24} />
            <Text style={styles.cardValue}>{isCoach ? `${regData.coachHours} hrs` : '12 hrs'}</Text>
            <Text style={styles.cardLabel}>Completed</Text>
          </View>
          <View style={styles.statsCard}>
            <CheckCircle color="#34C759" size={24} />
            <Text style={styles.cardValue}>124</Text>
            <Text style={styles.cardLabel}>Rank Score</Text>
          </View>
        </View>

        {/* Coach tier progress (coaches only) */}
        {isCoach && (
          <View style={[styles.safetyBox, { marginTop: 20 }]}>
            <Text style={[styles.selectionLabel, { marginBottom: 8 }]}>Your Coach Tier</Text>
            {COACH_TIERS.map((t) => (
              <View key={t.label} style={[styles.safetyItem, { justifyContent: 'space-between' }]}>
                <Text style={{ fontSize: 16 }}>{t.icon}</Text>
                <Text style={[styles.safetyText, { flex: 1, marginLeft: 8 }]}>
                  {t.label} ({t.minHours}+ hrs)
                </Text>
                {regData.coachHours >= t.minHours && <CheckCircle color="#34C759" size={16} />}
              </View>
            ))}
            {/* Simulate adding hours for demo purposes */}
            <TouchableOpacity
              style={[styles.onboardingButton, { marginTop: 15, height: 44 }]}
              onPress={() => setRegData({ ...regData, coachHours: regData.coachHours + 10 })}
            >
              <Text style={styles.buttonText}>+ Log 10 Hours (Demo)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

const RallyConsumer = () => {
  const { onboardingStep, regData, ratingModal, submitCoachRating, setRatingModal } = useContext(RallyContext);

  // Gate: show onboarding until step 4+
  if (onboardingStep < 4) return <OnboardingFlow />;

  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: { backgroundColor: '#1C1C1E', borderTopWidth: 0, height: 90, paddingBottom: 30 },
            tabBarActiveTintColor: '#FF9500',
            headerShown: false,
          }}
        >
          <Tab.Screen name="Home"    component={HomeScreen}    options={{ tabBarIcon: ({ color }) => <Calendar color={color} size={24} /> }} />
          <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarIcon: ({ color }) => <MapPin color={color} size={24} /> }} />
          <Tab.Screen name="Inbox"   component={InboxScreen}   options={{ tabBarIcon: ({ color }) => <MessageSquare color={color} size={24} /> }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }} />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Global post-session rating modal */}
      <ParentRatingModal
        visible={ratingModal.visible}
        onSubmit={(rating) => submitCoachRating(ratingModal.sessionId, rating)}
        onClose={() => setRatingModal({ visible: false, sessionId: null })}
      />
    </>
  );
};

export default function App() {
  return <RallyProvider><RallyConsumer /></RallyProvider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. STYLES  (all original styles preserved; new ones appended at bottom)
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Original styles (unchanged) ──────────────────────────────────────────
  container:             { flex: 1, backgroundColor: '#000' },
  onboardingContainer:   { flex: 1, backgroundColor: '#000' },
  onboardingContent:     { padding: 40, alignItems: 'center', justifyContent: 'center', flex: 1 },
  iconCircle:            { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', marginBottom: 20, alignSelf: 'center' },
  onboardingTitle:       { color: 'white', fontSize: 36, fontWeight: 'bold' },
  heroText:              { color: '#FF9500', fontSize: 24, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  safetyBox:             { backgroundColor: '#1C1C1E', borderRadius: 15, padding: 15, width: '100%', marginTop: 20 },
  safetyItem:            { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  safetyText:            { color: '#AEAEB2', marginLeft: 10, fontSize: 14 },
  onboardingButton:      { backgroundColor: '#FF9500', flexDirection: 'row', width: '100%', height: 60, borderRadius: 15, marginTop: 30, justifyContent: 'center', alignItems: 'center' },
  roleButton:            { backgroundColor: '#1C1C1E', width: '100%', padding: 20, borderRadius: 15, marginTop: 15, alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C' },
  roleActive:            { borderColor: '#FF9500', backgroundColor: '#2C2C2E' },
  input:                 { backgroundColor: '#1C1C1E', color: 'white', width: '100%', height: 55, borderRadius: 12, paddingHorizontal: 15, marginTop: 15, fontSize: 16 },
  header:                { color: 'white', fontSize: 28, fontWeight: 'bold' },
  headerRow:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subText:               { color: '#8E8E93', fontSize: 16, marginTop: 5 },
  buttonText:            { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sessionCard:           { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, marginTop: 20 },
  sessionHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sessionTitle:          { color: 'white', fontSize: 20, fontWeight: 'bold' },
  liveBadge:             { backgroundColor: 'rgba(255, 149, 0, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  liveText:              { color: '#FF9500', fontSize: 10, fontWeight: 'bold' },
  sessionDetailRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sessionDetailText:     { color: '#8E8E93', marginLeft: 8, fontSize: 14 },
  coachStrip:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', padding: 12, borderRadius: 12, marginTop: 10, marginBottom: 10 },
  coachAvatar:           { width: 30, height: 30, borderRadius: 15, backgroundColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  coachName:             { color: 'white', fontWeight: '600', fontSize: 14 },
  coachStatus:           { color: '#8E8E93', fontSize: 12 },
  checkInButton:         { backgroundColor: '#FF9500', borderRadius: 12, padding: 16, marginTop: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  miniSessionCard:       { backgroundColor: '#1C1C1E', borderRadius: 12, padding: 15, marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  miniSessionTitle:      { color: 'white', fontWeight: '600' },
  miniSessionSub:        { color: '#8E8E93', fontSize: 12 },
  actionRow:             { flexDirection: 'row', gap: 15 },
  actionIcon:            { padding: 5 },
  secondaryActionCard:   { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 18, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secondaryActionText:   { color: 'white', fontSize: 14, flex: 1, marginLeft: 12 },
  sectionTitle:          { color: 'white', fontSize: 20, fontWeight: '600', marginTop: 25, marginBottom: 5 },
  selectionWrapper:      { width: '100%', marginTop: 20 },
  selectionLabel:        { color: 'white', fontSize: 16, marginBottom: 10 },
  chipContainer:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:                  { backgroundColor: '#1C1C1E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3A3A3C', flexDirection: 'row', alignItems: 'center' },
  chipActive:            { borderColor: '#FF9500', backgroundColor: '#2C2C2E' },
  chipIcon:              { fontSize: 16, marginRight: 4 },
  chipText:              { color: '#AEAEB2', fontSize: 13 },
  chipTextActive:        { color: 'white' },
  statsGrid:             { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  statsCard:             { backgroundColor: '#1C1C1E', width: '48%', padding: 20, borderRadius: 20, alignItems: 'center' },
  card:                  { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  cardLabel:             { color: '#8E8E93', fontSize: 11 },
  cardValue:             { color: 'white', fontSize: 18, fontWeight: '600' },
  dropdownTrigger:       { backgroundColor: '#1C1C1E', height: 55, borderRadius: 12, paddingHorizontal: 15, marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOverlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent:          { backgroundColor: '#1C1C1E', borderRadius: 25, padding: 30 },
  modalOption:           { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  topCoachesGui:         { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 15, borderLeftWidth: 4, borderLeftColor: '#FFD600', marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  topCoachesTitle:       { color: 'white', fontSize: 16, fontWeight: 'bold' },
  topCoachesSub:         { color: '#8E8E93', fontSize: 12, marginTop: 4 },
  mapSheet:              { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1C1C1E', padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25, borderTopWidth: 2, borderTopColor: '#FF9500' },
  sheetHeader:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sheetName:             { color: 'white', fontSize: 22, fontWeight: 'bold' },
  sheetBio:              { color: '#8E8E93', fontSize: 14, marginTop: 4 },
  sheetButton:           { backgroundColor: '#FF9500', height: 50, borderRadius: 12, marginTop: 20, justifyContent: 'center', alignItems: 'center' },
  actionRowMap:          { flexDirection: 'row', gap: 10, marginTop: 15 },
  messageButtonCircle:   { backgroundColor: '#3A3A3C', width: 50, height: 50, borderRadius: 12, marginTop: 20, justifyContent: 'center', alignItems: 'center' },
  chatHeader:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C1E' },
  chatTitle:             { color: 'white', fontSize: 18, fontWeight: 'bold' },
  receivedMsg:           { backgroundColor: '#1C1C1E', padding: 15, borderRadius: 15, alignSelf: 'flex-start', maxWidth: '80%' },
  msgText:               { color: 'white', fontSize: 15 },
  inputArea:             { flexDirection: 'row', padding: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1C1C1E' },
  chatInput:             { flex: 1, backgroundColor: '#1C1C1E', color: 'white', borderRadius: 25, paddingHorizontal: 20, height: 50 },
  sendIcon:              { marginLeft: 15 },
  panicButtonCircle:     { backgroundColor: '#FF3B30', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  weatherCard:           { backgroundColor: '#1C1C1E', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  weatherTitle:          { color: 'white', fontSize: 16, fontWeight: 'bold' },
  weatherSubText:        { color: '#8E8E93', fontSize: 12 },
  badgeRow:              { flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' },
  pillBadge:             { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#3A3A3C' },
  pillText:              { color: 'white', fontSize: 11, marginLeft: 5 },
  backButton:            { flexDirection: 'row', alignItems: 'center' },
  backText:              { color: 'white', marginLeft: 5, fontWeight: '600' },
  tickerContainer:       { backgroundColor: '#1C1C1E', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  tickerText:            { color: '#FF9500', fontSize: 12, fontWeight: 'bold', marginRight: 20 },
  mockMapContainer:      { backgroundColor: '#121212', height: 350, borderBottomWidth: 1, borderBottomColor: '#1C1C1E' },
  mapGridLineH:          { position: 'absolute', width: 1000, height: 1, backgroundColor: '#1C1C1E', top: 500 },
  mapGridLineV:          { position: 'absolute', width: 1, height: 1000, backgroundColor: '#1C1C1E', left: 500 },
  mapPin:                { position: 'absolute', alignItems: 'center' },
  pinLabel:              { backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginTop: -5 },
  pinLabelText:          { color: 'white', fontSize: 10, fontWeight: 'bold' },
  pinShield:             { position: 'absolute', top: -5, right: -5, backgroundColor: '#34C759', borderRadius: 10, padding: 2 },
  leaderboardSection:    { padding: 20 },
  leaderCard:            { backgroundColor: '#1C1C1E', padding: 15, borderRadius: 15, marginRight: 15, width: 140, alignItems: 'center' },
  leaderRank:            { color: '#FF9500', fontSize: 18, fontWeight: 'bold' },
  leaderName:            { color: 'white', fontSize: 14, fontWeight: '600', marginTop: 5 },
  leaderHours:           { color: '#8E8E93', fontSize: 12 },
  checkRow:              { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  squareCheck:           { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#FF9500', marginRight: 10 },
  checkText:             { color: 'white', fontSize: 15 },
  liabilityBox:          { backgroundColor: '#2C2C2E', padding: 12, borderRadius: 12, marginBottom: 10 },
  rowCentered:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liabilityText:         { color: 'white', fontSize: 13, flex: 1, marginLeft: 10 },
  liabilityWarning:      { color: '#FF3B30', fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  partnerBadge:          { backgroundColor: '#34C759', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4, marginLeft: 5 },
  partnerBadgeText:      { color: 'white', fontSize: 9, fontWeight: 'bold', marginLeft: 4 },

  // ── New styles ────────────────────────────────────────────────────────────

  // Coach Academy
  academyModuleCard:     { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 18, marginTop: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C' },
  academyModuleDone:     { borderColor: '#34C759', backgroundColor: '#0D2B18' },
  academyModuleIcon:     { fontSize: 28 },
  academyModuleTitle:    { color: 'white', fontSize: 15, fontWeight: '600' },
  academyModuleSub:      { color: '#8E8E93', fontSize: 12, marginTop: 2 },

  // Tier badge
  tierBadge:             { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tierBadgeIcon:         { fontSize: 14 },
  tierBadgeText:         { fontSize: 12, fontWeight: '700', marginLeft: 4 },

  // Anchor session cards
  anchorCard:            { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 18, marginTop: 14, borderWidth: 1, borderColor: '#2C2C2E' },
  anchorCardHeader:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  anchorCoach:           { color: 'white', fontSize: 17, fontWeight: '700' },
  anchorTierLabel:       { fontSize: 12, fontWeight: '600' },
  anchorMeta:            { gap: 5 },
  anchorMetaText:        { color: '#8E8E93', fontSize: 13 },
  anchorJoinButton:      { backgroundColor: '#FF9500', borderRadius: 12, padding: 14, marginTop: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  anchorWaitlistActive:  { backgroundColor: '#3A3A3C' },

  // Sport pills (full/open indicator)
  sportPill:             { backgroundColor: 'rgba(255,149,0,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  sportPillText:         { color: '#FF9500', fontSize: 12, fontWeight: '700' },

  // Filter chips in Explore header
  filterChip:            { backgroundColor: '#1C1C1E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#3A3A3C' },
  filterChipActive:      { backgroundColor: '#FF9500', borderColor: '#FF9500' },
  filterChipText:        { color: '#8E8E93', fontSize: 13, fontWeight: '600' },

  // Sessions / Map toggle
  toggleRow:             { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 12, marginTop: 12, padding: 4 },
  toggleBtn:             { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive:       { backgroundColor: '#FF9500' },
  toggleBtnText:         { color: '#8E8E93', fontWeight: '600' },

  // Post anchor session button (coach view)
  postSessionButton:     { backgroundColor: '#2C2C2E', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FF9500', marginBottom: 8 },
});