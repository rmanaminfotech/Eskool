import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export function Routine() {

  const getToday = () => {
    const today = DAYS[new Date().getDay()];
    return today === 'Sunday' ? 'Monday' : today;
  };

  const [activeDay, setActiveDay] = useState(getToday());
  const [routineData, setRoutineData] = useState({});
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
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
    fetchRoutine();
  }, []);

  const fetchRoutine = async () => {
    try {
      const { jwt, studentId } = await getAuthContext();

      if (!studentId || !jwt) {
        setLoading(false);
        return;
      }

      const response = await studentApi.post('class_routine.php', {
        studentid: studentId,
      });

      const result = response.data;

      if (result?.status === true) {
        setRoutineData(result.week_routine || {});
        setClassName(result.class_name || '');
        setSection(result.section || '');
      }

    } catch (error) {
      console.log('Routine API Error:', error);
    } finally {
      setLoading(false);
    }
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

        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>Class Routine</Text>
        </View>

        <View style={styles.dayRow}>
          {DAYS.slice(1).map(item => (
            <TouchableOpacity
              key={item}
              onPress={() => setActiveDay(item)}
              style={[
                styles.dayChip,
                activeDay === item && styles.dayActive,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  activeDay === item && styles.dayTextActive,
                ]}
              >
                {item.slice(0,3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <FlatList
            data={routineData[activeDay] || []}
            scrollEnabled={false}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {

              if (item.type === 'break') {
                return (
                  <View style={styles.lunchCard}>
                    <Text style={styles.lunchText}>🍱 {item.title}</Text>
                    <Text style={styles.lunchTime}>{item.time}</Text>
                  </View>
                );
              }

              return (
                <View style={styles.periodCard}>
                  <View style={styles.left}>
                    <Text style={styles.period}>{item.period}</Text>
                    <View>
                      <Text style={styles.subject}>{item.subject}</Text>
                      <Text style={styles.teacher}>{item.teacher}</Text>
                    </View>
                  </View>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
              );
            }}
          />
        </ScrollView>

        <View style={styles.bottomNavWrapper}>
          <BottomNavigator />
        </View>
      </>
    

  </View>
);}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundcolor },
  header: { padding: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { fontSize: 20, fontWeight: '800' },
  subTitle: { marginTop: 4, fontSize: 12, color: colors.subtitle },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 10, paddingVertical:10 },
  dayChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.white, marginRight: 8 },
  dayActive: { backgroundColor: colors.orange },
  dayText: { fontSize: 12, fontWeight: '600', color: colors.black },
  dayTextActive: { color: colors.white },
  periodCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  period: { fontSize: 12, fontWeight: '700', color: colors.orange, width: 28 },
  subject: { fontSize: 14, fontWeight: '700' },
  teacher: { fontSize: 11, color: colors.gray2, marginTop: 2 },
  time: { fontSize: 11, fontWeight: '600', color: colors.gray2 },
  lunchCard: { backgroundColor: '#FFF3CD', borderRadius: 12, padding: 14, marginBottom: 8, alignItems: 'center' },
  lunchText: { fontWeight: '800', color: colors.orange },
  lunchTime: { fontSize: 11, marginTop: 4, color: colors.gray2 },
  bottomNavWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  titleContainer: {
  paddingHorizontal: 16,
  marginTop: 16,
},

screenTitle: {
  fontSize: 18,
  fontWeight: '800',
  color: colors.gray2,
},
});