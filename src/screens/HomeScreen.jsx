import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  AppState,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { BottomNavigator } from '../navigation/BottomNavigator';
import { icons } from '../utils/icons';
import StudentHeader from '../components/StudentHeader';
import { colors } from '../utils/colors';
import { fetchStudentProfileDetail } from '../services/studentApi';
import FullScreenLoader from '../components/FullScreenLoader';
import { studentimageapi } from './Api';
import { getAuthContext } from '../services/appStorage';
import { studentApi } from '../services/studentApi';
import HomePaymentReminderModal from '../components/HomePaymentReminderModal';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAD = 20;
const CARD_GAP = 12;
const TILE_SIZE = (SCREEN_WIDTH - PAD * 2 - CARD_GAP * 2) / 3;
const STUDENT_PHOTO_SIZE = 96;

export function HomeScreen({ navigation }) {
const isHomeFocused = useIsFocused();
const [student, setStudent] = useState(null);
const [loading, setLoading] = useState(true);
const [hasTransport, setHasTransport] = useState(false);
const [showPaymentReminder, setShowPaymentReminder] = useState(false);
const [pendingDueAmount, setPendingDueAmount] = useState(null);

useEffect(() => {
  fetchStudentProfile();
  checkTransportAllotted();
}, []);

const fetchStudentProfile = async () => {
  try {
    const data = await fetchStudentProfileDetail();
    if (data) {
      setStudent(data);
    }
  } catch (error) {
    console.log("Profile Error:", error);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }
};
const checkTransportAllotted = async () => {
  try {
    const { jwt, studentId } = await getAuthContext();

    if (!jwt || !studentId) {
      setHasTransport(false);
      return;
    }

    const response = await studentApi.post('transport_details.php', {
      studentid: studentId,
    });

    if (
      response?.data?.status === true &&
      response?.data?.data?.length > 0
    ) {
      const transport = response.data.data[0];

      if (transport?.status === '0') {
        setHasTransport(false);
      } else {
        setHasTransport(true);
      }
    } else {
      setHasTransport(false);
    }
  } catch (error) {
    console.log('Home Transport Check Error:', error);
    setHasTransport(false);
  }
};

const fetchPendingFeeReminder = useCallback(async () => {
  // Re-evaluate on every Home visit so paid students never see a stale reminder.
  setShowPaymentReminder(false);
  setPendingDueAmount(null);

  try {
    const { jwt, studentId } = await getAuthContext();

    if (!jwt || !studentId) return;

    const response = await studentApi.post('student_master_ledger.php', {
      studentid: studentId,
    });
    const totalDue = Number(
      String(response?.data?.summary?.total_due ?? 0).replace(/[^\d.-]/g, '')
    );

    if (response?.data?.status === true && totalDue > 0) {
      setPendingDueAmount(
        totalDue.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
      setShowPaymentReminder(true);
    }
  } catch (error) {
    // Keep the reminder hidden when fee information cannot be confirmed.
    console.log('Home Fee Reminder Error:', error);
  }
}, []);

useFocusEffect(
  useCallback(() => {
    fetchPendingFeeReminder();
  }, [fetchPendingFeeReminder])
);

useEffect(() => {
  const appStateSubscription = AppState.addEventListener('change', nextState => {
    if (nextState === 'active' && isHomeFocused) {
      fetchPendingFeeReminder();
    }
  });

  return () => appStateSubscription.remove();
}, [fetchPendingFeeReminder, isHomeFocused]);

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

      <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 88 }]}
        showsVerticalScrollIndicator={false}
      >
       <StudentHeader
  student={student}
  navigation={navigation}
  showNotification={true}
  showId={true}
  showClass={false}
/>
<View style={styles.quickGrid}>

{[
  {
    title: 'My Profile',
    color: '#C8F1E4',
    icon: icons.Avatar,
    screen: 'StudentProfile',
  },

    {
    title: 'Attendance',
    color: '#D9ECFF',
    icon: 'https://cdn-icons-png.flaticon.com/512/942/942748.png',
    screen: 'Attendence',
  },
  {
    title: 'Homework',
    color: '#FFFDE7',
    icon: icons.Homework,
    screen: 'Homework',
  },
  {
    title: 'Fee Record',
    color: '#FFE6F0',
    icon: icons.Fee,
    screen: 'TutionFee',
  },
  {
    title: 'Timetable',
    color: '#E8F5E9',
    icon: icons.Timetable,
    screen: 'Routine',
  },
  {
    title: 'Notice Board',
    color: '#FFF3CD',
    icon: icons.Notice,
    screen: 'Notice',
  },
   {
    title: 'Academics Calendar',
    color: '#FFF3CD',
    icon: icons.Calender,
    screen: 'AcademicsCalender',
  },
  {
    title: 'Transport',
    color: '#E0F2F1',
    icon: icons.Transport,
    screen: 'Transportation',
  },
  {
    title: 'Message',
    color: '#E3F2FD',
    icon: icons.Message,
    screen: 'Message',
  },
  {
    title: 'FAQs',
    color: '#FCE4EC',
    icon: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png',
    screen: 'Faq',
  },
  // ...(hasTransport
  //   ? [
  //       {
  //         title: 'Track Location',
  //         color: '#FFFDE7',
  //         icon: icons.Location,
  //         screen: 'TrackLocation',
  //       },
  //     ]
  //   : []),
].map((item, index) => (

    <TouchableOpacity
      key={index}
      activeOpacity={0.85}
      style={styles.quickCardWrap}
      onPress={() => navigation.navigate(item.screen)}
    >
      <View style={[styles.quickCard, { backgroundColor: item.color }]}>
<Image
  source={
    typeof item.icon === 'string'
      ? { uri: item.icon }
      : item.icon
  }
  style={styles.quickIcon}
/>
        <Text style={styles.quickText}>{item.title}</Text>
      </View>
    </TouchableOpacity>

  ))}

</View>

      </ScrollView>
        <View style={styles.bottomNavWrapper}>
      <BottomNavigator />
    </View>
    </>
    
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundcolor,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
quickGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  marginTop: -30,
},

quickCardWrap: {
  width: '31%',
  marginBottom: 14,
},

quickCard: {
  height: 110,
  borderRadius: 18,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 4,
  shadowColor: colors.black,
  shadowOpacity: 0.08,
  shadowRadius: 6,
},

quickIcon: {
  width: 40,
  height: 40,
  marginBottom: 6,
},

quickText: {
  fontSize: 12,
  fontWeight: '700',
  color: colors.gray2,
  textAlign: 'center',
},

bottomNavWrapper: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
},
});
