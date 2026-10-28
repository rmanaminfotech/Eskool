import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { BottomNavigator } from '../navigation/BottomNavigator';
import CommonHeader from '../components/CommonHeader';
import { getAuthContext } from '../services/appStorage';
import { studentApi } from '../services/studentApi';
import { shareReceiptPDF } from '../utils/shareReceiptPDF';
import { colors } from '../utils/colors';
import FullScreenLoader from '../components/FullScreenLoader';

export default function AdmissionFeeRecord({ navigation }) {
  const [student, setStudent] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMasterLedgerData();
  }, []);



  const fetchMasterLedgerData = async () => {
    try {
      const { jwt, studentId } = await getAuthContext();

      if (!studentId || !jwt) {
        setLoading(false);
        return;
      }

      const profileRes = await studentApi.post('profile_detail.php', {
        studentid: studentId,
      });

      if (profileRes?.data?.status === true) {
        setStudent(profileRes.data.data);
      }

      const response = await studentApi.post(
        'student_master_ledger.php',
        {
          studentid: studentId,
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      if (response?.data?.status === true) {
        setSummary(response.data.summary);

        const formattedLedger = Array.isArray(response.data.ledger)
          ? response.data.ledger.map((item) => {
              let status = 'DUE';

              if (item.entry_type === 'credit') {
                status = 'PAID';
              }

              return {
                ...item,
                status,
              };
            })
          : [];

        setLedgerData(formattedLedger);
      }
    } catch (error) {
      console.log('Master Ledger API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthlyDue = parseInt(summary?.monthly_due || 0);
  const admissionDue = parseInt(summary?.admission_due || 0);
  const posDue = parseInt(summary?.pos_due || 0);
  const totalDues = parseInt(summary?.total_due || 0);



  const showRow = value => {
    if (value === null || value === undefined) return false;
    if (value === '0' || value === 0) return false;
    if (value === '') return false;
    return true;
  };

  const getModuleBadgeStyle = module => {
    if (module === 'Admission') {
      return {
        badgeStyle: styles.admissionBadge,
        badgeTextStyle: styles.admissionBadgeText,
      };
    }

    if (module === 'POS') {
      return {
        badgeStyle: styles.posBadge,
        badgeTextStyle: styles.posBadgeText,
      };
    }

    return {
      badgeStyle: styles.monthlyBadge,
      badgeTextStyle: styles.monthlyBadgeText,
    };
  };

  const LedgerCard = ({ item }) => {
    const isPaid = item.entry_type === 'credit';
    const moduleStyle = getModuleBadgeStyle(item.module);

    const totalAmount = item.debit > 0 ? item.debit : 0;
    const paidAmount = item.credit > 0 ? item.credit : 0;
    const dueAmount = item.debit > 0 ? item.debit : 0;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.ledgerCard}
      >
        <View style={styles.ledgerTopRow}>
          <View style={styles.badgeTitleRow}>
            <View style={styles.badgeBillBox}>
              <View
                style={[
                  styles.badgeContainer,
                  moduleStyle.badgeStyle,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    moduleStyle.badgeTextStyle,
                  ]}
                >
                  {item.module}
                </Text>
              </View>

              <Text style={styles.billNoBelowBadge} numberOfLines={1}>
                {item.reference_no}
              </Text>
            </View>

            <View style={styles.ledgerTitleBox}>
             <Text style={styles.ledgerTitle}>
              {item.particular}
            </Text>
            </View>
          </View>
        </View>

        <View style={styles.ledgerDivider} />

        <View style={styles.amountGrid}>
          <View style={styles.amountBox}>
            <Text style={styles.dateAmountText}>
              {item.date || '-'}
            </Text>
          </View>

          <View style={styles.verticalLine} />

          <View style={styles.amountBox}>
            <Text style={styles.amountPaid}>
              {paidAmount > 0 ? `₹${paidAmount}` : '-'}
            </Text>

            {paidAmount > 0 && showRow(item.payment_mode) && (
              <Text style={styles.paymentModeText}>
                ({item.payment_mode})
              </Text>
            )}
          </View>

          <View style={styles.verticalLine} />

          <View style={styles.amountBox}>
            <Text style={styles.amountDue}>
              {dueAmount > 0 ? `₹${dueAmount}` : '-'}
            </Text>
          </View>

          <View style={styles.verticalLine} />

          <View style={styles.amountBox}>
            <Text style={styles.amountBalance}>
              {item.balance > 0 ? `₹${item.balance}` : '-'}
            </Text>
          </View>
        </View>


      </TouchableOpacity>
    );
  };

  const HeaderSection = () => (
    <>
      <View style={styles.summaryRow}>
        <SummaryBox
          icon="calendar-outline"
          label="Monthly Dues"
          value={`₹${monthlyDue}`}
          iconBg="#E8F9EC"
          iconColor="#159947"
          valueColor="#159947"
        />

        <SummaryBox
          icon="shield-checkmark"
          label="Admission Dues"
          value={`₹${admissionDue}`}
          iconBg="#EAF2FF"
          iconColor="#1266D6"
          valueColor="#1266D6"
        />

        <SummaryBox
          icon="calculator-outline"
          label="POS Dues"
          value={`₹${posDue}`}
          iconBg="#FFF2DE"
          iconColor="#F59E0B"
          valueColor="#F59E0B"
        />

        <SummaryBox
          icon="wallet-outline"
          label="Total Dues"
          value={`₹${totalDues}`}
          dark
        />
      </View>

      <View style={styles.feeHeader}>
        <View>
          <Text style={styles.feeTitle}>Fee Ledger</Text>
          <Text style={styles.feeSub}>Session {student?.session}</Text>
        </View>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('TutionFee')}
        >
          <Text style={styles.historyText}>View Tuition Fee Record</Text>
          <Icon name="chevron-forward" size={12} color="#0066C9" />
        </TouchableOpacity>
      </View>

      <View style={styles.amountHeaderGrid}>
        <Text style={styles.amountHeaderText}>Date</Text>
        <Text style={styles.amountHeaderText}>Credit/Paid</Text>
        <Text style={styles.amountHeaderText}>Debit/Due</Text>
        <Text style={styles.amountHeaderText}>Balance Due</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FullScreenLoader visible={loading} />

      <>
        <CommonHeader
          student={student}
          navigation={navigation}
          showNotification={true}
        />

        <View style={styles.fixedHeaderSection}>
          <HeaderSection />
        </View>

        <FlatList
          data={ledgerData}
          keyExtractor={(row, index) => `${row.module}-${row.sno || index}`}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: totalDues > 0 ? 145 : 90 }}
          renderItem={({ item }) => (
            <LedgerCard item={item} />
          )}
        />

     

        <View style={styles.bottomNavWrapper}>
          <BottomNavigator />
        </View>

        
      </>
    </View>
  );
}

const SummaryBox = ({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  valueColor,
  dark = false,
}) => (
  <View style={[styles.summaryCard, dark && styles.summaryDarkCard]}>
    <View style={[styles.summaryIconBox, { backgroundColor: dark ? '#555' : iconBg }]}>
      <Icon name={icon} size={22} color={dark ? colors.white : iconColor} />
    </View>
    <Text style={[styles.summaryLabel, dark && { color: colors.white }]}>
      {label}
    </Text>
    <Text style={[styles.summaryValue, { color: dark ? colors.white : valueColor }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundcolor,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 14,
  },

  summaryCard: {
    width: '23.5%',
    backgroundColor: colors.white,
    borderRadius: 13,
    paddingVertical: 9,
    paddingHorizontal: 3,
    alignItems: 'center',
    elevation: 2,
  },

  summaryDarkCard: {
    backgroundColor: '#222',
  },

  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },

  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  summaryLabel: {
    fontSize: 9,
    color: colors.black,
    textAlign: 'center',
  },

  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  feeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
  },

  feeSub: {
    fontSize: 12,
    color: colors.subtitle,
    marginTop: 2,
  },

  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  historyText: {
    fontSize: 10,
    color: '#0066C9',
    fontWeight: '600',
  },

  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  ledgerCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
  },

  ledgerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  badgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 4,
  },

ledgerTitle: {
  fontSize: 12,
  fontWeight: '700',
  color: colors.black,
  textAlign: 'center',
  flexWrap: 'wrap',
},
ledgerTitleBox: {
  flex: 1,
  paddingRight: 4,
},

  ledgerDivider: {
    height: 1,
    backgroundColor: colors.gray,
    marginTop: 10,
    marginBottom: 8,
  },

  amountGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  amountBox: {
    flex: 1,
    alignItems: 'center',
  },

  amountPaid: {
    fontSize: 12,
    fontWeight: '700',
    color: '#159947',
  },

  amountDue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E60000',
  },

  amountBalance: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.black,
  },

  verticalLine: {
    width: 1,
    height: 34,
    backgroundColor: colors.gray,
  },

  badgeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 7,
    minWidth: 70,
    alignItems: 'center',
  },

  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  admissionBadge: {
    backgroundColor: '#e6effa',
  },

  admissionBadgeText: {
    color: '#3d7aff',
  },

  posBadge: {
    backgroundColor: '#fbeff6',
  },

  posBadgeText: {
    color: '#92400E',
  },

  monthlyBadge: {
    backgroundColor: '#eaf9ef',
  },

  monthlyBadgeText: {
    color: '#0ca945',
  },

  amountHeaderGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 8,
    elevation: 2,
  },

  amountHeaderText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#444',
    textAlign: 'center',
  },

  fixedHeaderSection: {
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: colors.backgroundcolor,
  },

  dateAmountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#444',
  },

  badgeBillBox: {
    alignItems: 'center',
    marginRight: 8,
    width: 95,
  },

  billNoBelowBadge: {
    fontSize: 9,
    color: '#555',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 11,
    width: 95,
  },

  paymentModeText: {
    fontSize: 10,
    color: '#555',
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
});
