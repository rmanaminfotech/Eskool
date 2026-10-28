import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { studentApi, fetchStudentProfileDetail } from '../services/studentApi';
import CommonHeader from '../components/CommonHeader';
import FullScreenLoader from '../components/FullScreenLoader';
import { BottomNavigator } from '../navigation/BottomNavigator';
import { colors } from '../utils/colors';

const { width } = Dimensions.get('window');
const H_PADDING = 16;
const CELL_SIZE = (width - H_PADDING * 2) / 7;

const academicMonths = [
  { label: 'Apr', value: '04', full: 'April' },
  { label: 'May', value: '05', full: 'May' },
  { label: 'Jun', value: '06', full: 'June' },
  { label: 'Jul', value: '07', full: 'July' },
  { label: 'Aug', value: '08', full: 'August' },
  { label: 'Sep', value: '09', full: 'September' },
  { label: 'Oct', value: '10', full: 'October' },
  { label: 'Nov', value: '11', full: 'November' },
  { label: 'Dec', value: '12', full: 'December' },
  { label: 'Jan', value: '01', full: 'January' },
  { label: 'Feb', value: '02', full: 'February' },
  { label: 'Mar', value: '03', full: 'March' },
];

const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const eventColors = ['#22C55E', '#2488FF', '#8B5CF6', '#F59E0B'];

const getHolidayDate = item => {
  return item?.holiday_date || item?.holiday_from_date || '';
};

const getHolidayToDate = item => {
  return item?.holiday_to_date || item?.holiday_date || item?.holiday_from_date || '';
};

const getMonthFromDate = date => {
  return date?.slice(5, 7);
};

const getYearFromDate = date => {
  return Number(date?.slice(0, 4)) || new Date().getFullYear();
};

const formatDate = date => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatLongDate = date => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getDateKey = date => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
};

const isDateBetween = (date, from, to) => {
  if (!date || !from) return false;

  const current = new Date(date).setHours(0, 0, 0, 0);
  const start = new Date(from).setHours(0, 0, 0, 0);
  const end = new Date(to || from).setHours(0, 0, 0, 0);

  return current >= start && current <= end;
};

const AcademicsCalender = () => {
  const navigation = useNavigation();

  const [student, setStudent] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('04');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeView, setActiveView] = useState('calendar');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const profileData = await fetchStudentProfileDetail();
      if (profileData) {
        setStudent(profileData);
      }

      const response = await studentApi.post('holiday_list.php', {});

      if (Array.isArray(response?.data)) {
        setHolidays(response.data);

        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        const hasCurrentMonth = response.data.some(
          item => getMonthFromDate(getHolidayDate(item)) === currentMonth,
        );

        if (hasCurrentMonth) {
          setSelectedMonth(currentMonth);
          setSelectedYear(new Date().getFullYear());
        } else {
          const firstDate = getHolidayDate(response.data?.[0]);
          setSelectedMonth(getMonthFromDate(firstDate) || '04');
          setSelectedYear(getYearFromDate(firstDate));
        }
      } else {
        setHolidays([]);
      }
    } catch (error) {
      console.log('Academic Calendar Error:', error);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedMonthData = useMemo(() => {
    return academicMonths.find(item => item.value === selectedMonth);
  }, [selectedMonth]);

  const filteredHolidays = useMemo(() => {
    return holidays.filter(
      item =>
        getMonthFromDate(getHolidayDate(item)) === selectedMonth &&
        getYearFromDate(getHolidayDate(item)) === selectedYear,
    );
  }, [holidays, selectedMonth, selectedYear]);

  const calendarDays = useMemo(() => {
    const monthIndex = Number(selectedMonth) - 1;
    const firstDate = new Date(selectedYear, monthIndex, 1);
    const lastDate = new Date(selectedYear, monthIndex + 1, 0);
    const prevMonthLastDate = new Date(selectedYear, monthIndex, 0).getDate();

    const days = [];

    for (let i = firstDate.getDay() - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDate - i,
        currentMonth: false,
      });
    }

    for (let i = 1; i <= lastDate.getDate(); i++) {
      const fullDate = `${selectedYear}-${selectedMonth}-${String(i).padStart(2, '0')}`;
      const matchedHolidays = filteredHolidays.filter(item =>
        isDateBetween(fullDate, getHolidayDate(item), getHolidayToDate(item)),
      );

      days.push({
        day: i,
        currentMonth: true,
        fullDate,
        holidays: matchedHolidays,
      });
    }

    let nextDay = 1;
    while (days.length % 7 !== 0) {
      days.push({
        day: nextDay,
        currentMonth: false,
      });
      nextDay += 1;
    }

    return days;
  }, [selectedMonth, selectedYear, filteredHolidays]);

const changeMonth = direction => {
  const monthNumber = Number(selectedMonth);

  if (direction === 'prev') {
    if (monthNumber === 1) {
      setSelectedMonth('12');
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(String(monthNumber - 1).padStart(2, '0'));
    }
  } else {
    if (monthNumber === 12) {
      setSelectedMonth('01');
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(String(monthNumber + 1).padStart(2, '0'));
    }
  }
};

 const renderHolidayList = (data = holidays) => {
  const listData = data;

if (listData.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Icon name="calendar-clear-outline" size={30} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Holiday</Text>
          <Text style={styles.emptyText}>
There are no academic holidays available.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.eventListCard}>
{listData
  .sort(
    (a, b) =>
      new Date(getHolidayDate(a)) -
      new Date(getHolidayDate(b))
  )
  .map((item, index) => {
              const fromDate = getHolidayDate(item);
          const toDate = getHolidayToDate(item);
          const isSingleDay = fromDate === toDate || Number(item?.holiday_days || 1) === 1;
          const dotColor = eventColors[index % eventColors.length];

          return (
            <View
              key={item?.ah_id || `${fromDate}-${index}`}
              style={[
                styles.eventRow,
index !== listData.length - 1 && styles.eventDivider,
              ]}
            >
              <View style={[styles.eventIconBox, { backgroundColor: `${dotColor}18` }]} />

              <View style={styles.eventContent}>
                <View style={styles.eventTitleRow}>
                  <View style={[styles.eventDot, { backgroundColor: dotColor }]} />
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {item?.occasion || 'Holiday'}
                  </Text>
                </View>

                <Text style={styles.eventDate}>
                  {isSingleDay
                    ? formatLongDate(fromDate)
                    : `${formatDate(fromDate)} - ${formatDate(toDate)}`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

const renderCalendarView = () => {
  return (
    <>
      <View style={styles.weekRow}>
        {weekDays.map(day => (
          <Text key={day} style={styles.weekText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {calendarDays.map((item, index) => {
          const dayHolidays = item?.holidays || [];
          const hasHoliday = dayHolidays.length > 0;

          const bgColor =
            hasHoliday && dayHolidays.length === 1
              ? `${eventColors[
                  filteredHolidays.findIndex(
                    h => h?.ah_id === dayHolidays[0]?.ah_id,
                  ) % eventColors.length
                ]}14`
              : hasHoliday
              ? '#F8FAFC'
              : 'transparent';

          return (
            <View key={`${item.day}-${index}`} style={styles.dayCell}>
              <View
                style={[
                  styles.dayBox,
                  hasHoliday && { backgroundColor: bgColor },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    !item.currentMonth && styles.disabledDay,
                  ]}
                >
                  {item.day}
                </Text>

                {hasHoliday && (
                  <View style={styles.multiDotRow}>
                    {dayHolidays.slice(0, 3).map((holidayItem, hIndex) => {
                      const actualIndex = filteredHolidays.findIndex(
                        h => h?.ah_id === holidayItem?.ah_id,
                      );

                      const dotColor =
                        eventColors[
                          (actualIndex >= 0 ? actualIndex : hIndex) %
                            eventColors.length
                        ];

                      return (
                        <View
                          key={`${holidayItem?.ah_id}-${hIndex}`}
                          style={[
                            styles.dayDot,
                            {
                              backgroundColor: dotColor,
                              marginTop: 0,
                              marginHorizontal: 1.5,
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

{renderHolidayList(filteredHolidays)}
    </>
  );
};

  return (
    <View style={styles.container}>
      <FullScreenLoader visible={loading} />

      <CommonHeader
        student={student}
        navigation={navigation}
        showNotification={true}
      />

      <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>Academics Calendar</Text>
        <Text style={styles.screenSubTitle}>
          Session {holidays?.[0]?.session_name || student?.session || '2026-27'}
        </Text>
      </View>

      <View style={styles.switchWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveView('calendar')}
          style={[
            styles.switchTab,
            activeView === 'calendar' && styles.activeSwitchTab,
          ]}
        >
          <Icon
            name="calendar-outline"
            size={17}
            color={activeView === 'calendar' ? colors.white : '#64748B'}
          />
          <Text
            style={[
              styles.switchText,
              activeView === 'calendar' && styles.activeSwitchText,
            ]}
          >
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveView('list')}
          style={[
            styles.switchTab,
            activeView === 'list' && styles.activeSwitchTab,
          ]}
        >
          <Icon
            name="list-outline"
            size={18}
            color={activeView === 'list' ? colors.white : '#64748B'}
          />
          <Text
            style={[
              styles.switchText,
              activeView === 'list' && styles.activeSwitchText,
            ]}
          >
            List
          </Text>
        </TouchableOpacity>
      </View>

  

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
{activeView === 'calendar' && (
  <View style={styles.monthHeader}>
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => changeMonth('prev')}
    >
      <Icon
        name="chevron-back-outline"
        size={25}
        color={colors.black}
      />
    </TouchableOpacity>

    <View style={styles.monthTitleBox}>
      <Text style={styles.monthTitle}>
        {selectedMonthData?.full} {selectedYear}
      </Text>

      <Text style={styles.monthSubtitle}>
        {filteredHolidays.length > 0
          ? `${filteredHolidays.length} holiday${
              filteredHolidays.length > 1 ? 's' : ''
            }`
          : 'No holiday'}
      </Text>
    </View>

    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => changeMonth('next')}
    >
      <Icon
        name="chevron-forward-outline"
        size={25}
        color={colors.black}
      />
    </TouchableOpacity>
  </View>
)}

{activeView === 'calendar'
  ? renderCalendarView()
  : renderHolidayList()}
        </ScrollView>

      <View style={styles.bottomNavWrapper}>
        <BottomNavigator />
      </View>
    </View>
  );
};

export default AcademicsCalender;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundcolor,
  },
  titleContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.black,
  },
  screenSubTitle: {
    fontSize: 10,
    color: colors.gray2,
    marginTop: 1,
    fontWeight: '600',
  },
  switchWrapper: {
    marginHorizontal: 16,
    marginTop: 10,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    padding: 3,
  },
  switchTab: {
    flex: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeSwitchTab: {
    backgroundColor: colors.orange,
    elevation: 1,
  },
  switchText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  activeSwitchText: {
    color: colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 115,
  },
  monthHeader: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  monthTitleBox: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.black,
  },
  monthSubtitle: {
    fontSize: 9,
    color: colors.gray2,
    marginTop: 1,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  weekText: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '900',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  dayCell: {
    width: CELL_SIZE,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBox: {
    width: CELL_SIZE - 9,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.black,
  },
  disabledDay: {
    color: '#CBD5E1',
  },
  dayDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 4.5,
    marginTop: 3,
  },
  multiDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  eventListCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    overflow: 'hidden',
    elevation: 1,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  eventDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  eventIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    marginRight: 10,
  },
  eventContent: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 7,
  },
  eventTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    color: colors.black,
    lineHeight: 17,
  },
  eventDate: {
    marginTop: 3,
    marginLeft: 14,
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginTop: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  emptyTitle: {
    marginTop: 7,
    fontSize: 13,
    fontWeight: '900',
    color: colors.black,
  },
  emptyText: {
    marginTop: 3,
    fontSize: 11,
    color: colors.gray2,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});