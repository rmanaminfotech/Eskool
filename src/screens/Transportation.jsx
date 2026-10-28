import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigator } from '../navigation/BottomNavigator';
import CommonHeader from '../components/CommonHeader';
import { Linking } from 'react-native';
import { colors } from '../utils/colors';
import { getAuthContext } from '../services/appStorage';
import { studentApi } from '../services/studentApi';
import FullScreenLoader from '../components/FullScreenLoader';
const Transportation = () => {
  const navigation = useNavigation();
  const [transportData, setTransportData] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [masterData, setMasterData] = useState(null);
  useEffect(() => {
    fetchTransportDetails();
  }, []);

  const fetchTransportDetails = async () => {
    try {
      setLoading(true);
      const { jwt, studentId } = await getAuthContext();
      if (!jwt || !studentId) {
        setLoading(false);
        return;
      }

      if (__DEV__) {
        console.log('[Transportation] student JWT:', jwt);
        console.log('[Transportation] studentId:', studentId);
      }

      const masterRes = await studentApi.get('master.php');
      if (masterRes?.data?.length > 0) {
        setMasterData(masterRes.data[0]);
      }

      const profileRes = await studentApi.post('profile_detail.php', {
        studentid: studentId,
      });

      if (profileRes?.data?.status === true) {
        setStudent(profileRes.data.data);
      }

      const response = await studentApi.post('transport_details.php', {
        studentid: studentId,
      });

      if (__DEV__) {
        console.log(
          '[Transportation] transport_details.php response:',
          response?.data,
        );
      }

if (
  response?.data?.status === true &&
  response?.data?.data?.length > 0
) {
  const transport = response.data.data[0];

  // 🔥 MAIN FIX: check status from API
  if (transport?.status === '0') {
    setTransportData(null); // treat as NOT ALLOTTED
  } else {
    setTransportData(transport);
  }
} else {
  setTransportData(null);
}
    } catch (error) {
      console.log('Transport API Error:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCall = number => {
    if (!number) return;
    Linking.openURL(`tel:${number}`);
  };
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  // If already in DD-MM-YYYY, return directly
  if (dateString.includes('-') && dateString.split('-')[0].length === 2) {
    return dateString;
  }

  // fallback (if API ever sends proper ISO format)
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

return (
  <View style={{ flex: 1, backgroundColor: colors.backgroundcolor }}>
    <FullScreenLoader visible={loading} />

    <>
      <CommonHeader
        student={student}
        navigation={navigation}
        showNotification={true}
      />

      {!transportData ? (
        <View style={styles.noTransportContainer}>
          <Icon name="bus-outline" size={60} color={colors.gray2} />
          <Text style={styles.noTransportText}>
            Transportation has not been allotted
          </Text>
        </View>
      ) : (
        <>
          {/* Title Like Tuition */}
          <View style={styles.titleContainer}>
            <Text style={styles.screenTitle}>Transportation Details</Text>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 88 }}
          >
            {/* Driver & Conductor */}
            <View style={styles.card}>
              <View style={styles.staffRow}>
                <View style={styles.staffBlock}>
                  <Text style={styles.staffLabel}>Driver</Text>
                  <Text style={styles.staffName}>
                    {transportData?.driver || 'N/A'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleCall(transportData?.driver_phone)}
                >
                  <Icon name="call" size={18} color={colors.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.staffRow}>
                <View style={styles.staffBlock}>
                  <Text style={styles.staffLabel}>Conductor</Text>
                  <Text style={styles.staffName}>
                    {transportData?.conductor || 'N/A'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: colors.green}]}
                  onPress={() => handleCall(transportData?.conductor_phone)}
                >
                  <Icon name="call" size={18} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              {!showHistory ? (
                <>
                 <View style={styles.vanRow}>
  <View>
    <Text style={styles.detailLabel}>Van Number</Text>
    <Text style={styles.detailValue}>
      {transportData?.vehicle_no
        ? `${transportData.vehicle_no} (${transportData.vehicle_reg_no || ''})`
        : ''}
    </Text>
  </View>

  <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
    <Text style={styles.issueText}>
      {showHistory ? 'Transport Details' : 'Transport History'}
    </Text>
  </TouchableOpacity>
</View>

                  <DetailRow
                    label="Route Name"
                    value={transportData?.route || 'N/A'}
                  />
                  <DetailRow
                    label="Pickup Point"
                    value={transportData?.at_pickup_point || 'N/A'}
                  />
                  <DetailRow
                    label="Pickup Time"
                    value={transportData?.at_pickup_time || 'N/A'}
                  />
                  <DetailRow
                    label="Drop Time"
                    value={transportData?.at_drop_time || 'N/A'}
                  />
                </>
              ) : (
                <>
                  <View style={styles.vanRow}>
                    <Text style={styles.detailLabel}>
                      Transport Status History
                    </Text>

                    <TouchableOpacity onPress={() => setShowHistory(false)}>
                      <Text style={styles.issueText}>Transport Details</Text>
                    </TouchableOpacity>
                  </View>

                  {transportData?.transport_status_history?.length > 0 ? (
                    transportData.transport_status_history.map(
                      (item, index) => (
                        <View key={index} style={styles.historyCard}>
                          <DetailRow
                            label="Status"
                            value={
                              item?.ats_status === '1'
                                ? 'Active'
                                : item?.ats_status === '0'
                                ? 'Deactive'
                                : 'N/A'
                            }
                          />
                          <DetailRow
                            label="Assign"
                            value={item?.ats_date || 'N/A'}
                          />
                        </View>
                      ),
                    )
                  ) : (
                    <Text style={{ color: colors.gray2 }}>No History Found</Text>
                  )}
                </>
              )}
            </View>

            {/* Emergency Section */}
            <View style={styles.card}>
              <Text style={styles.emergencyTitle}>Emergency Contact</Text>
              <TouchableOpacity
                style={styles.emergencyRow}
                onPress={() => handleCall(masterData?.phonea)}
              >
                <Text style={styles.emergencyLabel}>School Office: </Text>
                <Text style={styles.emergencyNumber}>
                  +91 {masterData?.phonea || 'N/A'}
                </Text>
              </TouchableOpacity>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.callButtonHalf}
                  onPress={() => handleCall(transportData?.driver_phone)}
                >
                  <Text style={styles.callButtonText}>Call Driver</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.trackButtonHalf}>
                  <Text style={styles.trackButtonText}>Track Vehicle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </>
      )}
    </>

    <View style={styles.bottomNavWrapper}>
      <BottomNavigator />
    </View>
  </View>
);
};

/* Reusable Detail Row */
const DetailRow = ({ label, value }) => {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
};

export default Transportation;

const styles = StyleSheet.create({

  content: {
    padding: 16,
    marginTop: 10,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffBlock: {
    flex: 1,
  },
  staffLabel: {
    fontSize: 13,
    color: colors.gray2,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginTop: 2,
  },
  iconButton: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray,
    marginVertical: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  detailRow: {
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.gray2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.black,
    marginTop: 2,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.red,
    marginBottom: 6,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  callButtonHalf: {
    flex: 1,
    backgroundColor: colors.orange,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  trackButtonHalf: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  callButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  trackButtonText: {
    color: colors.orange,
    fontWeight: '600',
    fontSize: 14,
  },
  vanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  issueText: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: '600',
  },
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  historyCard: {
    backgroundColor: colors.backgroundcolor,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emergencyLabel: {
    fontSize: 14,
    color: colors.gray2,
  },

  emergencyNumber: {
    fontSize: 14,
    color: colors.orange,
    fontWeight: '600',
  },
noTransportContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
},

noTransportText: {
  marginTop: 12,
  fontSize: 16,
  fontWeight: '600',
  color: colors.gray2,
  textAlign: 'center',
},
});
