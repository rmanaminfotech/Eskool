import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { studentimageapi } from '../screens/Api';
import { colors } from '../utils/colors';
import Icon from 'react-native-vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { getAuthContext } from '../services/appStorage';
import { studentApi } from '../services/studentApi';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function CommonHeader({
  student,
  navigation,
  showNotification = true,
}) {

  const [count, setCount] = useState(0);

useFocusEffect(
  useCallback(() => {
    fetchNotificationCount();
  }, [])
);

const fetchNotificationCount = async () => {
  try {
    const { studentId } = await getAuthContext();
    if (!studentId) return;

    const res = await studentApi.post('today_notification.php', {
      student_id: studentId,
    });

    if (res?.data?.status) {
      setCount(res.data.count || 0);
    }
  } catch (e) {
    console.log('Count Error:', e);
  }
};
  return (
    <LinearGradient
      colors={['#FF9800', '#FFC107', '#FFEB3B']}
      style={styles.header}
    >
      <View style={styles.headerRow}>

  {/* Student Image */}
  <Image
   source={
     student?.photo_name
       ? { uri: `${studentimageapi}${student.photo_name}` }
       : require('../assets/icons/avatar.png')
   }
   style={styles.studentImg}
   resizeMode="cover"
 />

  {/* Name + Class */}
  <View style={styles.centerWrap}>
    <Text style={styles.headerTitle}>
      {student?.trainees_name || "-"}
    </Text>

    <Text style={styles.session}>
      Class: {student?.class_name || "-"} 
    </Text>
  </View>

{showNotification ? (
  <TouchableOpacity
    style={styles.notificationBtn}
    onPress={() => navigation?.navigate('Notification')}
  >
    <Icon name="notifications-outline" size={20} color={colors.black} />

    {count > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {count > 9 ? '9+' : count}
        </Text>
      </View>
    )}
  </TouchableOpacity>
) : (
  <View style={{ width: 35, height: 35 }} />
)}

</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  studentImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
  },

  centerWrap: {
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },

  session: {
    marginTop: 4,
    color: colors.gray2,
    fontSize: 13,
  },

  notificationIcon: {
    width: 22,
    height: 22,
  },
  notificationBtn: {
  width: 35,
  height: 35,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.9)',
},
badge: {
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: 'red',
  borderRadius: 10,
  minWidth: 16,
  height: 16,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 3,
},

badgeText: {
  color: '#fff',
  fontSize: 9,
  fontWeight: '700',
},
});