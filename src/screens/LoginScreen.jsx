import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import AppAlertModal from '../components/AppAlertModal';

import Icon from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { imageapi } from './Api';
import { colors } from '../utils/colors';
import {
  getSelectedStudentRaw,
  persistLoginSession,
  setSelectedStudent,
} from '../services/appStorage';
import { studentApi } from '../services/studentApi';
import { syncNotificationTokenForStudent } from '../services/notificationToken';
import { Keyboard } from 'react-native';
const { width } = Dimensions.get('window');

export function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [school, setSchool] = useState(null);
const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    fetchSchoolDetails();
  }, []);
  useEffect(() => {
  const showSub = Keyboard.addListener('keyboardDidShow', () => {
    setKeyboardVisible(true);
  });

  const hideSub = Keyboard.addListener('keyboardDidHide', () => {
    setKeyboardVisible(false);
  });

  return () => {
    showSub.remove();
    hideSub.remove();
  };
}, []);
  const fetchSchoolDetails = async () => {
    try {
      const response = await studentApi.get('master.php');

      if (Array.isArray(response.data) && response.data.length > 0) {
        setSchool(response.data[0]);
      }
    } catch (error) {
      console.log('Master API Error:', error);
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: -width,
        duration: 14000,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  // AUTO LOGIN CHECK
  useEffect(() => {
    const checkLogin = async () => {
      const selectedStudent = await getSelectedStudentRaw();
      if (selectedStudent) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeScreen' }],
        });
      }
    };
    checkLogin();
  }, []);

  // PHONE INPUT VALIDATION (Only numbers, max 10)
  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhone(cleaned.slice(0, 10));
  };

  // EMAIL VALIDATION
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // ================= PHONE LOGIN =================
  const handlePhoneLogin = async () => {
    if (phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
      setAlertMessage('Enter valid 10-digit phone number');
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await studentApi.post('loginOTP.php', {
        sl_stud_phn: phone.trim(),
      });

      const res = response.data;

      if (res.status === 'true') {
        navigation.navigate('VerifyOtpScreen', { phone });
      } else {
        setAlertMessage(res.message || 'Failed to send OTP');
        setAlertVisible(true);
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ================= EMAIL LOGIN =================
  const handleEmailLogin = async () => {
    if (!validateEmail(email)) {
      setAlertMessage('Enter valid email address');
      setAlertVisible(true);
      return;
    }

    if (password.length < 4) {
      setAlertMessage('Password must be at least 4 characters');
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await studentApi.post('loginEmail.php', {
        sl_stud_email: email.trim(),
        sl_stud_password: password,
      });

      const res = response.data;

      if (res.status === 'true') {
        const children = res.children || [];
        await persistLoginSession({
          jwt: res.jwt,
          sl_id: res.sl_id,
          children,
        });

        if (children.length === 1) {
          await setSelectedStudent(children[0]);
          await syncNotificationTokenForStudent(children[0]);
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeScreen' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'StudentSelectionScreen' }],
          });
        }
      } else {
        setAlertMessage(res.message || 'Login failed');
        setAlertVisible(true);
      }
    } catch {
      setAlertMessage('Server error. Please try again.');
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (mode === 'phone') {
      handlePhoneLogin();
    } else {
      handleEmailLogin();
    }
  };

  const disabled =
    (mode === 'phone' && phone.length !== 10) ||
    (mode === 'email' && (!email || !password));

  const LOGO_BASE_URL = `${imageapi}`;

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.white }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
        <View style={styles.bgWrap}>
          <Animated.Image
            source={require('../assets/images/login_bg.jpg')}
            style={[styles.bgImage, { transform: [{ translateX }] }]}
          />
          <Animated.Image
            source={require('../assets/images/login_bg.jpg')}
            style={[
              styles.bgImage,
              { transform: [{ translateX: Animated.add(translateX, width) }] },
            ]}
          />
          <View style={styles.fullOverlay} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentInner}>
            <Image
              source={{
                uri: school?.logo
                  ? `${LOGO_BASE_URL}${school.logo}`
                  : 'https://via.placeholder.com/150',
              }}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.mainTitle}>
              {school?.company || 'TRINITY CONVENT SCHOOL'}
            </Text>
            <Text style={styles.subTitle}>Student Login</Text>

            {mode === 'phone' && (
              <>
                <View style={styles.inputRow}>
                  <View style={styles.countryBox}>
                    <Text style={{ fontWeight: '600' }}>+91</Text>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Phone-Number"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={handlePhoneChange}
                  />
                </View>
              </>
            )}

            {mode === 'email' && (
              <>
                {/* Email Input with Icon */}
                <View style={styles.inputContainer}>
                  <Icon
                    name="mail-outline"
                    size={20}
                    color="#888"
                    style={styles.leftIcon}
                  />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="Email"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Password Input with Icon */}
                <View style={styles.inputContainer}>
                  <Icon
                    name="lock-closed-outline"
                    size={20}
                    color={colors.icon}
                    style={styles.leftIcon}
                  />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="Password"
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.rightIcon}
                  >
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.orange}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.forgotPasswordContainer}
                  onPress={() => navigation.navigate('ForgetPassword')}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              disabled={disabled || loading}
              onPress={handleLogin}
              style={[
                styles.button,
                (disabled || loading) && { backgroundColor: colors.gray},
              ]}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Please wait...' : 'Continue'}
              </Text>
            </TouchableOpacity>

            <View style={styles.orContainer}>
              <View style={styles.hr} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.hr} />
            </View>

            {mode === 'phone' ? (
              <TouchableOpacity onPress={() => setMode('email')}>
                <Text style={styles.emailLogin}>Login with Email</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setMode('phone')}>
                <Text style={styles.emailLogin}>Login with Phone</Text>
              </TouchableOpacity>
            )}

           
          </View>
        </ScrollView>
        {!keyboardVisible && (
  <View style={styles.footerContainer}>
    <Text style={styles.footer}>
      Copyright - © {new Date().getFullYear()} {school?.company || 'Trinity Convent School'}
    </Text>
  </View>
)}
      </KeyboardAvoidingView>
      <AppAlertModal
        visible={alertVisible}
        title="Login Alert"
        message={alertMessage}
        iconName="alert-circle-outline"
        iconColor="#e74c3c"
        confirmText="OK"
        onCancel={() => setAlertVisible(false)}
        onConfirm={() => setAlertVisible(false)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  bgWrap: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 360,
    overflow: 'hidden',
  },
  bgImage: { position: 'absolute', width, height: 260 },
  fullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: 130,
  },
  logo: {
    width: '100%',
    height: 220, // 🔥 bigger
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: -40,
  },
  subTitle: { textAlign: 'center', color: '#666', marginBottom: 30 },
  inputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 18,
  },
  countryBox: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightgray,
  },
  input: { flex: 1, paddingHorizontal: 14, fontSize: 16 },
  emailInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
    color: colors.black,
  },
  button: {
    backgroundColor: colors.orange,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  hr: { flex: 1, height: 1, backgroundColor: colors.gray },
  orText: { marginHorizontal: 10, fontSize: 12, color: colors.gray },
  emailLogin: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.orange,
    marginTop: 10,
    fontWeight: '600',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },

  leftIcon: {
    marginRight: 8,
  },

  rightIcon: {
    marginLeft: 8,
  },

  inputWithIcon: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.black,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 110,
    paddingBottom: 40,
  },

  contentInner: {
    width: '100%',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },

  forgotPasswordText: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: '600',
  },
  footerContainer: {
  position: 'absolute',
  bottom: 10,
  width: '100%',
  alignItems: 'center',
},

footer: {
  fontSize: 12,
  color: colors.gray2,
},
});
