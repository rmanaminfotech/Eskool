import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { BottomNavigator } from '../navigation/BottomNavigator';
import { useEffect, } from 'react';
import { useNavigation } from '@react-navigation/native';
import CommonHeader from '../components/CommonHeader';
import { colors } from '../utils/colors';
import { fetchStudentProfileDetail } from '../services/studentApi';
import FullScreenLoader from '../components/FullScreenLoader';
const FAQ_DATA = [
  {
    category: 'Admission',
    questions: [
      {
        q: 'How can I apply for admission?',
        a: 'Go to Admission section and fill the online application form.',
      },
      {
        q: 'What documents are required?',
        a: 'Birth certificate, previous marksheet and passport size photo.',
      },
    ],
  },
  {
    category: 'Attendance',
    questions: [
      {
        q: 'How do I mark attendance?',
        a: 'Open Attendance tab and tap Punch In / Punch Out.',
      },
      {
        q: 'Can I edit attendance?',
        a: 'No, only school admin can modify attendance.',
      },
    ],
  },
  {
    category: 'Fees',
    questions: [
      {
        q: 'Where can I see fee details?',
        a: 'Open Fee section from sidebar.',
      },
      {
        q: 'Can I pay fees online?',
        a: 'Yes, online payment is available inside Fee section.',
      },
    ],
  },
];

const Faq = () => {
  const navigation = useNavigation();
const [student, setStudent] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);
  const [loading, setLoading] = useState(false);

useEffect(() => {
  fetchProfile();
}, []);

const fetchProfile = async () => {
  try {
    setLoading(true);

    const startTime = Date.now();

    const profileData = await fetchStudentProfileDetail();
    if (profileData) {
      setStudent(profileData);
    }

    const elapsed = Date.now() - startTime;
    const remainingTime = 1000 - elapsed;

    if (remainingTime > 0) {
      await new Promise(resolve => {
        setTimeout(() => resolve(), remainingTime);
      });
    }

  } catch (error) {
    console.log('Profile API Error:', error);
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
 {/* <View style={styles.titleContainer}>
      <Text style={styles.screenTitle}>FAQ's</Text>
    </View> */}

      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {FAQ_DATA.map((cat, catIndex) => (
          <View key={catIndex}>

            {/* CATEGORY TITLE */}
            <Text style={styles.categoryTitle}>{cat.category}</Text>

            {cat.questions.map((item, qIndex) => {
              const key = `${catIndex}-${qIndex}`;

              return (
                <TouchableOpacity
                  key={key}
                  style={styles.questionCard}
                  onPress={() =>
                    setOpenQuestion(openQuestion === key ? null : key)
                  }
                >
                  <View style={styles.row}>
                    <Text style={styles.question}>{item.q}</Text>
                    <Text style={styles.qArrow}>
                      {openQuestion === key ? '−' : '+'}
                    </Text>
                  </View>

                  {openQuestion === key && (
                    <Text style={styles.answer}>{item.a}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

<TouchableOpacity onPress={() => navigation.navigate('Contactus')}>
<Text style={styles.footer}>
  Need help?{' '}
  <Text
    style={styles.contactBtn}
    onPress={() => navigation.navigate('Contactus')}
  >
    Contact school admin
  </Text>
</Text>
</TouchableOpacity>
      </ScrollView>
        <View style={styles.bottomNavWrapper}>
        <BottomNavigator />
      </View>
</>
    </View>
  );
};

export default Faq;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundcolor,
  },

  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.orange,
    marginBottom: 8,
    marginTop: 16,
  },

  questionCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  question: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray2,
    width: '90%',
  },

  qArrow: {
    fontSize: 18,
    color: colors.icon,
  },

  answer: {
    marginTop: 6,
    color: colors.gray2,
    lineHeight: 18,
  },

  footer: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.placeholder,
    fontSize: 12,
  },
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
loaderContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
contactBtn: {
  color: colors.orange,
  fontWeight: '600',
},
});
