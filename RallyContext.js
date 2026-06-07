import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  CheckCircle2, ShieldCheck, ShieldAlert, Clock, RefreshCw, XCircle, AlertCircle,
} from 'lucide-react-native';

// ─── Seed Data ───────────────────────────────────────────────
const DEFAULT_MODULES = [
  { id: 'm1', title: 'NYC Safe-Zone Protocol', duration: '15 mins', xp: 100, completed: true, category: 'Safety' },
  { id: 'm2', title: 'De-escalation & Mentorship', duration: '20 mins', xp: 150, completed: false, category: 'Mentorship' },
  { id: 'm3', title: 'Youth Sports First Aid', duration: '30 mins', xp: 200, completed: false, category: 'Medical' },
  { id: 'm4', title: 'Community Impact Strategy', duration: '25 mins', xp: 120, completed: false, category: 'Leadership' },
];

// Equipment available per sport at partner sites
const EQUIPMENT_OPTIONS = {
  Basketball: ['Basketball', 'Sneakers (limited sizes)'],
  Soccer: ['Soccer Ball', 'Shin Guards', 'Cleats (limited sizes)'],
  Volleyball: ['Volleyball', 'Knee Pads'],
};

const DEFAULT_SESSIONS = [
  {
    id: 's1', sport: 'Basketball', title: 'Midnight Hoop Clinic',
    coachName: 'Coach Elena', coachId: 'c2', tier: 'Level 2 • Veteran',
    rating: 4.9, hoursDonated: 152,
    time: '4:00 PM - 5:30 PM', date: 'TODAY',
    location: 'Central Park Safe-Zone • Court 4', borough: 'Manhattan',
    attendees: 8, maxCapacity: 15, status: 'Open',
    isUserEnrolled: false, zoneVerified: false,
    equipmentAvailable: EQUIPMENT_OPTIONS.Basketball,
    coordinates: { latitude: 40.785091, longitude: -73.968285 },
  },
  {
    id: 's2', sport: 'Soccer', title: 'Youth Soccer Clinic',
    coachName: 'Coach Elena', coachId: 'c2', tier: 'Level 2 • Veteran',
    rating: 4.8, hoursDonated: 152,
    time: '5:00 PM - 6:30 PM', date: 'TOMORROW',
    location: 'Sunset Park Safe-Zone • Field A', borough: 'Brooklyn',
    attendees: 14, maxCapacity: 20, status: 'Open',
    isUserEnrolled: false, zoneVerified: false,
    equipmentAvailable: EQUIPMENT_OPTIONS.Soccer,
    coordinates: { latitude: 40.6468, longitude: -74.0131 },
  },
  {
    id: 's3', sport: 'Volleyball', title: 'Open Court Volleyball',
    coachName: 'Coach Sara', coachId: 'c3', tier: 'Level 1 • Trained',
    rating: 4.7, hoursDonated: 98,
    time: '3:30 PM - 5:00 PM', date: 'TODAY',
    location: 'Astoria Park Safe-Zone', borough: 'Queens',
    attendees: 6, maxCapacity: 12, status: 'Open',
    isUserEnrolled: false, zoneVerified: false,
    equipmentAvailable: EQUIPMENT_OPTIONS.Volleyball,
    coordinates: { latitude: 40.7797, longitude: -73.9224 },
  },
];

const DEFAULT_PENDING_REQUESTS = [
  { id: 'req1', studentName: 'Marcus Vance', sport: 'Soccer', level: 'Intermediate', time: 'Tonight, 5:00 PM', location: 'Sunset Park', equipmentRequested: ['Soccer Ball'] },
  { id: 'req2', studentName: 'Malik J.', sport: 'Basketball', level: 'Beginner', time: 'Tomorrow, 4:00 PM', location: 'Central Park', equipmentRequested: [] },
];

// ─── Tier Helper ─────────────────────────────────────────────
function getTierName(hours) {
  if (hours >= 50) return 'Master';
  if (hours >= 10) return 'Veteran';
  return 'Trained';
}

// ─── Context ─────────────────────────────────────────────────
const RallyContext = createContext();

export function RallyProvider({ children }) {
  const [demoMode, setDemoMode] = useState(true);
  const [userRole, setUserRole] = useState('student');

  const [userProfile, setUserProfile] = useState({
    name: 'Marcus Vance',
    borough: 'Brooklyn',
    sport: 'Soccer',
    skillLevel: 'Intermediate',
    hoursContributed: 12,
    rankScore: 124,
    parentConnected: false,
  });

  const [sessions, setSessions] = useState(DEFAULT_SESSIONS);
  const [academyModules, setAcademyModules] = useState(DEFAULT_MODULES);
  const [pendingRequests, setPendingRequests] = useState(DEFAULT_PENDING_REQUESTS);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [hasAgreedToCoachPolicy, setHasAgreedToCoachPolicy] = useState(false);
  const [pendingCertificate, setPendingCertificate] = useState(null);   // { tier, hours } | null
  const [claimedCertificates, setClaimedCertificates] = useState([]);   // tiers already shown

  // ── Global Modal State ──────────────────────────────────
  // Replaces Alert.alert — renders identically on iOS, Android, and web.
  // See src/components/RallyModal.js for the consumer.
  const [modal, setModal] = useState(null);
  const showModal = useCallback((payload) => setModal(payload), []);
  const hideModal = useCallback(() => setModal(null), []);

  // ── Session Actions ──────────────────────────────────────
  // Join + optional equipment request. equipmentNeeded is an array of strings.
  const joinRallySession = useCallback((sessionId, equipmentNeeded = []) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        if (s.isUserEnrolled) {
          showModal({
            title: 'Already Registered',
            message: 'You are already registered for this session.',
            icon: AlertCircle,
            iconColor: '#FF9500',
          });
          return s;
        }
        const eqMsg = equipmentNeeded.length > 0
          ? `\n\nEquipment reserved: ${equipmentNeeded.join(', ')}`
          : '\n\nNo equipment requested — bring your own gear.';

        showModal({
          title: 'Spot Reserved',
          message: `You're registered for "${s.title}". Tap GPS Check-In when you arrive.${eqMsg}`,
          icon: CheckCircle2,
          iconColor: '#34C759',
        });
        return { ...s, attendees: s.attendees + 1, isUserEnrolled: true };
      }
      return s;
    }));
  }, [showModal]);

  // GPS arrival verification — updates session AND profile; fires tier certificate if milestone crossed
  const verifySafeZoneArrival = useCallback((sessionId) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, zoneVerified: true } : s
    ));
    showModal({
      title: 'Safe-Zone Check-In Confirmed',
      message: 'GPS match verified. Logged 1.5 impact hours and awarded +50 points.',
      icon: ShieldCheck,
      iconColor: '#34C759',
    });

    const oldHours = userProfile.hoursContributed;
    const newHours = oldHours + 1.5;
    const oldTier  = getTierName(oldHours);
    const newTier  = getTierName(newHours);

    setUserProfile(prev => ({
      ...prev,
      hoursContributed: prev.hoursContributed + 1.5,
      rankScore: prev.rankScore + 50,
    }));

    // Fire Trained cert on very first hours earned; fire Veteran/Master on tier upgrade
    if (oldHours === 0 && newHours > 0 && !claimedCertificates.includes('Trained')) {
      setPendingCertificate({ tier: 'Trained', hours: newHours });
    } else if (newTier !== oldTier && !claimedCertificates.includes(newTier)) {
      setPendingCertificate({ tier: newTier, hours: newHours });
    }
  }, [userProfile, claimedCertificates, showModal]);

  const connectParentDashboard = useCallback(() => {
    setUserProfile(prev => ({ ...prev, parentConnected: true }));
    showModal({
      title: 'Guardian Verified',
      message: 'Encrypted push notifications synced with the Guardian dashboard.',
      icon: ShieldCheck,
      iconColor: '#34C759',
    });
  }, [showModal]);

  const handlePendingRequest = useCallback((requestId, action) => {
    setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    if (action === 'accept') {
      showModal({
        title: 'Session Confirmed',
        message: 'The student has been notified and a secure chat portal has opened.',
        icon: CheckCircle2,
        iconColor: '#34C759',
      });
      setUserProfile(prev => ({ ...prev, hoursContributed: prev.hoursContributed + 2 }));
    } else {
      showModal({
        title: 'Request Declined',
        message: 'The request has been routed back into the available cohort pool.',
        icon: XCircle,
        iconColor: '#8E8E93',
      });
    }
  }, [showModal]);

  const completeAcademyModule = useCallback((moduleId) => {
    setAcademyModules(prev => prev.map(mod => {
      if (mod.id === moduleId && !mod.completed) {
        setUserProfile(prevProf => ({ ...prevProf, rankScore: prevProf.rankScore + mod.xp }));
        return { ...mod, completed: true };
      }
      return mod;
    }));
  }, []);

  const triggerPanicButton = useCallback(() => {
    showModal({
      title: 'Emergency Alert',
      message: 'All guardians and site administrators will be notified with your GPS coordinates.',
      icon: ShieldAlert,
      iconColor: '#FF3B30',
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'CONFIRM DISPATCH', style: 'destructive' },
      ],
    });
  }, [showModal]);

  const joinWaitlist = useCallback((sessionId) => {
    showModal({
      title: 'Added to Waitlist',
      message: "You'll be notified the moment a spot opens. We'll also flag this area for additional coaches.",
      icon: Clock,
      iconColor: '#0A84FF',
    });
  }, [showModal]);

  const completeOnboarding = useCallback(() => setOnboardingComplete(true), []);

  const agreeToCoachPolicy = useCallback(() => {
    setHasAgreedToCoachPolicy(true);
  }, []);

  // Resets every piece of state back to seed values so a new person
  // can walk through the full onboarding flow from scratch.
  const resetDemo = useCallback(() => {
    setOnboardingComplete(false);
    setHasAgreedToCoachPolicy(false);
    setUserRole('student');
    setUserProfile({
      name: 'Marcus Vance',
      borough: 'Brooklyn',
      sport: 'Soccer',
      skillLevel: 'Intermediate',
      hoursContributed: 12,
      rankScore: 124,
      parentConnected: false,
    });
    setSessions(DEFAULT_SESSIONS);
    setAcademyModules(DEFAULT_MODULES);
    setPendingRequests(DEFAULT_PENDING_REQUESTS);
    setPendingCertificate(null);
    setClaimedCertificates([]);
    setModal(null);
  }, []);

  const claimCertificate = useCallback(() => {
    if (!pendingCertificate) return;
    setClaimedCertificates(prev => [...prev, pendingCertificate.tier]);
    setPendingCertificate(null);
  }, [pendingCertificate]);

  // ── Memoized Provider Value ──────────────────────────────
  const contextValue = useMemo(() => ({
    demoMode, setDemoMode,
    userRole, setUserRole,
    userProfile, setUserProfile,
    sessions, academyModules, pendingRequests,
    joinRallySession, verifySafeZoneArrival, connectParentDashboard,
    handlePendingRequest, completeAcademyModule,
    triggerPanicButton, joinWaitlist,
    EQUIPMENT_OPTIONS,
    onboardingComplete, completeOnboarding,
    hasAgreedToCoachPolicy, agreeToCoachPolicy,
    pendingCertificate, claimCertificate,
    resetDemo,
    modal, showModal, hideModal,
  }), [
    demoMode, userRole, userProfile, sessions, academyModules,
    pendingRequests, joinRallySession, verifySafeZoneArrival,
    connectParentDashboard, handlePendingRequest, completeAcademyModule,
    triggerPanicButton, joinWaitlist,
    onboardingComplete, completeOnboarding,
    hasAgreedToCoachPolicy, agreeToCoachPolicy,
    pendingCertificate, claimCertificate,
    resetDemo,
    modal, showModal, hideModal,
  ]);

  return (
    <RallyContext.Provider value={contextValue}>
      {children}
    </RallyContext.Provider>
  );
}

export function useRally() {
  const context = useContext(RallyContext);
  if (!context) throw new Error('useRally must be used within a RallyProvider.');
  return context;
}
