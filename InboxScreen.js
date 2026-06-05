import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, useWindowDimensions, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Send, ShieldCheck, Search, ArrowLeft, Lock,
  MessageCircle,
} from 'lucide-react-native';
import { useRally } from '../context/RallyContext';

const INITIAL_THREADS = [
  {
    id: 't1', time: '2m ago',
    displayMeta: {
      student: { name: 'Coach Elena (Soccer)', tag: 'Vetted Staff' },
      coach: { name: 'Marcus Vance (Student)', tag: 'Sunset Park Cohort' },
    },
    messages: [
      { id: 'm1', text: 'Hey! Just checking on equipment for tonight.', sender: 'other' },
      { id: 'm2', text: 'Everything is in the main locker room. Balls and shin guards ready.', sender: 'me' },
      { id: 'm3', studentText: 'Great! Are we still on for practice?', coachText: 'Coach, can I borrow a size 5 ball?', sender: 'other' },
    ],
  },
  {
    id: 't2', time: '1hr ago',
    displayMeta: {
      student: { name: 'RallyUp Safety Team', tag: 'System Alert' },
      coach: { name: 'Malik J. (Student)', tag: 'Central Park Cohort' },
    },
    messages: [
      { id: 'm4', text: 'Your session tomorrow at Central Park is confirmed. Guardian has been notified.', sender: 'other' },
      { id: 'm5', text: 'Thanks! See you there.', sender: 'me' },
    ],
  },
];

const AVATAR_COLORS = ['#FF9500', '#34C759', '#0A84FF', '#FF375F', '#BF5AF2'];
const getAvatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

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

const AnimBtn = ({ onPress, style, children, scaleTo = 0.94 }) => {
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

// Message bubble with entrance animation — Emil: never animate from scale(0)
const Bubble = ({ children, style, isMe }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
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
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default function InboxScreen() {
  const { userRole } = useRally();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width > 768;

  const [activeThreadId, setActiveThreadId] = useState(isTablet ? 't1' : null);
  const [typeMessage, setTypeMessage] = useState('');
  const [threads, setThreads] = useState(INITIAL_THREADS);

  const activeThread = threads.find(t => t.id === activeThreadId);
  const scrollRef = useRef(null);

  const handleSendMessage = () => {
    if (!typeMessage.trim()) return;
    setThreads(prev => prev.map(t =>
      t.id === activeThreadId
        ? { ...t, messages: [...t.messages, { id: Date.now().toString(), text: typeMessage, sender: 'me' }] }
        : t
    ));
    setTypeMessage('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const renderSidebar = () => (
    <View style={[
      styles.sidebar,
      { width: isTablet ? 320 : '100%', paddingTop: Math.max(insets.top, 20) },
    ]}>
      <StaggerItem delay={0}>
        <View style={styles.sidebarHead}>
          <Text style={styles.sidebarTitle}>Messages</Text>
          <View style={styles.encryptedBadge}>
            <Lock color="#34C759" size={11} strokeWidth={2.6} />
            <Text style={styles.encryptedText}>E2E</Text>
          </View>
        </View>
      </StaggerItem>

      <StaggerItem delay={60}>
        <View style={styles.searchBox}>
          <Search color="#636366" size={15} strokeWidth={2.2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#636366"
            editable={false}
          />
        </View>
      </StaggerItem>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {threads.map((thread, idx) => {
          const meta = thread.displayMeta[userRole];
          const lastMsg = thread.messages[thread.messages.length - 1];
          const snippet = lastMsg.text || (userRole === 'student' ? lastMsg.studentText : lastMsg.coachText);
          const isActive = activeThreadId === thread.id;
          const avatarColor = getAvatarColor(meta.name);

          return (
            <StaggerItem key={thread.id} delay={120 + idx * 60}>
              <PressCard
                style={[styles.threadRow, isActive && styles.threadActive]}
                onPress={() => setActiveThreadId(thread.id)}
              >
                {isActive && <View style={styles.threadActiveLine} />}
                <View style={styles.threadInner}>
                  <View style={[styles.threadAvatar, { backgroundColor: `${avatarColor}22`, borderColor: `${avatarColor}44` }]}>
                    <Text style={[styles.threadAvatarChar, { color: avatarColor }]}>{meta.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.threadTopRow}>
                      <Text style={styles.threadName} numberOfLines={1}>{meta.name}</Text>
                      <Text style={styles.threadTime}>{thread.time}</Text>
                    </View>
                    <Text style={styles.threadTag}>{meta.tag}</Text>
                    <Text style={styles.threadSnippet} numberOfLines={1}>{snippet}</Text>
                  </View>
                </View>
              </PressCard>
            </StaggerItem>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderChat = () => {
    if (!activeThread) {
      // Empty state for tablet when nothing selected — UX rule: helpful empty state
      return (
        <View style={styles.chatEmpty}>
          <View style={styles.chatEmptyIcon}>
            <MessageCircle color="#FF9500" size={36} strokeWidth={1.8} />
          </View>
          <Text style={styles.chatEmptyTitle}>Select a conversation</Text>
          <Text style={styles.chatEmptyText}>
            All messages are end-to-end encrypted and logged for safety review.
          </Text>
        </View>
      );
    }
    const meta = activeThread.displayMeta[userRole];
    const avatarColor = getAvatarColor(meta.name);

    return (
      <View style={[styles.chat, { paddingTop: isTablet ? Math.max(insets.top, 20) : 0 }]}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          {!isTablet && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setActiveThreadId(null)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft color="#FF9500" size={20} strokeWidth={2.4} />
            </TouchableOpacity>
          )}
          <View style={[styles.chatAvatar, { backgroundColor: `${avatarColor}22`, borderColor: `${avatarColor}44` }]}>
            <Text style={[styles.chatAvatarChar, { color: avatarColor }]}>{meta.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.chatNameRow}>
              <Text style={styles.chatName} numberOfLines={1}>{meta.name}</Text>
              <ShieldCheck color="#34C759" size={14} strokeWidth={2.4} />
            </View>
            <View style={styles.chatStatusRow}>
              <View style={styles.chatStatusDot} />
              <Text style={styles.chatStatus}>End-to-end encrypted</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {activeThread.messages.map((msg, idx) => {
            const txt = msg.text || (userRole === 'student' ? msg.studentText : msg.coachText);
            const isMe = msg.sender === 'me';
            const prevSender = activeThread.messages[idx - 1]?.sender;
            const isFirstInGroup = prevSender !== msg.sender;
            return (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  isMe ? styles.rowR : styles.rowL,
                  { marginTop: isFirstInGroup ? 14 : 4 },
                ]}
              >
                <Bubble
                  isMe={isMe}
                  style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
                >
                  <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                    {txt}
                  </Text>
                </Bubble>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputField}
              value={typeMessage}
              onChangeText={setTypeMessage}
              placeholder="Type a secure message..."
              placeholderTextColor="#636366"
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              multiline
            />
          </View>
          <AnimBtn
            style={[styles.sendBtn, !typeMessage.trim() && styles.sendBtnDisabled]}
            onPress={handleSendMessage}
          >
            <Send color="#FFFFFF" size={18} strokeWidth={2.4} />
          </AnimBtn>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.split}>
        {(isTablet || !activeThread) && renderSidebar()}
        {(isTablet || activeThread) && renderChat()}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  split: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    backgroundColor: '#0E0E10',
    borderRightWidth: 1, borderRightColor: '#1C1C1E',
    paddingHorizontal: 14,
  },
  sidebarHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, paddingHorizontal: 4,
  },
  sidebarTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  encryptedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,199,89,0.1)',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9,
    borderWidth: 1, borderColor: 'rgba(52,199,89,0.22)',
  },
  encryptedText: { color: '#34C759', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  searchBox: {
    flexDirection: 'row', backgroundColor: '#1C1C1E',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    gap: 8, marginBottom: 14, borderWidth: 1, borderColor: '#2C2C2E',
    alignItems: 'center',
  },
  searchInput: { color: '#FFFFFF', flex: 1, fontSize: 14, fontWeight: '500' },

  // Thread row
  threadRow: {
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14,
    marginBottom: 2, position: 'relative', overflow: 'hidden',
  },
  threadActive: {
    backgroundColor: 'rgba(255,149,0,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.22)',
  },
  threadActiveLine: {
    position: 'absolute', left: 0, top: 8, bottom: 8,
    width: 3, backgroundColor: '#FF9500', borderRadius: 2,
  },
  threadInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  threadAvatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  threadAvatarChar: { fontSize: 17, fontWeight: '900' },
  threadTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', flex: 1, letterSpacing: -0.2 },
  threadTime: { color: '#636366', fontSize: 11, marginLeft: 8, fontWeight: '600' },
  threadTag: { color: '#FF9500', fontSize: 11, fontWeight: '700', marginTop: 2 },
  threadSnippet: { color: '#8E8E93', fontSize: 13, marginTop: 4, lineHeight: 18, fontWeight: '500' },

  // Chat panel
  chat: { flex: 1, backgroundColor: '#000000' },
  chatEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  chatEmptyIcon: {
    width: 76, height: 76, borderRadius: 26,
    backgroundColor: 'rgba(255,149,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.2)',
    marginBottom: 4,
  },
  chatEmptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  chatEmptyText: { color: '#8E8E93', fontSize: 13, textAlign: 'center', lineHeight: 19, fontWeight: '500' },

  chatHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1C1C1E',
    backgroundColor: '#0A0A0A', gap: 12,
  },
  backBtn: {
    padding: 7, borderRadius: 10, backgroundColor: 'rgba(255,149,0,0.1)',
  },
  chatAvatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  chatAvatarChar: { fontSize: 15, fontWeight: '900' },
  chatNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', flex: 1, letterSpacing: -0.2 },
  chatStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  chatStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759' },
  chatStatus: { color: '#34C759', fontSize: 11, fontWeight: '700' },

  msgRow: { flexDirection: 'row' },
  rowL: { justifyContent: 'flex-start' },
  rowR: { justifyContent: 'flex-end' },
  bubble: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, maxWidth: '78%',
  },
  bubbleMe: {
    backgroundColor: '#0A84FF', borderBottomRightRadius: 6,
    boxShadow: '0 4px 12px rgba(10,132,255,0.3)',
  },
  bubbleOther: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1, borderColor: '#2C2C2E',
    borderBottomLeftRadius: 6,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: '#FFFFFF', fontWeight: '500' },
  bubbleTextOther: { color: '#E5E5EA', fontWeight: '400' },

  // Input bar
  inputBar: {
    flexDirection: 'row', paddingHorizontal: 14, paddingTop: 12,
    backgroundColor: '#0A0A0A', borderTopWidth: 1, borderTopColor: '#1C1C1E',
    alignItems: 'flex-end', gap: 10,
  },
  inputWrap: {
    flex: 1, backgroundColor: '#1C1C1E', borderRadius: 14,
    borderWidth: 1, borderColor: '#2C2C2E',
    paddingHorizontal: 14, paddingVertical: 4,
    minHeight: 44, justifyContent: 'center',
  },
  inputField: {
    color: '#FFFFFF', fontSize: 15, fontWeight: '400',
    paddingTop: 10, paddingBottom: 10, maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#FF9500', width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    boxShadow: '0 4px 12px rgba(255,149,0,0.4)',
  },
  sendBtnDisabled: { opacity: 0.45, boxShadow: 'none' },
});
