import { Platform } from "react-native";
import messaging from "@react-native-firebase/messaging";

const DEFAULT_CHANNEL_ID = "default";

function getNotifeeModule() {
  try {
    const module = require("@notifee/react-native");
    return {
      notifee: module?.default || module,
      androidImportance: module?.AndroidImportance,
    };
  } catch (error) {
    return null;
  }
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return DEFAULT_CHANNEL_ID;
  const notifeeModule = getNotifeeModule();
  if (!notifeeModule?.notifee) return DEFAULT_CHANNEL_ID;

  return notifeeModule.notifee.createChannel({
    id: DEFAULT_CHANNEL_ID,
    name: "General Notifications",
    importance:
      notifeeModule.androidImportance?.HIGH ??
      notifeeModule.androidImportance?.DEFAULT,
  });
}

function getNotificationContent(remoteMessage) {
  const title =
    remoteMessage?.notification?.title ||
    remoteMessage?.data?.title ||
    "New Notification";
  const body =
    remoteMessage?.notification?.body || remoteMessage?.data?.body || "";

  return { title, body };
}

async function showForegroundNotification(remoteMessage) {
  const notifeeModule = getNotifeeModule();
  if (!notifeeModule?.notifee) return;

  const channelId = await ensureAndroidChannel();
  const { title, body } = getNotificationContent(remoteMessage);

  await notifeeModule.notifee.displayNotification({
    title,
    body,
    data: remoteMessage?.data || {},
    android: {
      channelId,
      pressAction: { id: "default" },
    },
  });
}

export async function initializeNotificationListeners() {
  const notifeeModule = getNotifeeModule();

  try {
    const firebaseMessaging = messaging();

    // This registration is only needed on iOS. Some Android Firebase builds do
    // not expose the method, which previously created an unhandled promise.
    if (
      Platform.OS === "ios" &&
      typeof firebaseMessaging.registerDeviceForRemoteMessages === "function"
    ) {
      await firebaseMessaging.registerDeviceForRemoteMessages();
    }

    if (notifeeModule?.notifee) {
      await notifeeModule.notifee.requestPermission();
      await ensureAndroidChannel();
    } else {
      console.log(
        "Notifee native module not found. Rebuild app to enable foreground notifications.",
      );
    }
  } catch (error) {
    console.log("Notification setup failed:", error?.message || error);
  }

  try {
    const firebaseMessaging = messaging();
    if (typeof firebaseMessaging.onMessage !== "function") {
      return () => {};
    }

    return firebaseMessaging.onMessage(async (remoteMessage) => {
      try {
        await showForegroundNotification(remoteMessage);
      } catch (error) {
        console.log("Foreground notification failed:", error?.message || error);
      }
    });
  } catch (error) {
    console.log("Notification listener unavailable:", error?.message || error);
    return () => {};
  }
}
