import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Image,
} from "react-native";
import AppAlertModal from "../components/AppAlertModal";
import { clearSession, getChildren, setSelectedStudent } from "../services/appStorage";
import Icon from "react-native-vector-icons/Ionicons";
import { studentimageapi } from "./Api";
import { colors } from "../utils/colors";
import { syncNotificationTokenForStudent } from "../services/notificationToken";
export function StudentSelectionScreen({ navigation }) {

  const [children, setChildren] = useState([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const list = await getChildren();
        if (list && Array.isArray(list) && list.length > 0) {
          setChildren(list);
        } else {
          setAlertMessage("No students found.");
          setAlertVisible(true);
        }
      } catch {
        setAlertMessage("Failed to load students.");
        setAlertVisible(true);
      }
    };
    loadChildren();
  }, []);
const handleLogout = async () => {
  try {
    await clearSession();

    navigation.reset({
      index: 0,
      routes: [{ name: "LoginScreen" }],
    });
  } catch (error) {
    setAlertMessage("Logout failed. Please try again.");
    setAlertVisible(true);
  }
};
  const selectStudent = async (student) => {
    try {
      await setSelectedStudent(student);
      await syncNotificationTokenForStudent(student);

      navigation.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      });
    } catch {
      setAlertMessage("Unable to select student. Please try again.");
      setAlertVisible(true);
    }
  };

const renderItem = ({ item }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.9}
    onPress={() => selectStudent(item)}
  >
   <Image
  source={{
    uri: item?.photo_name
      ? `${studentimageapi}${item.photo_name}`
      : `https://api.dicebear.com/7.x/avataaars/png?seed=${item.trainees_name}&size=192`,
  }}
  style={styles.avatar}
  resizeMode="cover"
/>

    <View style={styles.textContainer}>
      <Text style={styles.name}>{item.trainees_name}</Text>
      <Text style={styles.roll}>Class: {item.trade_mod}</Text>
      <Text style={styles.roll}>Roll no.: {item.inst_meritrollno}</Text>
    </View>
  </TouchableOpacity>
);

return (
  <View style={styles.container}>

    {/* Header */}
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Switch Ward</Text>
      </View>

      <Text style={styles.subText}>
        Choose the student profile you want to access
      </Text>
    </View>

    {/* Student List */}
    <FlatList
      data={children}
      keyExtractor={(item, index) => index.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Icon name="school-outline" size={60} color={colors.icon} />
          <Text style={styles.emptyText}>No students available</Text>
        </View>
      }
    />

    {/* Logout Button */}
    <View style={styles.logoutContainer}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>

    {/* Footer */}
    <View style={styles.footer}>
      <Text style={styles.footerSchool}>Trinity Convent School</Text>
<Text style={styles.footerText}>
  Academic Session: {children?.[0]?.session || "N/A"}
</Text>
    </View>

    <AppAlertModal
      visible={alertVisible}
      title="Student Selection"
      message={alertMessage}
      iconName="alert-circle-outline"
      iconColor="#e74c3c"
      confirmText="OK"
      onConfirm={() => setAlertVisible(false)}
    />
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundcolor,
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  /* HEADER */
  headerContainer: {
    marginBottom: 25,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.gray2,
  },

  subText: {
    fontSize: 14,
    color: colors.subtitle,
    marginTop: 6,
  },

  /* LIST */
  listContent: {
    paddingBottom: 200,
  },

  /* CARD */
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 18,
    elevation: 3,
    minHeight: 120,
  },

  avatar: {
    width: 75,
    height: 75,
    borderRadius: 40,
    marginRight: 18,
  },

  textContainer: {
    flex: 1,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.black,
  },

  details: {
    fontSize: 14,
    color: colors.gray2,
    marginTop: 4,
  },

  roll: {
    fontSize: 13,
    color: colors.gray2,
    marginTop: 3,
  },

  /* LOGOUT */
  logoutContainer: {
    position: "absolute",
    bottom: 90,
    left: 20,
    right: 20,
  },

  logoutButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.red,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  logoutButtonText: {
    color: colors.red,
    fontSize: 15,
    fontWeight: "600",
  },

  /* FOOTER */
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingVertical: 18,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: colors.border,
    elevation: 10,
  },

  footerSchool: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.orange,
  },

  footerText: {
    fontSize: 12,
    color: colors.gray2,
    marginTop: 4,
  },

  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
  },

  emptyText: {
    marginTop: 10,
    color: colors.gray2,
  },
});