import { StyleSheet, Text, View, TouchableOpacity, Linking, ScrollView, ActivityIndicator } from 'react-native' 
import React, { useEffect, useState } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import CommonHeader from '../components/CommonHeader'
import { BottomNavigator } from '../navigation/BottomNavigator'
import { useNavigation } from '@react-navigation/native'
import { fetchStudentProfileDetail, studentApi } from '../services/studentApi'
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../utils/colors'
import FullScreenLoader from '../components/FullScreenLoader'
const Contactus = () => {

  const navigation = useNavigation();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schoolData, setSchoolData] = useState(null); // ✅ added

  useEffect(() => {
    fetchStudentProfile();
    fetchSchoolDetails(); // ✅ added
  }, []);

  const fetchSchoolDetails = async () => {
    try {
      const res = await studentApi.get('master.php');

      if (res?.data?.length > 0) {
        setSchoolData(res.data[0]); // ✅ store first object
      }
    } catch (error) {
      console.log("School API Error:", error);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const data = await fetchStudentProfileDetail();
      if (data) {
        setStudent(data);
      }
    } catch (error) {
      console.log("Contact Screen Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (number) => {
    if (number) Linking.openURL(`tel:${number}`)
  }

  const handleEmail = () => {
    if (schoolData?.emaila) {
      Linking.openURL(`mailto:${schoolData.emaila}`)
    }
  }

  const handleWebsite = () => {
    if (schoolData?.website) {
      const url = schoolData.website.startsWith("http")
        ? schoolData.website
        : `https://${schoolData.website}`;
      Linking.openURL(url);
    }
  }

  const handleMap = () => {
    if (schoolData?.company) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${schoolData.company}`
      )
    }
  }

  return (
<View style={styles.container}>
 <FullScreenLoader visible={loading} />

    <>
      <CommonHeader
        student={student}
        navigation={navigation}
        showNotification={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {schoolData ? (
          <>
            {/* 🔥 TOP CARD */}
            <LinearGradient
              colors={['#FF9800', '#FFC107', '#FFEB3B']}
              style={styles.topCard}
            >
              <Icon name="school-outline" size={40} color={colors.white} />

              <Text style={styles.schoolName}>
                {schoolData.company}
              </Text>

              <Text style={styles.address}>
                {schoolData.address}, {schoolData.city}
              </Text>

              <Text style={styles.address}>
                {schoolData.state} - {schoolData.pin}
              </Text>
            </LinearGradient>

            {/* 📞 CONTACT CARD */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Contact</Text>

              {schoolData.phonea && (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => handleCall(schoolData.phonea)}
                >
                  <Icon name="call-outline" size={20} color={colors.blue} />
                  <Text style={styles.rowText}>{schoolData.phonea}</Text>
                </TouchableOpacity>
              )}

              {schoolData.phoneb && (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => handleCall(schoolData.phoneb)}
                >
                  <Icon name="call-outline" size={20} color={colors.blue} />
                  <Text style={styles.rowText}>{schoolData.phoneb}</Text>
                </TouchableOpacity>
              )}

              {schoolData.whatsapp && (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => Linking.openURL(`https://wa.me/${schoolData.whatsapp}`)}
                >
                  <Icon name="logo-whatsapp" size={20} color={colors.green} />
                  <Text style={styles.rowText}>{schoolData.whatsapp}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 📧 EMAIL CARD */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Email</Text>

              {schoolData.emaila && (
                <TouchableOpacity style={styles.row} onPress={handleEmail}>
                  <Icon name="mail-outline" size={20} color={colors.red} />
                  <Text style={styles.rowText}>{schoolData.emaila}</Text>
                </TouchableOpacity>
              )}

              {schoolData.emailb && (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => Linking.openURL(`mailto:${schoolData.emailb}`)}
                >
                  <Icon name="mail-outline" size={20} color={colors.red} />
                  <Text style={styles.rowText}>{schoolData.emailb}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 🌐 WEBSITE */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Website</Text>

              {schoolData.website && (
                <TouchableOpacity style={styles.row} onPress={handleWebsite}>
                  <Icon name="globe-outline" size={20} color="#8E44AD" />
                  <Text style={styles.rowText}>{schoolData.website}</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>No contact data found</Text>
        )}
      </ScrollView>

      <View style={styles.bottomNavWrapper}>
        <BottomNavigator />
      </View>
    </>
</View>
  )
}

export default Contactus

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundcolor,
  },

  content: {
    padding: 16,
    paddingBottom: 100,
  },

  topCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },

  schoolName: {
    color: colors.gray2,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },

  address: {
    color: colors.gray2,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },

  /* 📦 CARD */
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    color: colors.black,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderColor: colors.border,
  },

  rowText: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.gray2,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: colors.placeholder,
  },

  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});