import { PermissionsAndroid, Platform } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { studentApi } from "./studentApi";

function extractStudentId(student) {
  if (!student || typeof student !== "object") return null;

  const candidate =
    student.id ??
    student.student_id ??
    student.sl_stud_id ??
    student.trainees_id ??
    null;

  if (candidate == null) return null;
  return String(candidate);
}

async function requestNotificationPermission() {
  if (Platform.OS === "ios") {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  if (Platform.OS === "android" && Platform.Version >= 33) {
    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return status === PermissionsAndroid.RESULTS.GRANTED;
  }

  return true;
}

export async function syncNotificationTokenForStudent(student) {
  const studentId = extractStudentId(student);
  if (!studentId) return;

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    const firebaseMessaging = messaging();
    if (
      Platform.OS === "ios" &&
      typeof firebaseMessaging.registerDeviceForRemoteMessages === "function"
    ) {
      await firebaseMessaging.registerDeviceForRemoteMessages();
    }

    if (typeof firebaseMessaging.getToken !== "function") return;
    const token = await firebaseMessaging.getToken();

    if (!token) return;

    await studentApi.post("notification_token.php", {
      student_id: studentId,
      token,
    });
  } catch (error) {
    console.log("Notification token sync failed:", error?.message || error);
  }
}
