import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomNavigator } from '../navigation/BottomNavigator';
import { fetchStudentProfileDetail, studentApi } from '../services/studentApi';
import { studentimageapi } from './Api';
import FullScreenLoader from '../components/FullScreenLoader';

const noticeArt = require('../assets/icons/dashboard-notice.png');
const eventArt = require('../assets/icons/dashboard-homework.png');
const holidayArt = require('../assets/icons/calender.png');
const schoolLogo = require('../assets/images/logo.png');
const defaultAvatar = require('../assets/images/student-avatar-illustration.png');
const bell = require('../assets/icons/notification-bell.png');

const formatDate = value => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normaliseCategory = value => {
  const category = String(value || 'General').trim();
  if (/holiday/i.test(category)) return 'Holiday';
  if (/event/i.test(category)) return 'Event';
  if (/academic/i.test(category)) return 'Academic';
  return 'General';
};

const categoryAppearance = category => {
  if (category === 'Holiday') return { pill: '#dff8e8', text: '#13984d', icon: holidayArt };
  if (category === 'Event') return { pill: '#eee2ff', text: '#7542d6', icon: eventArt };
  if (category === 'Academic') return { pill: '#dceeff', text: '#126ac6', icon: noticeArt };
  return { pill: '#ffe0e9', text: '#ef2d5d', icon: noticeArt };
};

function NewBadge() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.28, duration: 650, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <Animated.View style={[styles.newBadge, { opacity }]}><Text style={styles.newBadgeText}>NEW</Text></Animated.View>;
}

export default function Notice() {
  const navigation = useNavigation();
  const [student, setStudent] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadScreen = useCallback(async () => {
    setLoading(true);
    try {
      const [profileResult, noticeResult] = await Promise.allSettled([
        fetchStudentProfileDetail(),
        studentApi.get('notice_record.php'),
      ]);
      if (profileResult.status === 'fulfilled') setStudent(profileResult.value);
      if (noticeResult.status === 'fulfilled' && noticeResult.value?.data?.status === true) {
        setNotices(noticeResult.value.data.data.map(item => ({
          nb_id: String(item.nb_id),
          nb_title: item.title || 'Notice',
          nb_date: item.date,
          nb_pdf: item.pdf,
          pdf_url: item.pdf_url,
          // Different school panels use different keys for the same notice body.
          nb_message: item.message || item.description || item.details || item.nb_message || item.nb_description || item.nb_details || item.nb_notice || item.notice_message || item.notice_content || item.content || item.msg || '',
          category: normaliseCategory(item.category || item.type),
          time: item.time || item.nb_time,
        })));
      } else setNotices([]);
    } catch (error) {
      console.log('Notice screen error:', error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadScreen(); }, [loadScreen]));

  const renderNotice = ({ item, index }) => {
    const appearance = categoryAppearance(item.category);
    return (
      <TouchableOpacity style={[styles.noticeRow, index === 0 && styles.featuredRow]} activeOpacity={0.9} onPress={() => navigation.navigate('NoticeDetails', { notice: item })}>
        {index < 3 && <NewBadge />}
        <View style={styles.rowArt}><Image source={appearance.icon} style={styles.rowImage} /></View>
        <View style={styles.rowCopy}><Text numberOfLines={1} style={styles.rowTitle}>{item.nb_title}</Text><Text style={styles.rowDate}>{formatDate(item.nb_date)}</Text></View>
        <View style={[styles.typePill, { backgroundColor: appearance.pill }]}><Text style={[styles.typeText, { color: appearance.text }]}>{item.category}</Text></View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <FullScreenLoader visible={loading} />
      <FlatList
        data={notices} renderItem={renderNotice} keyExtractor={item => item.nb_id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}
        ListHeaderComponent={<>
          <LinearGradient colors={['#ffbd31', '#ffe49b', '#fffaf0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.studentHero}>
            <View style={styles.heroWhiteBlob} />
            <Image source={student?.photo_name ? { uri: `${studentimageapi}${student.photo_name}` } : defaultAvatar} style={styles.avatar} />
            <View style={styles.studentCopy}><Text numberOfLines={1} style={styles.studentName}>{student?.trainees_name || 'Student'}</Text><Text style={styles.studentLine}>ID - {student?.sl_id || student?.admission_no || '-'}</Text><Text numberOfLines={1} style={styles.studentLine}>Class - {student?.class_name || '-'}</Text><Text style={styles.studentLine}>Roll - {student?.roll_no || '-'}</Text><Text numberOfLines={1} style={styles.studentLine}>Father's Name - {student?.father_name || '-'}</Text></View>
            <Image source={schoolLogo} style={styles.schoolLogo} resizeMode="contain" />
            <TouchableOpacity style={styles.bellButton} onPress={() => navigation.navigate('Notification')}><Image source={bell} style={styles.bell} /></TouchableOpacity>
          </LinearGradient>
          <View style={styles.boardCard}>
            <View style={styles.boardHeading}><View style={styles.boardArt}><Image source={noticeArt} style={styles.boardIcon} /></View><View style={styles.boardTitleBox}><Text style={styles.boardTitle}>Notice Board</Text><Text style={styles.boardSubtitle}>Latest updates from school</Text></View></View>
          </View>
        </>}
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No notices available.</Text> : null}
      />
      <View style={styles.bottomNav}><BottomNavigator /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6fbff' }, listContent: { paddingBottom: 74 },
  // Keep the compact reference banner: the old 253dp height left a large empty area above the Notice Board.
  studentHero: { height: 200, overflow: 'hidden', borderBottomLeftRadius: 27, borderBottomRightRadius: 27 },
  heroWhiteBlob: { position: 'absolute', width: 250, height: 240, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.65)', top: -106, right: -37 },
  // These match the reference positions rather than allowing a long class name to push the logo away.
  avatar: { position: 'absolute', left: 18, top: 53, width: 104, height: 104, borderRadius: 54, borderWidth: 5, borderColor: '#fff', backgroundColor: '#ffdf82', zIndex: 1 },
  studentCopy: { position: 'absolute', left: 134, top: 62, right: 112, zIndex: 1 },
  studentName: { color: '#101b4b', fontSize: 24, fontWeight: '900', marginBottom: 7 }, studentLine: { color: '#596680', fontSize: 14, lineHeight: 21, fontWeight: '500' },
  schoolLogo: { position: 'absolute', right: 14, top: 62, width: 104, height: 112, zIndex: 1 },
  bellButton: { position: 'absolute', right: 15, top: 23, width: 49, height: 49, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  // The PNG has transparent edges, so it is intentionally larger than its white button.
  bell: { width: 50, height: 50, resizeMode: 'contain' },
  boardCard: { marginHorizontal: 13, marginTop: -13, padding: 18, paddingBottom: 16, borderRadius: 26, backgroundColor: '#fff', elevation: 4, shadowColor: '#23314b', shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } },
  boardHeading: { flexDirection: 'row', alignItems: 'center' }, boardArt: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff5e8', alignItems: 'center', justifyContent: 'center' }, boardIcon: { width: 50, height: 50, resizeMode: 'contain', transform: [{ scale: 1.35 }] }, boardTitleBox: { flex: 1, marginLeft: 12 }, boardTitle: { color: '#101b4b', fontSize: 24, fontWeight: '900' }, boardSubtitle: { color: '#68738b', fontSize: 15, marginTop: 3 },
  noticeRow: { minHeight: 101, marginHorizontal: 13, marginTop: 12, paddingHorizontal: 17, borderRadius: 21, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#20324c', shadowOpacity: 0.08, shadowRadius: 9, shadowOffset: { width: 0, height: 3 } }, featuredRow: { backgroundColor: '#eef8ff' }, rowArt: { width: 61, height: 61, borderRadius: 31, backgroundColor: '#fff5e8', alignItems: 'center', justifyContent: 'center' }, rowImage: { width: 43, height: 43, resizeMode: 'contain', transform: [{ scale: 1.32 }] }, rowCopy: { flex: 1, marginLeft: 15, marginRight: 5 }, rowTitle: { color: '#101b4b', fontSize: 17, fontWeight: '900' }, rowDate: { color: '#6b7791', fontSize: 14, marginTop: 6, fontWeight: '500' }, typePill: { minWidth: 73, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 19, alignItems: 'center' }, typeText: { fontSize: 12, fontWeight: '900' }, chevron: { color: '#7d8495', fontSize: 43, fontWeight: '300', lineHeight: 43, marginLeft: 8, marginTop: -3 }, newBadge: { position: 'absolute', top: 7, right: 20, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9, backgroundColor: '#ffd35e', zIndex: 2 }, newBadgeText: { color: '#6b4700', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 }, emptyText: { textAlign: 'center', color: '#778198', fontSize: 15, fontWeight: '700', marginTop: 40 }, bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
