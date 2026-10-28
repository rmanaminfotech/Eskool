import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { studentimageapi } from '../screens/Api';
import { colors } from '../utils/colors';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAuthContext } from '../services/appStorage';
import { studentApi } from '../services/studentApi';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const STUDENT_PHOTO_SIZE = 96;

export default function StudentHeader({
  student,
  navigation,
  showNotification = false,
  showId = false,
  showClass = false,
}) {
  const insets = useSafeAreaInsets();
  const headerPaddingTop = insets.top + 12;
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
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.header, { paddingTop: headerPaddingTop }]}
    >
      <View style={styles.headerTop}>
        <View style={styles.studentPhotoWrap}>
         <Image
  source={
    student?.photo_name
      ? { uri: `${studentimageapi}${student.photo_name}` }
      : require('../assets/icons/avatar.png')
  }
  style={styles.studentPhoto}
  resizeMode="cover"
/>
        </View>

        <View style={styles.headerTextWrap}>
          <Text style={styles.greeting}>
            {student?.trainees_name || "-"}
          </Text>

          {showId && (
            <Text style={styles.code}>
              ID - {student?.std_regno || "-"}
            </Text>
          )}

          {showClass && (
            <Text style={styles.year}>
              Class/Section - {student?.class_name || "-"} / {student?.section || "-"}
            </Text>
          )}
          <View style={styles.detail}>
  <Text style={styles.year}>
    Roll - {student?.inst_meritrollno || ""}
  </Text>

  <Text style={[styles.year, { marginLeft: 20 }]}>
    Class - {student?.class_name || "-"}
  </Text>
</View>

          <Text style={styles.year}>
            Father's Name - {student?.faname || "-"}
          </Text>
        </View>

       
      </View>
       {showNotification && (
         <TouchableOpacity
  style={[styles.notificationBtn, { top: headerPaddingTop + 25 }]}
  onPress={() => navigation.navigate('Notification')}
>
  <Icon name="notifications-outline" size={22} color={colors.black} />

  {count > 0 && (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {count > 9 ? '9+' : count}
      </Text>
    </View>
  )}
</TouchableOpacity>
        )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    minHeight: 160,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  studentPhotoWrap: {
    width: STUDENT_PHOTO_SIZE,
    height: STUDENT_PHOTO_SIZE,
    borderRadius: STUDENT_PHOTO_SIZE / 2,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },

  studentPhoto: {
    width: '100%',
    height: '100%',
  },

  headerTextWrap: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },

  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },

  code: { fontSize: 13, color: colors.gray2, marginBottom: 2 },
  year: { fontSize: 13, color: colors.gray2 },

notificationBtn: {
  position: 'absolute',
  right: 20,
  width: 35,
  height: 35,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
      backgroundColor: "rgba(255,255,255,0.9)",

},
  notificationIcon: {
    width: 22,
    height: 22,
  },

  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: 'red',
  },
detail: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 2,
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