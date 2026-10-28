import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppAlertModal from '../components/AppAlertModal';
import CommonHeader from '../components/CommonHeader';
import { colors } from '../utils/colors';
import {
  clearSession,
  clearSelectedStudent,
  getChildren,
} from '../services/appStorage';
import { fetchStudentProfileDetail } from '../services/studentApi';
import FullScreenLoader from '../components/FullScreenLoader';

const Sidebar = () => {
  const navigation = useNavigation();
  const [showLogout, setShowLogout] = useState(false);
const [student, setStudent] = useState(null);
const [hasMultipleStudents, setHasMultipleStudents] = useState(false);
const [loading, setLoading] = useState(true);
useEffect(() => {
  fetchStudentProfile();
  checkChildrenCount();
}, []);

const checkChildrenCount = async () => {
  try {
    const parsed = await getChildren();
    if (parsed && Array.isArray(parsed)) {
      setHasMultipleStudents(parsed.length > 1);
    }
  } catch (error) {
    console.log("Children Count Error:", error);
  }
};

const fetchStudentProfile = async () => {
  try {
    setLoading(true);
    const data = await fetchStudentProfileDetail();
    if (data) {
      setStudent(data);
    }
  } catch (error) {
    console.log("Sidebar Profile Error:", error);
  } finally {
    setLoading(false);
  }
};
  const confirmLogout = async () => {
    setShowLogout(false);
    await clearSession();

    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  };

  return (
    <View style={styles.container}>
 <FullScreenLoader visible={loading} />
      <>
     <CommonHeader
  student={student}
  navigation={navigation}
  showNotification={true}
/>
     

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>

        <View style={styles.card}>
          <MenuItem title="Home" onPress={() => navigation.navigate('HomeScreen')} />
          <MenuItem title="My Profile" onPress={() => navigation.navigate('StudentProfile')} />
          <MenuItem title="Attendance" onPress={() => navigation.navigate('Attendence')} />
          <MenuItem title="Fee Record" onPress={() => navigation.navigate('TutionFee')} />
          {/* <MenuItem title="Track Location" onPress={() => navigation.navigate('TrackLocation')} /> */}

{hasMultipleStudents && (
  <MenuItem
    title="Change Student"
    onPress={async () => {
      await clearSelectedStudent();

      navigation.reset({
        index: 0,
        routes: [{ name: "StudentSelectionScreen" }],
      });
    }}
  />
)}       
</View>

        <View style={styles.card}>
          <MenuItem title="Notice Board" onPress={() => navigation.navigate('Notice')} />
          <MenuItem title="Timetable" onPress={() => navigation.navigate('Routine')} />
          <MenuItem title="Homework" onPress={() => navigation.navigate('Homework')} />
        </View>

        <View style={styles.card}>
          <MenuItem title="FAQs" onPress={() => navigation.navigate('Faq')} />
          <MenuItem title="Contact Us" onPress={() => navigation.navigate('Contactus')} />
          <MenuItem title="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
          <MenuItem title="Terms & Conditions" onPress={() => navigation.navigate('TermsandCondition')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogout(true)}>
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>

      </ScrollView>

    <AppAlertModal
  visible={showLogout}
  title="Logout"
  message="Are you sure you want to logout?"
  iconName="log-out-outline"
  iconColor="#e74c3c"
  confirmText="Logout"
  cancelText="Cancel"
  onCancel={() => setShowLogout(false)}
  onConfirm={confirmLogout}
/>
 </>
    
    </View>
  );
};

const MenuItem = ({ title, onPress }) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress}>
    <Text style={styles.menuText}>{title}</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
);

export default Sidebar;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundcolor },

  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 3,
  },

  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },

  menuText: { fontSize: 15, color: colors.black },
  arrow: { fontSize: 22, color: colors.gray2 },

  logoutBtn: {
    marginTop: 24,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },

  logoutText: { color: colors.red, fontWeight: '600' },

});
