import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { BottomNavigator } from '../navigation/BottomNavigator';
import CommonHeader from '../components/CommonHeader';
import { getAuthContext } from '../services/appStorage';
import { fetchStudentProfileDetail, studentApi } from '../services/studentApi';
import { icons } from '../utils/icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';
import FullScreenLoader from '../components/FullScreenLoader';
const Homework = () => {
  const scrollRef = useRef(null);
  const navigation = useNavigation();
  const [student, setStudent] = useState(null);
  const [homework, setHomework] = useState([]); 
  const [loading, setLoading] = useState(true);
const [expandedItems, setExpandedItems] = useState({});
const [selectedDate, setSelectedDate] = useState('');
const [dateList, setDateList] = useState([]);
const [showPicker, setShowPicker] = useState(false);
const [pickerDate, setPickerDate] = useState(new Date());
useEffect(() => {
  fetchStudentProfile();
  fetchHomework();
  generateDates();
}, []);

const generateDates = () => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    const fullDate = d.toISOString().split('T')[0];

    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'short' });

    dates.push({ fullDate, day, month });
  }

  const orderedDates = dates.reverse();

  setDateList(orderedDates);

  const todayFormatted = today.toISOString().split('T')[0];
  setSelectedDate(todayFormatted);
};

const onDateChange = (event, selected) => {
  setShowPicker(false);

  if (event.type === 'dismissed') {
    return; 
  }

  if (selected) {
    setPickerDate(selected);

    const formatted = selected.toISOString().split('T')[0];
    setSelectedDate(formatted);
  }
};

  const fetchStudentProfile = async () => {
    try {
      const data = await fetchStudentProfileDetail();
      if (data) {
        setStudent(data);
      }
    } catch (error) {
      console.log("Homework Screen Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHomework = async () => {
    try {
      const { jwt, studentId } = await getAuthContext();
      if (!studentId || !jwt) return;

      const response = await studentApi.post('homework.php', {
        studentid: studentId,
      });

      if (response?.data?.status === true) {
        setHomework(response.data.homework || []);
      }

    } catch (error) {
      console.log("Homework API Error:", error);
    }
  };
const toggleExpand = (index) => {
  setExpandedItems(prev => ({
    ...prev,
    [index]: !prev[index],
  }));
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

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          >

<View style={styles.titleRow}>
  {/* <Image source={icons.Homework} style={styles.titleIcon} /> */}
  <Text style={styles.screenTitle}>Daily Homework</Text>
</View>
<View style={styles.dateRow}>

  {/* Calendar Icon (fixed) */}
  <TouchableOpacity
    style={styles.calendarBtn}
    onPress={() => setShowPicker(true)}
  >
<Icon name="calendar-outline" size={18} color={colors.orange} />
  </TouchableOpacity>

  {/* Date Scroll */}
<ScrollView
  ref={scrollRef}
  horizontal
  showsHorizontalScrollIndicator={false}
  style={styles.dateScroll}
  onContentSizeChange={() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }}
>
  {dateList.map((item, index) => {
    const isActive = selectedDate === item.fullDate;

    return (
      <TouchableOpacity
        key={index}
        style={[styles.dateItem, isActive && styles.activeDateItem]}
        onPress={() => setSelectedDate(item.fullDate)}
        activeOpacity={0.7} // nice touch feedback
      >
        <Text style={[styles.dateDay, isActive && styles.activeDateText]}>
          {item.day}
        </Text>

        <Text style={[styles.dateMonth, isActive && styles.activeDateText]}>
          {item.month}
        </Text>
      </TouchableOpacity>
    );
  })}
</ScrollView>

</View>
            <View style={styles.homeworkList}>

             {
  homework.filter(item => item.hw_date === selectedDate).length > 0 ? (
    homework
      .filter(item => item.hw_date === selectedDate)
      .map((item, index) => (

    <View key={index} style={styles.hwCard}>

      {/* Top Row */}
      <View style={styles.topRow}>
        <View style={styles.subjectBadge}>
          <Text style={styles.subjectText}>
            {item.subject_name}
          </Text>
        </View>

      
      </View>

      <View style={styles.teacherBox}>
        {item.teacher_name ? (
          <Text style={styles.teacherText}>
            Teacher: {item.teacher_name}
          </Text>
        ) : null}

       
      </View>

      <View style={styles.divider} />

     <Text
  style={styles.hwDesc}
  numberOfLines={expandedItems[index] ? undefined : 2}
>
  {item.hw_detail}
</Text>

{item.hw_detail ? (
  <Text
    style={styles.toggleText}
    onPress={() => toggleExpand(index)}
  >
    {expandedItems[index] ? 'See Less' : 'See More'}
  </Text>
) : null}

    </View>
  ))
) : (
  <View style={styles.emptyBox}>
    <Text style={styles.emptyText}>
      No Homework Available
    </Text>
  </View>
)}

            </View>

          </ScrollView>
{showPicker && (
  <DateTimePicker
    value={pickerDate}
    mode="date"
    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    onChange={onDateChange}
    maximumDate={new Date()}
  />
)}
          <View style={styles.bottomNavWrapper}>
            <BottomNavigator />
          </View>
        </>
      
    </View>
  );
};

export default Homework;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundcolor,
  },

  content: {
    flex: 1,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  homeworkList: {
    width: '100%',
    paddingHorizontal: 15,
  },

  hwCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  subjectBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  subjectText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.orange,
  },

  teacherBox: {
    marginTop: 10,
  },

  teacherText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
  },

  divider: {
    height: 1,
    backgroundColor: colors.gray,
    marginVertical: 10,
  },

  hwDesc: {
    fontSize: 13.5,
    color: colors.gray2,
    lineHeight: 20,
  },

  emptyBox: {
    marginTop: 40,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: colors.placeholder,
  },
  toggleText: {
  marginTop: 6,
  fontSize: 12,
  fontWeight: '700',
  color: colors.orange,
},
titleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 15,
  marginBottom: 15,
  marginTop:10
  
},

screenTitle: {
  fontSize: 18,
  fontWeight: '800',
  color: colors.gray2,
  
},

dateItem: {
  width: 38,
  height: 30,
  borderRadius: 10,
  backgroundColor: colors.white,
  marginRight: 10,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 2,
},

activeDateItem: {
  backgroundColor: colors.orange,
},

dateDay: {
  fontSize: 16,
  fontWeight: 'bold',
  color: colors.black,
},

dateMonth: {
  fontSize: 7,
  color: colors.gray2,
  bottom:3
},

activeDateText: {
  color: colors.white,
},
dateRow: {
  flexDirection: 'row',
  alignItems: 'center', 
  paddingHorizontal: 15, 
  marginBottom:10
},

calendarBtn: {
  width: 30,              
  height: 30,             
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: colors.white,
  borderRadius: 10,
  elevation: 2,
  marginRight: 10,
},

dateScroll: {
  flex: 1,                
},

});