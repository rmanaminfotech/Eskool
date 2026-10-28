import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BottomNavigator } from '../navigation/BottomNavigator';
import { useNavigation } from '@react-navigation/native';
import CommonHeader from '../components/CommonHeader';
import { colors } from '../utils/colors';
import { getAuthContext } from '../services/appStorage';
import { fetchStudentProfileDetail, studentApi } from '../services/studentApi';
import FullScreenLoader from '../components/FullScreenLoader';
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export function Attendence() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [holidaysList, setHolidaysList] = useState([]);
const [loading, setLoading] = useState(true);
const navigation = useNavigation();
const [student, setStudent] = useState(null);
useEffect(() => {
  fetchProfile();
}, []);

const fetchProfile = async () => {
  try {
    const data = await fetchStudentProfileDetail();
    if (data) {
      setStudent(data);
    }
  } catch (error) {
    console.log('Profile API Error:', error);
  }
};

  useEffect(() => {
    fetchCalendar();
  }, [month, year]);

  const fetchCalendar = async () => {
    try {
      setLoading(true);

      const { jwt, studentId } = await getAuthContext();

      if (!studentId || !jwt) {
        console.log("Student data missing");
        return;
      }

      const response = await studentApi.post('student_calendar.php', {
        studentid: studentId,
      });

      const result = response.data;

      if (result?.status) {
        const attendance = result.attendance || [];
        const holidays = result.holidays || [];
        setHolidaysList(holidays);

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const calendarArray = [];

        // Empty boxes before first day
        for (let i = 0; i < firstDayOfMonth; i++) {
          calendarArray.push({ empty: true });
        }

        for (let day = 1; day <= daysInMonth; day++) {
          const fullDate = `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;

          const attendanceRecord = attendance.find(
            (a) => a.date === fullDate
          );

          const holidayRecord = holidays.find(
            (h) => h.date === fullDate
          );

          const weekday = new Date(year, month, day).getDay();

          let status = "";

          // Attendance logic (0 = Absent, 1 = Present)
          if (attendanceRecord) {
            status =
              attendanceRecord.status === "1"
                ? "Present"
                : "Absent";
          }

          // Holiday overrides
          if (holidayRecord) {
            status = "Holiday";
          }

          // Sunday only if not marked
          if (!attendanceRecord && !holidayRecord && weekday === 0) {
            status = "Sunday";
          }

          calendarArray.push({
            day,
            status,
            fullDate,
          });
        }

        setData(calendarArray);
      }
    } catch (error) {
      console.log("Calendar API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (dir) => {
    let m = month + dir;
    let y = year;

    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }

    setMonth(m);
    setYear(y);
  };

const totalDays = data.filter(d => !d.empty).length;
const sundayCount = data.filter(
  d => d.status === 'Sunday').length;
const holidayCount = data.filter(
  d => d.status === 'Holiday').length;
const schoolDays = totalDays - (sundayCount + holidayCount);
const present = data.filter(d => d.status === 'Present').length;
const absent = data.filter(d => d.status === 'Absent').length;

return (
  <View style={styles.container}>
  <FullScreenLoader visible={loading} />

   
      <>
        <CommonHeader
          student={student}
          navigation={navigation}
          showNotification={true}
        />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
  <TouchableOpacity onPress={() => changeMonth(-1)}>
    <Text style={styles.arrow}>‹</Text>
  </TouchableOpacity>

  <Text style={styles.month}>
    {MONTHS[month]} {year}
  </Text>

  <TouchableOpacity onPress={() => changeMonth(1)}>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
</View>

          <FlatList
            data={data}
            numColumns={7}
            scrollEnabled={false}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.calendar}
            renderItem={({ item }) => {
              if (item.empty) {
                return <View style={styles.dayBox} />;
              }

              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    item.status === 'Holiday' && setSelectedDay(item)
                  }
                  style={[
                    styles.dayBox,
                    item.status === 'Present' && styles.present,
                    item.status === 'Absent' && styles.absent,
                    item.status === 'Holiday' && styles.holiday,
                    item.status === 'Sunday' && styles.sunday,
                  ]}
                >
                  <Text style={styles.day}>{item.day}</Text>
                  <Text style={styles.status}>
                    {item.status ? item.status[0] : ''}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.summaryGrid}>
            <Summary label="School Days" value={schoolDays} bg={colors.gray} />
            <Summary label="Present" value={present} bg={colors.present} />
            <Summary label="Absent" value={absent} bg={colors.absent} />
            <Summary label="Holiday" value={holidayCount} bg={colors.holiday} />
          </View>
        </ScrollView>

        <View style={styles.bottomNavWrapper}>
          <BottomNavigator />
        </View>
      </>

    <Modal transparent visible={!!selectedDay} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Holiday</Text>

          <Text style={styles.modalDate}>
            {selectedDay?.day} {MONTHS[month]} {year}
          </Text>

          <Text style={styles.modalHoliday}>
            {
              holidaysList.find(
                h => h.date === selectedDay?.fullDate
              )?.occasion || 'School Holiday'
            }
          </Text>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setSelectedDay(null)}
          >
            <Text style={{ color: colors.white, fontWeight: '700' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

  </View>
);}

const Summary = ({ label, value, bg }) => (
  <View style={[styles.summaryCard, { backgroundColor: bg }]}>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundcolor },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius:24, 
  },
  arrow: { fontSize: 28, fontWeight: '700' },
  month: { fontSize: 18, fontWeight: '700' },
  calendar: { paddingHorizontal: 8, paddingTop: 10 },
  dayBox: {
    width: '14.1%',
    aspectRatio: 1,
    marginVertical: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  day: { fontWeight: '700', fontSize: 12 },
  status: { fontSize: 10 },
  present: { backgroundColor: colors.present },
  absent: { backgroundColor: colors.absent },
  holiday: { backgroundColor: colors.holiday },
  sunday: { backgroundColor: colors.gray },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 12,
  },
  summaryCard: {
    width: '48%',
    borderRadius: 14,
    paddingVertical: 22,
    marginBottom: 12,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 12, color: '#444', marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalDate: { marginTop: 6, color: colors.gray2 },
  modalHoliday: { marginTop: 12, fontSize: 16, fontWeight: '700' },
  closeBtn: {
    marginTop: 20,
    backgroundColor: colors.orange,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});