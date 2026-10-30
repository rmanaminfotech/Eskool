import React, { useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BottomNavigator } from '../navigation/BottomNavigator';
import { fetchStudentProfileDetail } from '../services/studentApi';
import { studentimageapi } from './Api';
import FullScreenLoader from '../components/FullScreenLoader';

const formatDate = date => {
  if (!date) return '-';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${String(parsed.getDate()).padStart(2, '0')}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${parsed.getFullYear()}`;
};

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchStudentProfileDetail();
        if (data) setStudent(data);
      } catch (error) {
        console.log('Profile API Error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const presentAddress = [student?.corr_add, student?.c_distt, student?.c_state, student?.c_pin && student.c_pin !== '0' ? student.c_pin : null].filter(Boolean).join(', ');
  const permanentAddress = [student?.address_permanent, student?.pdistt, student?.pstate, student?.p_pin && student.p_pin !== '0' ? student.p_pin : null].filter(Boolean).join(', ');
  const addressForMap = presentAddress || permanentAddress;
  const photoSource = student?.photo_name ? { uri: `${studentimageapi}${student.photo_name}` } : require('../assets/images/student-avatar-illustration.png');

  const openMap = () => {
    if (addressForMap) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressForMap)}`);
  };

  return (
    <View style={styles.screen}>
      <FullScreenLoader visible={loading} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={['#ff9d12', '#ffc442', '#fff7de']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hero}>
          <View style={styles.heroCurve} />
          <View style={styles.heroProfile}>
            <View style={styles.photoRing}>
              <Image source={photoSource} style={styles.photo} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.studentName}>{student?.trainees_name || 'Student'}</Text>
              <Text style={styles.heroDetail}>ID - {student?.std_regno || '-'}</Text>
              <Text style={styles.heroDetail}>Class - {student?.class_name || '-'}</Text>
              <Text style={styles.heroDetail}>Roll - {student?.inst_meritrollno || '-'}</Text>
              <Text style={styles.heroDetail}>Father's Name - {student?.faname || '-'}</Text>
            </View>
          </View>
          <Image source={require('../assets/images/logo.png')} style={styles.heroLogo} />
        </LinearGradient>

        <ProfileSection title="Basic Information" icon="▣" iconColor="#ef9709" iconBackground="#fff0bd" rightLabel={`Session ${student?.session || '-'}`}>
          <ProfileRow icon="♙" iconBackground="#e4f1ff" iconColor="#1884ef" label="Gender" value={student?.gender} />
          <ProfileRow icon="▣" iconBackground="#ffe6ed" iconColor="#ef4264" label="Date of Birth" value={formatDate(student?.dob)} />
          <ProfileRow icon="♜" iconBackground="#eee8ff" iconColor="#8057df" label="Religion" value={student?.religion} />
          <ProfileRow icon="◇" iconBackground="#ffe8ed" iconColor="#f15470" label="Blood Group" value={student?.blood_group} last />
        </ProfileSection>

        <ProfileSection title="Parent Details" icon="♟" iconColor="#0c9b43" iconBackground="#d9f9df">
          <ProfileRow icon="♙" iconBackground="#e4f1ff" iconColor="#1884ef" label="Father Name" value={student?.faname} />
          <ProfileRow icon="♙" iconBackground="#ffe6ed" iconColor="#ef4264" label="Mother Name" value={student?.mname} />
          <ProfileRow icon="●" iconBackground="#dff8e6" iconColor="#0b9d44" label="Father Mobile" value={student?.guardian_mob} />
          <ProfileRow icon="●" iconBackground="#ffe6ed" iconColor="#ef4264" label="Mother Mobile" value={student?.mother_mobile} />
          <ProfileRow icon="✉" iconBackground="#eee8ff" iconColor="#8057df" label="Email" value={student?.email} />
          <ProfileRow icon="₹" iconBackground="#fff0dc" iconColor="#ec8b12" label="Family Income" value={student?.father_income} last />
        </ProfileSection>

        <ProfileSection title="Address" icon="●" iconColor="#ed970b" iconBackground="#fff0bd" rightAction="View on Map" onRightPress={openMap}>
          <AddressCard icon="⌂" label="Present Address" value={presentAddress} />
          <AddressCard icon="▥" label="Permanent Address" value={permanentAddress} />
        </ProfileSection>
      </ScrollView>
      <View style={styles.bottomNav}><BottomNavigator /></View>
    </View>
  );
}

function ProfileSection({ title, icon, iconColor, iconBackground, rightLabel, rightAction, onRightPress, children }) {
  return <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Badge symbol={icon} color={iconColor} background={iconBackground} large />
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightLabel ? <View style={styles.sessionChip}><Text style={styles.sessionText}>▣  {rightLabel}</Text></View> : null}
      {rightAction ? <TouchableOpacity style={styles.mapChip} onPress={onRightPress}><Text style={styles.mapText}>●  {rightAction}</Text></TouchableOpacity> : null}
    </View>
    {children}
  </View>;
}

function ProfileRow({ icon, iconColor, iconBackground, label, value, last }) {
  return <View style={[styles.detailRow, !last && styles.divider]}>
    <Badge symbol={icon} color={iconColor} background={iconBackground} />
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || '-'}</Text>
  </View>;
}

function AddressCard({ icon, label, value }) {
  return <View style={styles.addressCard}>
    <View style={styles.addressIcon}><Text style={styles.addressSymbol}>{icon}</Text></View>
    <View style={styles.addressContent}><Text style={styles.addressLabel}>{label}</Text><Text style={styles.addressValue}>{value || '-'}</Text></View>
  </View>;
}

function Badge({ symbol, color, background, large }) {
  return <View style={[styles.badge, large && styles.largeBadge, { backgroundColor: background }]}><Text style={[styles.badgeSymbol, large && styles.largeBadgeSymbol, { color }]}>{symbol}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fbff' },
  content: { paddingBottom: 80 },
  hero: { height: 184, overflow: 'hidden', paddingHorizontal: 22, paddingTop: 38, position: 'relative' },
  heroCurve: { position: 'absolute', right: -48, top: -89, width: 288, height: 218, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.62)' },
  heroProfile: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  photoRing: { width: 87, height: 87, borderRadius: 44, backgroundColor: '#fff', padding: 4, overflow: 'hidden' },
  photo: { width: '100%', height: '100%', borderRadius: 40, resizeMode: 'cover' },
  heroInfo: { marginLeft: 14, flex: 1 },
  studentName: { color: '#10234f', fontSize: 19, fontWeight: '900', marginBottom: 5 },
  heroDetail: { color: '#39455c', fontSize: 11.5, lineHeight: 17, fontWeight: '500' },
  heroLogo: { position: 'absolute', width: 82, height: 82, right: 23, top: 53, resizeMode: 'contain' },
  section: { marginHorizontal: 12, marginTop: 12, padding: 13, borderRadius: 18, backgroundColor: '#fff', elevation: 3, shadowColor: '#1d314c', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  sectionHeader: { minHeight: 43, flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { marginLeft: 10, color: '#10234f', fontSize: 16, fontWeight: '900', flex: 1 },
  badge: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  largeBadge: { width: 43, height: 43, borderRadius: 13 },
  badgeSymbol: { fontSize: 17, fontWeight: '800' },
  largeBadgeSymbol: { fontSize: 23 },
  sessionChip: { borderRadius: 17, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fffaf0', borderWidth: 1, borderColor: '#ffe1a1' },
  sessionText: { color: '#18244b', fontSize: 10.5, fontWeight: '800' },
  mapChip: { borderRadius: 17, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fffaf0', borderWidth: 1, borderColor: '#ffe1a1' },
  mapText: { color: '#ed920b', fontSize: 10, fontWeight: '900' },
  detailRow: { minHeight: 41, alignItems: 'center', flexDirection: 'row', marginLeft: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#edf0f4' },
  rowLabel: { flex: 1, color: '#657086', fontSize: 12.5, marginLeft: 10 },
  rowValue: { color: '#111b3d', fontSize: 12.5, fontWeight: '800', maxWidth: '48%', textAlign: 'right' },
  addressCard: { minHeight: 79, borderWidth: 1, borderColor: '#e7eaf0', borderRadius: 13, padding: 10, flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  addressIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: '#f2f4f8', justifyContent: 'center', alignItems: 'center' },
  addressSymbol: { color: '#727c91', fontSize: 24, fontWeight: '700' },
  addressContent: { flex: 1, marginLeft: 11 },
  addressLabel: { color: '#657086', fontSize: 10.5, marginBottom: 3 },
  addressValue: { color: '#131c3f', fontSize: 11.5, lineHeight: 15, fontWeight: '800' },
  bottomNav: { position: 'absolute', left: 7, right: 7, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', elevation: 12, shadowColor: '#1d314c', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: -3 } },
});
