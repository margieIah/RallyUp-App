import React, { useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Modal, Animated, Easing,
  Pressable, useWindowDimensions,
} from 'react-native';
import { useRally } from '../context/RallyContext';

/**
 * Modal-specific button. Press scaling is applied to the inner Animated.View
 * while the *layout* style (flex: 1 / width: 100%) lives on the outer
 * TouchableOpacity — without that split, the press scaling collapses the
 * TouchableOpacity to its content width and the row leans left.
 */
const ModalButton = ({ style, textStyle, label, onPress, fullWidth }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      activeOpacity={1}
      style={fullWidth ? styles.buttonOuterFull : styles.buttonOuter}
    >
      <Animated.View style={[style, styles.buttonInner, { transform: [{ scale }] }]}>
        <Text style={textStyle} numberOfLines={1}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * Global RallyModal — replaces Alert.alert with a premium in-app modal that
 * renders identically on iOS, Android, and web.
 *
 * Payload (set via context.showModal):
 *   {
 *     title:         string,
 *     message:       string,                       // newlines preserved
 *     messageAlign?: 'center' | 'left',            // 'center' default; pass 'left' for list-style content
 *     icon?:         LucideIcon | null,
 *     iconColor?:    string,
 *     buttons?:      [{ label, style?, onPress? }]
 *   }
 * If `buttons` omitted, defaults to a single "Got it" primary button.
 */
export default function RallyModal() {
  const { modal, hideModal } = useRally();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const cardAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (modal) {
      overlayAnim.setValue(0);
      cardAnim.setValue(0);
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }),
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modal]);

  if (!modal) return null;

  const {
    title,
    message,
    messageAlign = 'center',
    icon: Icon,
    iconColor = '#FF9500',
    buttons = [{ label: 'Got It', style: 'primary' }],
  } = modal;

  const hasDestructive = buttons.some(b => b.style === 'destructive');
  const isSingle = buttons.length === 1;

  const handleButtonPress = (btn) => {
    hideModal();
    requestAnimationFrame(() => btn.onPress && btn.onPress());
  };

  const handleBackdrop = () => {
    if (hasDestructive) return; // require explicit choice for destructive flows
    hideModal();
  };

  const cardScale = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={hideModal}>
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Pressable style={styles.backdrop} onPress={handleBackdrop} />
        <Animated.View
          style={[
            styles.card,
            isTablet && styles.cardTablet,
            { opacity: cardAnim, transform: [{ scale: cardScale }, { translateY: cardTranslateY }] },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {Icon && (
            <View style={[styles.iconWrap, { borderColor: `${iconColor}55`, backgroundColor: `${iconColor}14` }]}>
              <Icon color={iconColor} size={26} strokeWidth={2.3} />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { textAlign: messageAlign }]} selectable>
              {message}
            </Text>
          ) : null}

          <View style={[
            styles.buttonRow,
            isSingle && styles.buttonRowSingle,
          ]}>
            {buttons.map((btn, i) => {
              const isPrimary     = btn.style === 'primary';
              const isDestructive = btn.style === 'destructive';
              const isCancel      = btn.style === 'cancel';

              const btnStyle = [
                styles.button,
                isPrimary     && styles.buttonPrimary,
                isDestructive && styles.buttonDestructive,
                (!isPrimary && !isDestructive) && styles.buttonDefault,
              ];
              const txtStyle = [
                styles.buttonText,
                isPrimary     && styles.buttonTextPrimary,
                isDestructive && styles.buttonTextDestructive,
                isCancel      && styles.buttonTextCancel,
                (!isPrimary && !isDestructive && !isCancel) && styles.buttonTextDefault,
              ];

              return (
                <ModalButton
                  key={i}
                  style={btnStyle}
                  textStyle={txtStyle}
                  label={btn.label}
                  onPress={() => handleButtonPress(btn)}
                  fullWidth={isSingle}
                />
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  backdrop: { ...StyleSheet.absoluteFillObject },

  card: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    alignItems: 'center',
    boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
  },
  cardTablet: { maxWidth: 420, alignSelf: 'center' },

  iconWrap: {
    width: 60, height: 60, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, borderWidth: 1,
  },

  title: {
    color: '#FFFFFF', fontSize: 19, fontWeight: '900',
    letterSpacing: -0.4, textAlign: 'center', lineHeight: 24,
  },
  message: {
    color: '#AEAEB2', fontSize: 14, lineHeight: 20,
    marginTop: 10, fontWeight: '500',
    alignSelf: 'stretch',  // allow left-aligned multi-line content to span full width
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    marginTop: 24,
  },
  buttonRowSingle: { flexDirection: 'column' },

  // Outer TouchableOpacity — owns the layout (flex / full width).
  // This is the fix: putting flex: 1 here, not on the inner styled view,
  // is what makes the two-button row split evenly instead of leaning left.
  buttonOuter:     { flex: 1 },
  buttonOuterFull: { alignSelf: 'stretch' },

  // Inner Animated.View — owns the visual chrome.
  buttonInner: { width: '100%' },

  button: {
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    minHeight: 48,
  },
  buttonDefault: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1, borderColor: '#3A3A3C',
  },
  buttonPrimary: {
    backgroundColor: '#FF9500',
    boxShadow: '0 6px 16px rgba(255,149,0,0.35)',
  },
  buttonDestructive: {
    backgroundColor: '#FF3B30',
    boxShadow: '0 6px 16px rgba(255,59,48,0.4)',
  },

  buttonText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.1, textAlign: 'center' },
  buttonTextDefault: { color: '#E5E5EA' },
  buttonTextPrimary: { color: '#FFFFFF' },
  buttonTextDestructive: { color: '#FFFFFF', letterSpacing: 0.4 },
  buttonTextCancel: { color: '#8E8E93' },
});
