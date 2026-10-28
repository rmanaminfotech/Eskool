import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { studentApi } from '../services/studentApi';
import Icon from 'react-native-vector-icons/Ionicons';
import AppAlertModal from '../components/AppAlertModal';
import { imageapi } from './Api';
import { colors } from '../utils/colors';
import { Keyboard } from 'react-native';
const ForgetPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [school, setSchool] = useState(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  useEffect(() => {
    fetchSchoolData();
  }, []);

  const fetchSchoolData = async () => {
    try {
      const res = await studentApi.get('master.php');

      if (res?.data?.length > 0) {
        setSchool(res.data[0]); 
      }
    } catch (err) {
      console.log('School API Error:', err);
    } finally {
      setSchoolLoading(false);
    }
  };

  const validateEmail = email => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleResetPassword = async () => {
    if (!validateEmail(email)) {
      setAlertMessage('Enter valid email address');
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);

      const response = await studentApi.post('forget_password.php', {
        sl_stud_email: email.trim(),
      });

      const res = response.data;

      if (res.status === 'true') {
        setIsSuccess(true);
        setAlertMessage(
          res.message || 'Password reset link sent to your email',
        );
        setAlertVisible(true);
      } else {
        setIsSuccess(false);
        setAlertMessage(res.message || 'Something went wrong');
        setAlertVisible(true);
        setEmail('');
      }
    } catch (error) {
      setIsSuccess(false); 
      setAlertMessage('Server error. Please try again.');
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

return (
  <KeyboardAvoidingView
    style={{ flex: 1, backgroundColor: colors.white }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
  >
    <View style={{ flex: 1 }}>

      <View style={styles.container}>
        {school?.logo && (
          <Image
            source={{ uri: `${imageapi}${school.logo}` }}
            style={styles.logo}
            resizeMode="contain"
          />
        )}

        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subTitle}>
          Enter your registered email to reset password
        </Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Icon name="mail-outline" size={20} color={colors.icon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.button,
            (!email || loading) && { backgroundColor: colors.gray },
          ]}
          disabled={!email || loading}
          onPress={handleResetPassword}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
        <View style={styles.backContainer}>
  <Text style={styles.backText}>
    Remember your password?{' '}
    <Text
      style={styles.backToLogin}
      onPress={() => navigation.navigate('LoginScreen')}
    >
      Login
    </Text>
  </Text>
</View>

      </View>

      {/* ✅ FIXED FOOTER (same as teacher) */}
      {!keyboardVisible && (
        <View style={styles.footerContainer}>
          <Text style={styles.footer}>
            Copyright - © {new Date().getFullYear()} Trinity Convent School
          </Text>
        </View>
      )}

    </View>

    <AppAlertModal
      visible={alertVisible}
      title="Reset Password"
      message={alertMessage}
      iconName="mail-outline"
      iconColor={colors.icon}
      confirmText="OK"
      onCancel={() => setAlertVisible(false)}
      onConfirm={() => {
        setAlertVisible(false);
        if (isSuccess) navigation.goBack();
      }}
    />
  </KeyboardAvoidingView>
);
};

export default ForgetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  logo: {
    width: 300,
    height: 180,
    alignSelf: 'center',
  },

  schoolName: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    color: '#111',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },

  subTitle: {
    fontSize: 13,
    color: colors.subtitle,
    marginBottom: 30,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 15,
    color: colors.black,
  },

  button: {
    backgroundColor: colors.orange,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
footerContainer: {
  position: 'absolute',
  bottom: 10,
  left: 0,
  right: 0,
  alignItems: 'center',
},

footer: {
  fontSize: 12,
  color: colors.gray2,
  textAlign: 'center',
},
backContainer: {
  alignItems: 'center',
  marginTop: 25,
},

backText: {
  fontSize: 13,
  color: colors.gray2,
},

backToLogin: {
  color: colors.orange, // match your button color
  fontWeight: '600',
},
});
