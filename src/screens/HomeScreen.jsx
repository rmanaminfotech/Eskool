import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { BottomNavigator } from '../navigation/BottomNavigator';
import HomePaymentReminderModal from '../components/HomePaymentReminderModal';
import FullScreenLoader from '../components/FullScreenLoader';
import { fetchStudentProfileDetail, studentApi } from '../services/studentApi';
import { getAuthContext } from '../services/appStorage';
import { studentimageapi } from './Api';
import { icons } from '../utils/icons';

const HOME_ACTIONS = [
  { title: 'My Profile', subtitle: 'View and update\nyour details', screen: 'StudentProfile', icon: icons.Avatar, color: '#e1faf0', tint: '#038a51' },
  { title: 'Attendance', subtitle: 'Check your\nattendance', screen: 'Attendence', icon: require('../assets/icons/dashboard-attendance.png'), generated: true, color: '#e1f2ff', tint: '#1976d2' },
  { title: 'Homework', subtitle: 'View assigned\nhomework', screen: 'Homework', icon: require('../assets/icons/dashboard-homework.png'), generated: true, color: '#fff2df', tint: '#f57c00' },
  { title: 'Fee Record', subtitle: 'Check fee details\nand receipts', screen: 'TutionFee', icon: require('../assets/icons/dashboard-fee.png'), generated: true, color: '#ffe8f0', tint: '#e91e63' },
  { title: 'Timetable', subtitle: 'View your class\nschedule', screen: 'Routine', icon: require('../assets/icons/dashboard-timetable.png'), generated: true, color: '#ebe9ff', tint: '#5846c9' },
  { title: 'Notice Board', subtitle: 'Latest updates\nfrom school', screen: 'Notice', icon: require('../assets/icons/dashboard-notice.png'), generated: true, color: '#fff7cc', tint: '#ef8b00' },
  { title: 'Academics\nCalendar', subtitle: 'Exams, events and\nacademic dates', screen: 'AcademicsCalender', icon: require('../assets/icons/dashboard-academics.png'), generated: true, color: '#e4f3ff', tint: '#1661bc' },
  { title: 'Transport', subtitle: 'View transport\ninformation', screen: 'Transportation', icon: require('../assets/icons/dashboard-transport.png'), generated: true, color: '#e4fae5', tint: '#138a49' },
  { title: 'Message', subtitle: 'Communicate\nwith school', screen: 'Message', icon: require('../assets/icons/dashboard-message.png'), generated: true, color: '#ffe7f0', tint: '#e91e63' },
  { title: 'FAQs', subtitle: 'Find answers to\ncommon questions', screen: 'Faq', icon: require('../assets/icons/dashboard-faq.png'), generated: true, color: '#eceaff', tint: '#5946cc' },
];

export function HomeScreen({ navigation }) {
  const isHomeFocused = useIsFocused();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentReminder, setShowPaymentReminder] = useState(false);
  const [pendingDueAmount, setPendingDueAmount] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchStudentProfileDetail();
        if (data) setStudent(data);
      } catch (error) {
        console.log('Profile Error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const fetchPendingFeeReminder = useCallback(async () => {
    setShowPaymentReminder(false);
    setPendingDueAmount(null);
    try {
      const { jwt, studentId } = await getAuthContext();
      if (!jwt || !studentId) return;

      const response = await studentApi.post('student_master_ledger.php', { studentid: studentId });
      const totalDue = Number(String(response?.data?.summary?.total_due ?? 0).replace(/[^\d.-]/g, ''));
      if (response?.data?.status === true && totalDue > 0) {
        setPendingDueAmount(totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setShowPaymentReminder(true);
      }
    } catch (error) {
      console.log('Home Fee Reminder Error:', error);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchPendingFeeReminder();
  }, [fetchPendingFeeReminder]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && isHomeFocused) fetchPendingFeeReminder();
    });
    return () => subscription.remove();
  }, [fetchPendingFeeReminder, isHomeFocused]);

  const photoSource = student?.photo_name
    ? { uri: `${studentimageapi}${student.photo_name}` }
    : require('../assets/images/student-avatar-illustration.png');

  return (
    <View style={styles.container}>
      <FullScreenLoader visible={loading} />
      <HomePaymentReminderModal
        visible={showPaymentReminder}
        amount={pendingDueAmount || '0.00'}
        onClose={() => setShowPaymentReminder(false)}
        onPayNow={() => {
          setShowPaymentReminder(false);
          navigation.navigate('TutionFee');
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.banner}>
          <View style={styles.bannerBlobOne} />
          <View style={styles.bannerBlobTwo} />
          <View style={styles.schoolIdentity}>
            <Image source={require('../assets/images/logo.png')} style={styles.schoolLogo} />
            <View>
              <Text style={styles.schoolName}>TRINITY{'\n'}CONVENT SCHOOL</Text>
              <Text style={styles.schoolTagline}>Learn Well Today. Live Well Tomorrow.</Text>
            </View>
          </View>
          <Image
            source={require('../assets/images/school-building-banner.png')}
            style={styles.bannerBuildingImage}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notification')}>
            <Image
              source={require('../assets/icons/notification-bell.png')}
              style={styles.notificationBellImage}
            />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.studentCard}>
          <View style={styles.avatarHalo}>
            <Image source={photoSource} style={styles.studentPhoto} />
          </View>
          <View style={styles.studentInfo}>
            <Text numberOfLines={1} style={styles.studentName}>{student?.trainees_name || 'Student'}</Text>
            <Text style={styles.studentDetail}>ID - {student?.std_regno || '-'}</Text>
            <Text style={styles.studentDetail}>Class - {student?.class_name || '-'}</Text>
            <Text style={styles.studentDetail}>Roll - {student?.inst_meritrollno || '-'}</Text>
            <Text numberOfLines={1} style={styles.studentDetail}>Father's Name - {student?.faname || '-'}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('StudentProfile')}>
            <Text style={styles.profileButtonText}>View Profile</Text>
            <Text style={styles.profileArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {HOME_ACTIONS.map(item => (
            <TouchableOpacity
              key={item.screen}
              activeOpacity={0.86}
              style={[styles.actionCard, { backgroundColor: item.color }]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: item.generated ? 'transparent' : `${item.tint}18` }]}>
                {item.icon ? (
                  <Image source={item.icon} style={[styles.actionIcon, item.generated && styles.generatedActionIcon, !item.generated && { tintColor: item.tint }]} />
                ) : null}
              </View>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
              <View style={[styles.actionArrow, { backgroundColor: `${item.tint}18` }]}>
                <Text style={[styles.arrowText, { color: item.tint }]}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomNavWrapper}>
        <BottomNavigator />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fbff' },
  content: { paddingHorizontal: 4, paddingTop: 2, paddingBottom: 85 },
  banner: { height: 168, borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff5e2', padding: 16, position: 'relative' },
  bannerBlobOne: { position: 'absolute', width: 144, height: 144, borderRadius: 80, right: -45, top: -39, backgroundColor: '#aedbff' },
  bannerBlobTwo: { position: 'absolute', width: 106, height: 106, borderRadius: 60, left: -48, top: -40, backgroundColor: '#ffe0a7' },
  schoolIdentity: { flexDirection: 'row', alignItems: 'center', maxWidth: '82%', zIndex: 1 },
  schoolLogo: { width: 76, height: 76, resizeMode: 'contain', marginRight: 8 },
  schoolName: { color: '#0e2954', fontSize: 18, lineHeight: 19, fontWeight: '900', letterSpacing: -0.4 },
  schoolTagline: { color: '#627087', fontSize: 8.5, marginTop: 5, fontWeight: '600' },
  bannerBuildingImage: { position: 'absolute', right: -6, bottom: -7, width: 175, height: 103 },
  notificationButton: { position: 'absolute', top: 13, right: 13, width: 36, height: 36, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#1e385d', shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  notificationBellImage: { width: 21, height: 21, resizeMode: 'contain', transform: [{ scale: 2.8 }] },
  notificationDot: { position: 'absolute', right: 6, top: 6, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff354d' },
  studentCard: { minHeight: 118, marginHorizontal: 10, marginTop: -22, borderRadius: 15, backgroundColor: '#fff', padding: 14, flexDirection: 'row', alignItems: 'center', elevation: 5, shadowColor: '#203754', shadowOpacity: 0.13, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } },
  avatarHalo: { width: 79, height: 79, borderRadius: 40, padding: 4, backgroundColor: '#ffe79a', justifyContent: 'center', alignItems: 'center' },
  studentPhoto: { width: 71, height: 71, borderRadius: 36, resizeMode: 'cover' },
  studentInfo: { flex: 1, marginLeft: 11, paddingRight: 2 },
  studentName: { color: '#102b55', fontSize: 17, fontWeight: '900', marginBottom: 3 },
  studentDetail: { color: '#59657b', fontSize: 10.5, lineHeight: 14, fontWeight: '500' },
  profileButton: { position: 'absolute', right: 13, top: 50, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3e3', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 10 },
  profileButtonText: { color: '#ed7608', fontSize: 10.5, fontWeight: '900' },
  profileArrow: { color: '#ed7608', fontSize: 20, fontWeight: '600', lineHeight: 20, marginLeft: 3, marginTop: -2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 15 },
  actionCard: { width: '31.8%', height: 120, borderRadius: 12, marginBottom: 9, padding: 11, overflow: 'hidden', elevation: 3, shadowColor: '#263a59', shadowOpacity: 0.08, shadowRadius: 9, shadowOffset: { width: 0, height: 3 } },
  actionIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  actionIcon: { width: 29, height: 29, resizeMode: 'contain' },
  generatedActionIcon: { transform: [{ scale: 2.45 }] },
  faqIcon: { fontSize: 29, fontWeight: '900', lineHeight: 33 },
  actionTitle: { color: '#102b55', fontSize: 12, lineHeight: 14, fontWeight: '900', minHeight: 28 },
  actionSubtitle: { color: '#556177', fontSize: 10, lineHeight: 13, marginTop: 2, fontWeight: '500' },
  actionArrow: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'absolute', right: 8, bottom: 8 },
  arrowText: { fontSize: 24, fontWeight: '600', lineHeight: 24, marginTop: -2 },
  bottomNavWrapper: { position: 'absolute', bottom: 0, left: 7, right: 7, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, elevation: 14, shadowColor: '#233758', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } },
});
