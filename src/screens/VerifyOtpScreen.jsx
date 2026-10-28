import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AppAlertModal from "../components/AppAlertModal";
import { colors } from "../utils/colors";
import { persistLoginSession, setSelectedStudent } from "../services/appStorage";
import { studentApi } from "../services/studentApi";
import { syncNotificationTokenForStudent } from "../services/notificationToken";

const DEVELOPMENT_TEST_OTP = "1234";

export function VerifyOtpScreen({ navigation, route }) {

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [timer, setTimer] = useState(30);
  const [resending, setResending] = useState(false);

  const inputs = useRef([]);

  const parentPhone = route?.params?.phone;

  // ================= TIMER =================
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text, index) => {
    if (!/^\d*$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  // ================= VERIFY OTP =================
  const verifyOtp = async () => {
    const finalOtp = otp.join("");

    if (finalOtp.length !== 4) {
      setAlertMessage("Please enter valid 4-digit OTP");
      setAlertVisible(true);
      return;
    }

    // Allows UI testing without an SMS or server call in development only.
    // `__DEV__` is false in release builds, so this cannot bypass production OTPs.
    if (__DEV__ && finalOtp === DEVELOPMENT_TEST_OTP) {
      const testStudent = {
        id: "debug-student",
        trainees_name: "Test Student",
        trade_mod: "Test Class",
        inst_meritrollno: "TEST-001",
      };

      try {
        setLoading(true);
        await persistLoginSession({
          jwt: "development-test-session",
          sl_id: "development-test",
          children: [testStudent],
        });
        await setSelectedStudent(testStudent);
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeScreen" }],
        });
      } catch {
        setAlertMessage("Unable to start the development test session.");
        setAlertVisible(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const response = await studentApi.post("verifyotp.php", {
        otp: finalOtp,
      });

      const res = response.data;

      if (res.status === "true") {
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
            routes: [{ name: "HomeScreen" }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "StudentSelectionScreen" }],
          });
        }
      } else {
        setAlertMessage(res.message || "Invalid OTP");
        setAlertVisible(true);
      }

    } catch {
      setAlertMessage("Server error. Please try again.");
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // ================= RESEND OTP =================
  const resendOtp = async () => {
    if (!parentPhone) return;

    try {
      setResending(true);

      const response = await studentApi.post("resendOTP.php", {
        parent_phone: parentPhone,
      });

      const res = response.data;

      if (res.status === true) {
        setAlertMessage(res.message || "OTP Resent Successfully!");
        setAlertVisible(true);
        setTimer(30);
      } else {
        setAlertMessage(res.message || "Failed to resend OTP");
        setAlertVisible(true);
      }

    } catch {
      setAlertMessage("Server error. Please try again.");
      setAlertVisible(true);
    } finally {
      setResending(false);
    }
  };

  const isDisabled = otp.join("").length !== 4 || loading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code sent to your mobile number
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={styles.otpBox}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              returnKeyType="done"
            />
          ))}
        </View>

        {/* ===== TIMER / RESEND SECTION ===== */}
        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Didn’t get OTP? Resend in {timer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={resendOtp} disabled={resending}>
              <Text style={styles.resendText}>
                {resending ? "Sending..." : "Send OTP Again"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, isDisabled && styles.disabledButton]}
          onPress={verifyOtp}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>

      <AppAlertModal
        visible={alertVisible}
        title="OTP Verification"
        message={alertMessage}
        iconName="alert-circle-outline"
        iconColor="#e74c3c"
        confirmText="OK"
        onConfirm={() => setAlertVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundcolor,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.white,
    padding: 25,
    borderRadius: 20,
    elevation: 5,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
    color: colors.black,
  },
  subtitle: {
    textAlign: "center",
    color: colors.subtitle,
    marginBottom: 25,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  otpBox: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    backgroundColor: colors.lightgray,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  timerText: {
    color: colors.placeholder,
    fontSize: 13,
  },
  resendText: {
    color: colors.orange,
    fontWeight: "600",
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.orange,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: colors.gray,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
