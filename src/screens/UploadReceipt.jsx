import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, ActivityIndicator, Modal } from 'react-native'
import React, { useState, useEffect } from 'react'
import { launchImageLibrary } from 'react-native-image-picker'
import CommonHeader from '../components/CommonHeader'
import { useNavigation } from '@react-navigation/native'
import { getJwt } from '../services/appStorage'
import { fetchStudentProfileDetail, studentApi } from '../services/studentApi'
import Icon from 'react-native-vector-icons/Ionicons'
import { BottomNavigator } from '../navigation/BottomNavigator'
import AppAlertModal from '../components/AppAlertModal' 
import { colors } from '../utils/colors'
import FullScreenLoader from '../components/FullScreenLoader'

const UploadReceipt = () => {
  const navigation = useNavigation();

  const [file, setFile] = useState(null)
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true)

  const [date, setDate] = useState(null)
  const [showPicker, setShowPicker] = useState(false)

  // 🔥 NEW: calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [alertData, setAlertData] = useState({
    visible: false,
    title: '',
    message: '',
  })

  const showAlert = (title, message) => {
    setAlertData({
      visible: true,
      title,
      message,
    })
  }

  const closeAlert = () => {
    setAlertData({ ...alertData, visible: false })
  }

  const formatDate = (d) => {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const data = await fetchStudentProfileDetail();
      if (data) {
        setStudent(data);
      }
    } catch (error) {
      console.log("Notice Screen Error:", error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  const handleUpload = async () => {
    const result = await launchImageLibrary({
      mediaType: 'mixed',
    })

    if (result.didCancel) return

    if (result.errorCode) {
      showAlert('Error', 'Something went wrong')
      return
    }

    const asset = result.assets[0]

    setFile({
      uri: asset.uri,
      name: asset.fileName || 'Selected File',
      type: asset.type,
      isImage: asset.type?.startsWith('image'),
    })
  }

  const handleDelete = () => {
    setFile(null)
  }

  const handleSubmit = async () => {
    if (!date) {
      showAlert('Missing Date', 'Please select date first')
      return
    }

    if (!file) {
      showAlert('Missing File', 'Please upload receipt first')
      return
    }

    try {
      const token = await getJwt();
      if (!token) {
        showAlert('Error', 'User not authenticated')
        return
      }

      const formData = new FormData();
      formData.append('amr_date', date.toISOString().split('T')[0]);
      formData.append('amr_image', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      });

      const response = await studentApi.post('upload_receipt.php', formData);

      if (response?.data?.status) {
  showAlert(
    'Receipt Uploaded',
    ('Check status within 24 hours') 
  );
} else {
        showAlert('Error', response.data.message || 'Upload failed');
      }

    } catch (error) {
      console.log('Upload Error:', error);
      showAlert('Error', 'Something went wrong while uploading')
    } finally {
      setFile(null);
      setDate(null);
    }
  }

  // 🔥 CUSTOM CALENDAR FUNCTIONS
  const getDaysInMonth = (month) => {
    const year = month.getFullYear()
    const m = month.getMonth()
    return new Date(year, m + 1, 0).getDate()
  }

  const getFirstDay = (month) => {
    return new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  }

  const today = new Date()

const renderCalendar = () => {
  const days = []
  const totalDays = getDaysInMonth(currentMonth)
  const firstDay = getFirstDay(currentMonth)

  const totalCells = 42 // 🔥 6 rows × 7 columns

  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - firstDay + 1

    const tempDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      dayNumber
    )

    const isCurrentMonth = dayNumber > 0 && dayNumber <= totalDays
    const isFuture = tempDate > today

    days.push(
      <TouchableOpacity
        key={i}
        style={[
          styles.dayBox,
          date &&
          tempDate.toDateString() === date.toDateString() &&
          styles.selectedDay
        ]}
        disabled={!isCurrentMonth || isFuture}
        onPress={() => {
          setDate(tempDate)
          setShowPicker(false)
        }}
      >
        <Text
          style={[
            styles.dayText,
            !isCurrentMonth && { color: '#ddd' },
            isFuture && { color: '#ccc' }
          ]}
        >
          {isCurrentMonth ? dayNumber : ''}
        </Text>
      </TouchableOpacity>
    )
  }

  return days
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

          <View style={styles.card}>

            {/* Date */}
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>

              <TouchableOpacity 
                style={styles.dateBox}
                onPress={() => {
  const todayDate = new Date();

  if (!date) {
    setDate(todayDate);
  }

  setCurrentMonth(date || todayDate);

  setShowPicker(true);
}}
              >
                <Icon name="calendar-outline" size={18} color={colors.orange} />
                <Text style={styles.dateText}>
                  {date ? formatDate(date) : 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 🔥 CUSTOM CALENDAR MODAL */}
            <Modal visible={showPicker} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.calendarContainer}>

                  {/* Header */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={() =>
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
                    }>
                      <Icon name="chevron-back" size={22} />
                    </TouchableOpacity>

                    <Text style={styles.monthText}>
                      {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Text>

                    <TouchableOpacity onPress={() =>
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
                    }>
                      <Icon name="chevron-forward" size={22} />
                    </TouchableOpacity>
                  </View>

<View style={styles.weekHeader}>
  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
    <Text key={d} style={styles.weekText}>{d}</Text>
  ))}
</View>
                  <View style={styles.daysContainer}>
                    {renderCalendar()}
                  </View>

                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.closeBtn}>Close</Text>
                  </TouchableOpacity>

                </View>
              </View>
            </Modal>

            {/* Upload */}
            <Text style={styles.uploadLabel}>Upload Receipt</Text>

            <TouchableOpacity style={styles.uploadBox} onPress={handleUpload}>
              <Text style={styles.uploadBoxText}>
                {file ? file.name : 'Tap to upload file / image'}
              </Text>
            </TouchableOpacity>

            {/* Preview */}
            {file && file.isImage && (
              <View style={styles.previewWrapper}>
                <Image source={{ uri: file.uri }} style={styles.preview} />

                <TouchableOpacity style={styles.deleteIcon} onPress={handleDelete}>
                  <Icon name="close-circle" size={26} color={colors.orange} />
                </TouchableOpacity>
              </View>
            )}

          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit Receipt</Text>
          </TouchableOpacity>

         

        </ScrollView>

        <View style={styles.bottomNavWrapper}>
          <BottomNavigator />
        </View>
      </>

      <AppAlertModal
        visible={alertData.visible}
        title={alertData.title}
        message={alertData.message}
        confirmText="OK"
        onConfirm={closeAlert}
      />

    </View>
  )
}

export default UploadReceipt

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundcolor,
  },

  content: {
    padding: 16,
    paddingBottom: 80,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    marginBottom: 20,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'center',
  },

  label: {
    fontSize: 14,
    color: colors.black,
    fontWeight: '700',
  },

  uploadLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    color: '#333',
  },

  uploadBox: {
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderStyle: 'dashed',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff8f0',
  },

  uploadBoxText: {
    fontSize: 13,
    color: colors.orange,
    fontWeight: '600',
  },

  previewWrapper: {
    marginTop: 15,
    position: 'relative',
  },

  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },

  deleteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
  },

  submitBtn: {
    backgroundColor: colors.orange,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },

  submitText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
  },

  note: {
    marginTop: 20,
    fontSize: 12,
    color: colors.placeholder,
    textAlign: 'center',
  },

  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },

  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 120,
    backgroundColor: colors.white,
  },

  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
  },
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center', // ✅ center horizontally
},

calendarContainer: {
  backgroundColor: 'white',
  borderRadius: 16,
  padding: 15,
  width: '90%',
  maxWidth: 350,
  height: 400, // ✅ fixed height
},

weekHeader: {
  flexDirection: 'row',
  marginBottom: 8,
  marginTop:15
},

weekText: {
  width: '14.28%',
  textAlign: 'center',
  fontWeight: '700',
  fontSize: 12,
  color: '#666',
},

daysContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
},

dayBox: {
  width: '14.28%',
  height: 40, // ✅ fixed height instead of aspectRatio
  alignItems: 'center',
  justifyContent: 'center',
},

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop:15
  },

  monthText: {
    fontWeight: '700',
    fontSize: 16,
  },

  dayText: {
    fontSize: 13,
  },

  selectedDay: {
    backgroundColor: colors.orange,
    borderRadius: 20,
  },

  closeBtn: {
    textAlign: 'center',
    marginTop: 10,
    color: colors.orange,
    fontWeight: '700',
  },

})