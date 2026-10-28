import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import AppAlertModal from '../components/AppAlertModal';

import LinearGradient from 'react-native-linear-gradient';
import {
  getSelectedStudentRaw,
  persistLoginSession,
  setSelectedStudent,
} from '../services/appStorage';
import { studentApi } from '../services/studentApi';
import { syncNotificationTokenForStudent } from '../services/notificationToken';
import { Keyboard } from 'react-native';

export function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    } catch (fetchError) {
      console.log('Master API Error:', fetchError);
    }
  };

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
  }, [navigation]);

  // PHONE INPUT VALIDATION (Only numbers, max 10)
  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhone(cleaned.slice(0, 10));
  };

  // EMAIL VALIDATION
  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
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
      setAlertMessage('Server error. Please try again.');
      setAlertVisible(true);
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

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Image
              source={require('../assets/images/login_reference_full.jpg')}
              style={styles.heroReferenceImage}
              resizeMode="stretch"
            />
          </View>

          <View style={styles.loginCard}>
            <View style={styles.capIcon}>
              <Image source={require('../assets/images/reference_cap_icon.jpg')} style={styles.capReferenceImage} />
            </View>
            <Text style={styles.loginTitle}>Student Login</Text>
            <Text style={styles.loginSubtitle}>
              {mode === 'phone' ? 'Access your learning journey' : 'Sign in with your school email'}
            </Text>

            {mode === 'phone' ? (
              <View style={styles.inputRow}>
                <View style={styles.countryBox}>
                  <Text style={styles.countryCode}>+91</Text>
                  <Text style={styles.chevron}>⌄</Text>
                </View>
                <View style={styles.inputDivider} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9aa3b2"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={handlePhoneChange}
                />
                <Image source={require('../assets/images/reference_phone_icon.jpg')} style={styles.phoneReferenceIcon} />
              </View>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputSymbol}>@</Text>
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="Email address"
                    placeholderTextColor="#9aa3b2"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputSymbol}>•</Text>
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="Password"
                    placeholderTextColor="#9aa3b2"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.rightIcon}>
                    <Text style={styles.visibilityText}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => navigation.navigate('ForgetPassword')}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity disabled={disabled || loading} onPress={handleLogin} activeOpacity={0.86}>
              <LinearGradient
                colors={disabled || loading ? ['#c7cbd2', '#aeb4bd'] : ['#ffad23', '#f67608']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>{loading ? 'Please wait...' : 'Continue'}</Text>
                {!loading && <Text style={styles.buttonArrow}>→</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.orContainer}>
              <View style={styles.hr} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.hr} />
            </View>

            <TouchableOpacity style={styles.alternateButton} onPress={() => setMode(mode === 'phone' ? 'email' : 'phone')}>
              <Image
                source={mode === 'phone'
                  ? require('../assets/images/reference_email_icon.jpg')
                  : require('../assets/images/reference_phone_icon.jpg')}
                style={styles.alternateReferenceIcon}
              />
              <Text style={styles.alternateButtonText}>
                {mode === 'phone' ? 'Login with Email' : 'Login with Phone'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {!keyboardVisible && (
          <View style={styles.footerContainer}>
            <Text style={styles.footer}>© {new Date().getFullYear()} {school?.company || 'Trinity Convent School'}</Text>
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
  container: { flex: 1, backgroundColor: '#fffaf3' },
  scrollContent: { flexGrow: 1, paddingBottom: 76 },
  hero: {
    height: 282,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  heroReferenceImage: {
    position: 'absolute',
    top: -27,
    width: '100%',
    height: 780,
  },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    marginHorizontal: 12,
    marginTop: 30,
    paddingHorizontal: 16,
    paddingTop: 27,
    paddingBottom: 25,
    elevation: 7,
    shadowColor: '#26364f',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 17,
  },
  capIcon: { alignSelf: 'center', width: 60, height: 60, marginBottom: 11 },
  capReferenceImage: { width: 60, height: 60 },
  loginTitle: { textAlign: 'center', color: '#102b55', fontSize: 25, fontWeight: '800' },
  loginSubtitle: { textAlign: 'center', color: '#798397', fontSize: 15, marginTop: 5, marginBottom: 23 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dce1e8',
    borderRadius: 14,
    height: 58,
    backgroundColor: '#fff',
  },
  countryBox: {
    width: 66,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCode: { color: '#102b55', fontSize: 16, fontWeight: '800' },
  chevron: { color: '#102b55', fontSize: 19, marginTop: -5 },
  inputDivider: { height: 30, width: 1, backgroundColor: '#c9cfda' },
  input: { flex: 1, color: '#172b4d', paddingHorizontal: 14, fontSize: 15 },
  phoneReferenceIcon: { width: 27, height: 27, marginRight: 14 },
  button: {
    minHeight: 58,
    borderRadius: 14,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  buttonArrow: { color: '#fff', fontSize: 26, lineHeight: 29, marginTop: -2 },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  hr: { flex: 1, height: 1, backgroundColor: '#d9dee7' },
  orText: { marginHorizontal: 13, fontSize: 12, fontWeight: '700', color: '#9aa3b2' },
  alternateButton: { minHeight: 58, borderRadius: 16, borderWidth: 1.5, borderColor: '#f2a333', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10 },
  alternateReferenceIcon: { width: 27, height: 27 },
  alternateButtonText: { color: '#ed830d', fontWeight: '800', fontSize: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dce1e8',
    borderRadius: 16,
    minHeight: 58,
    marginBottom: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  inputSymbol: { marginRight: 11, color: '#7e889a', fontSize: 18, fontWeight: '800', width: 15, textAlign: 'center' },
  rightIcon: { marginLeft: 8, padding: 4 },
  visibilityText: { color: '#ee850d', fontSize: 12, fontWeight: '800' },
  inputWithIcon: {
    flex: 1,
    minHeight: 56,
    fontSize: 15,
    color: '#172b4d',
  },
  forgotPasswordContainer: { alignItems: 'flex-end', marginTop: -2 },
  forgotPasswordText: {
    color: '#ee850d',
    fontSize: 13,
    fontWeight: '700',
  },
  footerContainer: { position: 'absolute', bottom: 15, width: '100%', alignItems: 'center' },
  footer: { fontSize: 12, color: '#697487' },
});
