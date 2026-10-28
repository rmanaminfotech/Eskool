import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BottomNavigator } from '../navigation/BottomNavigator';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
import StudentHeader from '../components/StudentHeader';
import { useNavigation } from '@react-navigation/native';
import { fetchStudentProfileDetail } from '../services/studentApi';
import { colors } from '../utils/colors';
import FullScreenLoader from '../components/FullScreenLoader';
const STUDENT_PHOTO_SIZE = 96;

export default function StudentProfile() {
const navigation = useNavigation();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProfile();
  }, []);

const fetchStudentProfile = async () => {
  try {
    const data = await fetchStudentProfileDetail();
    if (data) {
      setStudent(data);
    }
  } catch (error) {
    console.log("Profile API Error:", error);
  } finally {
    setLoading(false);
  }
};
  // Format Permanent Address
const permanentAddress = [
  student?.address_permanent,
  student?.pdistt,
  student?.pstate && student?.p_pin && student?.p_pin !== "0"
    ? `${student?.pstate} - ${student?.p_pin}`
    : student?.pstate || student?.p_pin
]
  .filter(Boolean)
  .join(", ");

const formatDate = (date) => {
  if (!date) return '-';

  const d = new Date(date);

  if (isNaN(d.getTime())) return date; 

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

// Format Present Address
const presentAddress = [
  student?.corr_add,
  student?.c_distt,
  student?.c_state && student?.c_pin && student?.c_pin !== "0"
    ? `${student?.c_state} - ${student?.c_pin}`
    : student?.c_state || student?.c_pin
]
  .filter(Boolean)
  .join(", ");

  return (
    <View style={{ flex: 1 }}>

      <FullScreenLoader visible={loading} />

        <ScrollView style={styles.container}
        contentContainerStyle={[{ paddingBottom: 90 }]}

        >

        <StudentHeader
  student={student}
    navigation={navigation}
  showNotification={false}
  showId={true}
/>

          <Section title="Basic Information">
            <Row label="Session" value={student?.session} />
            <Row label="Gender" value={student?.gender} />
            <Row label="Date of Birth" value={formatDate(student?.dob)} />
            <Row label="Religion" value={student?.religion} />
            <Row label="Blood Group" value={student?.blood_group} />
          </Section>

          <Section title="Parent Details">
            <Row label="Father Name" value={student?.faname} />
            <Row label="Mother Name" value={student?.mname} />
            <Row label="Father Mobile" value={student?.guardian_mob} />
            <Row label="Mother Mobile" value={student?.mother_mobile} />
            <Row label="Email" value={student?.email} />
            <Row label="Family Income" value={student?.father_income} />
            

          </Section>

          <Section title="Address">
            <Row label="Present Address" value={presentAddress} />
<Row label="Permanent Address" value={permanentAddress} />

          </Section>

        </ScrollView>
      
        <View style={styles.bottomNavWrapper}>
            <BottomNavigator />
          </View>
    </View>
  );
}

/* COMPONENTS */

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Row = ({ label, value }) => {
  const isAddress = label.includes('Address');

  return (
    <View style={[styles.row, isAddress && styles.addressRow]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, isAddress && styles.addressValue]}>
        {value || "-"}
      </Text>
    </View>
  );
};

/* STYLES */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundcolor },

  header: {
    paddingVertical: 30,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerTop: { flexDirection: 'row', alignItems: 'center' },

  headerTextWrap: { flex: 1, marginLeft: 16 },

  greeting: { fontSize: 18, fontWeight: '700' },

  code: { fontSize: 13 },

  year: { fontSize: 13 },

  studentPhotoWrap: {
    width: STUDENT_PHOTO_SIZE,
    height: STUDENT_PHOTO_SIZE,
    borderRadius: STUDENT_PHOTO_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.border,
  },

  studentPhoto: { width: '100%', height: '100%' },

  section: { backgroundColor: colors.white, margin: 12, borderRadius: 12, padding: 14 },

  sectionTitle: { fontWeight: '700', marginBottom: 10 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  label: { fontSize: 13 },

  value: { fontWeight: '600', fontSize: 13 },

  addressRow: { flexDirection: 'column' },

  addressValue: { marginTop: 6 },
  bottomNavWrapper: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
},
});
