import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import CommonHeader from '../components/CommonHeader';
import { colors } from '../utils/colors';
import { fetchStudentProfileDetail } from '../services/studentApi';
import FullScreenLoader from '../components/FullScreenLoader';
import { getAuthContext } from '../services/appStorage';
import { studentApi } from '../services/studentApi';

const Notification = () => {
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [student, setStudent] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      await Promise.all([fetchProfile(), fetchNotifications()]);
    } catch (e) {
      console.log('Init Error:', e);
    } finally {
      setLoading(false);
    }
  };
const formatDate = (dateStr) => {
  if (!dateStr) return '';

  const parts = dateStr.split('-'); // ["2026","04","21"]
  if (parts.length !== 3) return dateStr;

  const [year, month, day] = parts;
  return `${day}-${month}-${year}`;
};

  const fetchNotifications = async () => {
    try {
      const { studentId } = await getAuthContext();

      if (!studentId) return;

      const res = await studentApi.post('today_notification.php', {
        student_id: studentId,
        // class_id: "1"
      });

      if (res?.data?.status) {
        const apiData = res.data.data || [];

      const formatted = apiData.map((item, index) => ({
  id: String(index),
  title: item.title,
  message: item.message,
  time: formatDate(item.date),
  unread: true,
  type: item.type,   // ✅ ADD THIS
}));

        setNotifications(formatted);
      }
    } catch (error) {
      console.log('Notification API Error:', error);
    }
  };

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

  return (
    <View style={styles.container}>
      <FullScreenLoader visible={loading} />

      <>
        {/* HEADER */}
        <CommonHeader
          student={student}
          navigation={navigation}
          showNotification={false}
        />

        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>Today's Notifications</Text>
        </View>

        {/* LIST */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14 }}
          renderItem={({ item }) => (
           <TouchableOpacity
  style={[
    styles.card,
    item.unread && styles.unreadCard,
  ]}
  activeOpacity={0.8}
  onPress={() => {
    switch (item.type) {
      case 'homework':
        navigation.navigate('Homework');
        break;
      case 'bill':
        navigation.navigate('TutionFee');
        break;
      case 'notice':
        navigation.navigate('Notice');
        break;
      case 'attendance':
        navigation.navigate('Attendence');
        break;
      case 'holiday':
        navigation.navigate('Notice');
        break;
      default:
        console.log('Unknown type:', item.type);
    }
  }}
>
              <View style={styles.row}>
                <View style={styles.iconWrapper}>
                  <Icon name="notifications" size={20} color={colors.orange} />
                </View>

                <View style={styles.textContainer}>
                 <View style={styles.titleRow}>
  <Text style={styles.title} numberOfLines={1}>
    {item.title}
  </Text>

  <Text style={styles.time}>
    {item.time}
  </Text>
</View>

<Text style={styles.message}>{item.message}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </>
    </View>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundcolor,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
    color: '#444',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.orange,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3CD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
title: {
  fontSize: 15,
  fontWeight: '700',
  color: colors.black,
  flex: 1,           
  marginRight: 10,   
},
  message: {
    fontSize: 13,
    color: colors.gray2,
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    color: colors.gray2,
    marginTop: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
  },
  titleContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.black,
  },
});