import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';

const logo = require('../assets/images/rmanam_logo.png');

export default function Sample() {
  const [pin, setPin] = useState(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const inputs = useRef([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

React.useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.08,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(500),
    ])
  ).start();
}, []);

  const EMPLOYEE_NAMES = [
  'Pranav',
  'Sameera',
  'Swati',
  'Anurag',
  'Jaya',
  'Rmanam',
];

const NameBackground = () => {
  const rows = 8;
  const cols = 4;

  const rotations = ['-15deg', '0deg', '15deg', '90deg', '-90deg'];

  return (
    <View style={styles.bgContainer} pointerEvents="none">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const name =
            EMPLOYEE_NAMES[(row * cols + col) % EMPLOYEE_NAMES.length];

          const rotate = rotations[(row + col) % rotations.length];

          return (
            <Text
              key={`${row}-${col}`}
              style={[
                styles.bgText,
                {
                  top: `${row * 14}%`,
                  left: `${col * 28}%`,
                  transform: [{ rotate }],
                },
              ]}
            >
              {name}
            </Text>
          );
        }),
      )}
    </View>
  );
};

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...pin];
    updated[index] = value;
    setPin(updated);

    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };
  

  const isComplete = pin.every(p => p !== '');

  const onPunch = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => setShowPin(true));
  };

  return (
    <SafeAreaView style={styles.container}>

  <NameBackground />

      {/* HEADER */}
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.company}>Attendance App</Text>
      </View>

      {/* MAIN AREA */}
      <View style={styles.centerArea}>

        {!showPin ? (
          /* PUNCH ME BUTTON */
          <Animated.View
  style={{
    transform: [
      { scale: Animated.multiply(scaleAnim, bounceAnim) },
    ],
  }}
>

            <TouchableOpacity style={styles.punchBtn} onPress={onPunch}>
              <Text style={styles.punchText}>👊 Punch Me</Text>
              <Text style={styles.punchSub}>Mark Attendance</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* PIN CARD */
          <View style={styles.card}>
            <Text style={styles.title}>Employee Attendance</Text>
            <Text style={styles.subtitle}>
              Enter your 4-digit attendance PIN
            </Text>

            <View style={styles.pinRow}>
              {pin.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => (inputs.current[index] = ref)}
                  style={[
                    styles.pinBox,
                    digit && styles.pinFilled,
                  ]}
                  value={digit}
                  onChangeText={val => handleChange(val, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                />
              ))}
            </View>

            <TouchableOpacity
              disabled={!isComplete}
              style={[
                styles.button,
                !isComplete && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.buttonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

      {/* FOOTER */}
      <Text style={styles.footer}>
        © 2026 Rmanam Infotech Private Limited. All Rights Reserved
      </Text>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },

  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },

  logo: {
    height: 110,
    width: 220,
    marginBottom: 14,
  },

  company: {
    fontSize: 15,
    letterSpacing: 1,
    color: '#192533',
    fontWeight: '600',
  },

  centerArea: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
  },

  /* PUNCH BUTTON */
  punchBtn: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#192533',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },

  punchText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },

  punchSub: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 8,
    letterSpacing: 0.5,
  },

  /* CARD */
  card: {
    backgroundColor: '#fff',
    width: '88%',
    borderRadius: 16,
    padding: 26,
    marginTop: 30,
    elevation: 6,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#192533',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },

  pinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 32,
  },

  pinBox: {
    width: 56,
    height: 58,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#192533',
    backgroundColor: '#F9FAFB',
  },

  pinFilled: {
    borderColor: '#192533',
    backgroundColor: '#EEF2FF',
  },

  button: {
    backgroundColor: '#192533',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },

  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 18,
  },

  bgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  bgText: {
    position: 'absolute',
    fontSize: 32,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: 1,
    color: '#192533',
    opacity: 0.08,
  },
});

