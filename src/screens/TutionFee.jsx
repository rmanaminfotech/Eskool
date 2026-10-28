import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { BottomNavigator } from '../navigation/BottomNavigator';
import CommonHeader from '../components/CommonHeader';
import { getAuthContext } from '../services/appStorage';
import { studentApi } from '../services/studentApi';
import PaymentModal from '../components/PaymentModal';
import { shareReceiptPDF } from '../utils/shareReceiptPDF';
import { colors } from '../utils/colors';
import FullScreenLoader from '../components/FullScreenLoader';

export function TutionFee({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [admissionSummary, setAdmissionSummary] = useState(null);
  const [admissionFees, setAdmissionFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [school, setSchool] = useState(null);
  const [posFees, setPosFees] = useState([]);
  const [masterSummary, setMasterSummary] = useState(null);
  const [allFeeRecords, setAllFeeRecords] = useState([]);

  useEffect(() => {
    fetchFeeData();
    fetchSchoolData();
  }, []);

  const fetchSchoolData = async () => {
    try {
      const res = await studentApi.get('master.php');

      if (res?.data?.length > 0) {
        setSchool(res.data[0]);
      }
    } catch (err) {
      console.log("School API Error:", err);
    }
  };

  const getSortDate = item => {
    if (item.raw_date) {
      return new Date(item.raw_date).getTime();
    }

    if (item.date) {
      const parts = item.date.split('-');

      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
      }
    }

    return 0;
  };

  const fetchFeeData = async () => {
    try {
      const { jwt, studentId } = await getAuthContext();

      if (!studentId || !jwt) {
        setLoading(false);
        return;
      }

      let admissionTemp = [];
      let posTemp = [];
      let monthlyTemp = [];

      const profileRes = await studentApi.post('profile_detail.php', {
        studentid: studentId,
      });

      if (profileRes?.data?.status === true) {
        setStudent(profileRes.data.data);
      }

      const admissionResponse = await studentApi.post('admission_fee_ledger.php', {
        studentid: studentId,
      });

      if (admissionResponse?.data?.status === true) {
        setAdmissionSummary({
          total: admissionResponse.data.std_totalamnt || 0,
          paid: admissionResponse.data.std_totalpaid || 0,
          due: admissionResponse.data.std_totaldue || 0,
          session: admissionResponse.data.session,
        });

const admissionBillsMap = {};

(admissionResponse.data.ledger || []).forEach((bill, index) => {
  const billNo = bill.bill_no || bill.reference_no || `admission-${index}`;

  if (!admissionBillsMap[billNo]) {
    admissionBillsMap[billNo] = {
      ...bill,
      id: `admission-${billNo}`,
      bill_no: billNo,
      month_year: 'Admission Fee',
      total_amount: admissionResponse.data.std_totalamnt,
      paid_amount: admissionResponse.data.std_totalpaid,
      due_amount: admissionResponse.data.std_totaldue,
      fee_type: 'admission',
      breakdown: admissionResponse.data.breakdown || {},
      breakdown_total: admissionResponse.data.breakdown_total,
      std_discount: admissionResponse.data.std_discount,
      net_payable: admissionResponse.data.net_payable,
      transactions: [],
    };
  }

  if (parseInt(bill.paid_amount || 0) > 0) {
    admissionBillsMap[billNo].transactions.push({
      payment_date: bill.date,
      mode: bill.payment_mode,
      payment_id: bill.reference_no,
      paid_amount: bill.paid_amount,
    });
  }
});

admissionTemp = Object.values(admissionBillsMap);
      }

      const masterLedgerResponse = await studentApi.post(
        'student_master_ledger.php',
        { studentid: studentId },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      if (masterLedgerResponse?.data?.status === true) {
        setMasterSummary(masterLedgerResponse.data.summary);

const ledger = masterLedgerResponse.data.ledger || [];

const posBillsMap = {};

ledger
  .filter(item => item.module === 'POS')
  .forEach(item => {
    const billNo = item.reference_no;

    if (!posBillsMap[billNo]) {
      posBillsMap[billNo] = {
        bill_no: billNo,
        transactions: [],
      };
    }

    if (item.entry_type === 'debit') {
      posBillsMap[billNo] = {
        ...posBillsMap[billNo],
        ...item,
        id: `pos-${billNo}`,
        month_year: item.particular,
        bill_no: billNo,
        total_amount: item.debit,
        paid_amount: item.credit,
        due_amount: item.balance,
        fee_type: 'pos',
        breakdown: item.breakdown || [],
        breakdown_items: item.breakdown_items || [],
      };
    }

    if (item.entry_type === 'credit') {
      posBillsMap[billNo].paid_amount =
        parseInt(posBillsMap[billNo].paid_amount || 0) +
        parseInt(item.credit || 0);

      posBillsMap[billNo].due_amount = item.balance;
      posBillsMap[billNo].balance = item.balance;
      posBillsMap[billNo].date = item.date;
      posBillsMap[billNo].raw_date = item.raw_date;

      posBillsMap[billNo].transactions.push({
        payment_date: item.date,
        mode: item.payment_mode,
        payment_id: item.payment_id || item.reference_no,
        paid_amount: item.credit,
        balance: item.balance,
        remark: item.remark,
      });
    }
  });

posTemp = Object.values(posBillsMap).sort((a, b) => {
  const dateA = new Date(a.raw_date || a.date);
  const dateB = new Date(b.raw_date || b.date);
  return dateB - dateA;
});
      }

      const response = await studentApi.post('monthwisefee_ledger.php', {
        studentid: studentId,
      });

      if (response?.data?.status === true) {
        setSummary(response.data.summary);

        const formatted = response.data.bills
          .sort((a, b) => {
            const dateA = new Date(a.raw_date || a.date);
            const dateB = new Date(b.raw_date || b.date);
            return dateB - dateA;
          })
          .map((bill) => {
            const paid = parseInt(bill.paid_amount);
            const due = parseInt(bill.due_amount);

            let status = 'Upcoming';
            if (paid > 0 && due === 0) status = 'Paid';
            else if (due > 0) status = 'Due';

            return {
              ...bill,
              status,
              fee_type: 'monthly',
            };
          });

        monthlyTemp = formatted;
      }

      const finalRecords = [
        ...admissionTemp,
        ...posTemp,
        ...monthlyTemp,
      ].sort((a, b) => getSortDate(b) - getSortDate(a));

      setAllFeeRecords(finalRecords);

    } catch (error) {
      console.log('Month Wise Fee Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthlyDue = parseInt(masterSummary?.monthly_due || 0);
  const admissionDue = parseInt(masterSummary?.admission_due || 0);
const posDue = parseInt(masterSummary?.pos_due || 0);
  
  const totalDues = parseInt(masterSummary?.total_due || 0);

  const handleReceiptPress = async (item) => {
    try {
      await shareReceiptPDF({
        student,
        item,
        school,
      });
    } catch (error) {
      console.log('Receipt share error:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to prepare receipt'
      );
    }
  };

  const getCardTheme = item => {
    if (item.fee_type === 'admission') {
      return {
        icon: 'shield-checkmark',
        color: '#1266D6',
        light: '#EAF2FF',
        badge: item.bill_no ? `Bill No: ${item.bill_no}` : '',
        title: 'Admission Fee',
      };
    }

    if (item.fee_type === 'pos') {
      return {
        icon: 'calculator-outline',
        color: '#F59E0B',
        light: '#FFF2DE',
        badge: item.bill_no ? `Bill No: ${item.bill_no}` : '',
        title: 'POS Dues',
      };
    }

    return {
      icon: 'calendar-outline',
      color: '#159947',
      light: '#E8F9EC',
      badge: item.bill_no ? `Bill No: ${item.bill_no}` : '',
      title: 'Monthly Fee',
    };
  };

  const getStatusText = item => {
    const due = parseInt(item.due_amount || 0);
    const paid = parseInt(item.paid_amount || 0);

    if (due === 0) return 'Paid';
    if (paid > 0 && due > 0) return 'Partial';
    if (due > 0) return 'Due';
    return item.status || '-';
  };

  const getLastPayment = item => {
    if (item.transactions && item.transactions.length > 0) {
      return item.transactions[0];
    }
    return null;
  };

  const renderFeeCard = ({ item, index }) => {
    const theme = getCardTheme(item);
    const status = getStatusText(item);
    const txn = getLastPayment(item);
    const isLatest = item.fee_type === 'monthly' && index === 0;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setSelected(item)}
        style={styles.feeCard}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.cardTitleWrap}>
            <View style={[styles.feeIconCircle, { backgroundColor: theme.light }]}>
              <Icon name={theme.icon} size={20} color={theme.color} />
            </View>

            <Text style={styles.feeCardTitle}>{theme.title}</Text>
          </View>

          {!!theme.badge && (
            <View style={[styles.badgeBox, { backgroundColor: theme.light }]}>
              <Text style={[styles.badgeText, { color: theme.color }]}>
                {theme.badge}
              </Text>
            </View>
          )}
        </View>

<View style={styles.amountGrid}>
  <AmountItem
    value={`₹${item.total_amount || 0}`}
    color={theme.color}
  />

  <AmountItem
    value={`₹${item.paid_amount || 0}`}
    color={theme.color}
  />

  <AmountItem
    value={`₹${item.due_amount || 0}`}
    color={theme.color}
  />

  <View style={styles.amountItem}>
    <View
      style={[
        styles.statusPill,
        { backgroundColor: theme.light },
      ]}
    >
      <Text
        style={[
          styles.statusText,
          { color: theme.color },
        ]}
      >
        {status}
      </Text>
    </View>
  </View>
</View>
        

        <View style={styles.dashedDivider} />

        <View style={styles.infoRow}>
          <InfoItem
            icon={item.fee_type === 'admission' ? 'calendar-number-outline' : 'calendar-outline'}
            label={item.fee_type === 'admission' ? 'Bill Date' : 'Last Paid On'}
            value={txn?.payment_date || item.date || '-'}
            color={theme.color}
            light={theme.light}
          />

          <View style={styles.verticalLine} />

          <InfoItem
            icon="wallet-outline"
            label="Mode"
            value={txn?.mode || '-'}
            color={theme.color}
            light={theme.light}
          />

          {item.fee_type === 'admission' && (
            <>
              <View style={styles.verticalLine} />
              <InfoItem
                icon="calendar-number-outline"
                label="Last Paid"
                value={txn?.payment_date || '-'}
                color={theme.color}
                light={theme.light}
              />
            </>
          )}

          <View style={styles.verticalLine} />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleReceiptPress(item)}
            style={styles.receiptItem}
          >
            <View style={[styles.smallIconCircle, { backgroundColor: theme.light }]}>
              <Icon name="download-outline" size={15} color={theme.color} />
            </View>

            <View>
              <Text style={styles.infoLabel}>Receipt</Text>
              <View style={styles.receiptViewRow}>
                <Text style={[styles.receiptViewText, { color: theme.color }]}>
                  {item.bill_no || txn ? 'View' : '-'}
                </Text>
                {(item.bill_no || txn) && (
                  <Icon name="chevron-forward" size={14} color={theme.color} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {isLatest && parseInt(item.due_amount || 0) > 0 && (
          <TouchableOpacity
            style={styles.payNowBtn}
            onPress={() => setShowPaymentModal(true)}
          >
            <Text style={styles.payNowText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
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

        <View style={styles.fixedHeaderSection}>
          <View style={styles.summaryRowNew}>
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
              <Text style={styles.feeTitle}>Tuition Fee</Text>
              <Text style={styles.feeSub}>
                Session {student?.session}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() =>
                navigation.navigate('AdmissionFeeRecord')
              }
            >
              <Text style={styles.historyText}>
                Fee Ledger
              </Text>

              <Icon
                name="chevron-forward"
                size={12}
                color="#0066C9"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.commonAmountHeader}>
  <Text style={styles.commonAmountLabel}>Total</Text>
  <Text style={styles.commonAmountLabel}>Paid</Text>
  <Text style={styles.commonAmountLabel}>Due</Text>
  <Text style={styles.commonAmountLabel}>Status</Text>
</View>
        </View>

        <FlatList
          data={allFeeRecords}
          keyExtractor={(item, index) =>
            `${item.fee_type}-${item.bill_no || item.id}-${index}`
          }
          contentContainerStyle={styles.listContent}
          renderItem={renderFeeCard}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.bottomNavWrapper}>
          <BottomNavigator />
        </View>

        <PaymentModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          navigation={navigation}
        />
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
  <View
    style={[
      styles.summaryCardNew,
      dark && styles.summaryDarkCard,
    ]}
  >
    <View
      style={[
        styles.summaryIconBox,
        {
          backgroundColor: dark ? '#555' : iconBg,
        },
      ]}
    >
      <Icon
        name={icon}
        size={27}
        color={dark ? colors.white : iconColor}
      />
    </View>

    <Text
      style={[
        styles.summaryLabelNew,
        dark && { color: colors.white },
      ]}
    >
      {label}
    </Text>

    <Text
      style={[
        styles.summaryValueNew,
        {
          color: dark ? colors.white : valueColor,
        },
      ]}
    >
      {value}
    </Text>
  </View>
);

const AmountItem = ({ value, color }) => (
  <View style={styles.amountItem}>
    <Text style={[styles.amountValue, { color }]}>
      {value}
    </Text>
  </View>
);

const InfoItem = ({ icon, label, value, color, light }) => (
  <View style={styles.infoItem}>
    <View style={[styles.smallIconCircle, { backgroundColor: light }]}>
      <Icon name={icon} size={15} color={color} />
    </View>

    <View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const Summary = ({ label, value, color = '#333' }) => (
  <View style={styles.summaryCard}>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  fixedHeaderSection: {
    paddingHorizontal: 10,
    paddingTop: 6,
    backgroundColor: '#F8FAFC',
  },

  summaryRowNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  summaryCardNew: {
    width: '23%',
    backgroundColor: colors.white,
    borderRadius: 13,
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
    elevation: 2,
  },

  summaryDarkCard: { backgroundColor: '#202020' },

  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },

  summaryLabelNew: {
    fontSize: 9,
    color: '#111',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 11,
  },

  summaryValueNew: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },

  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  feeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },

  feeSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
    fontWeight: '500',
  },

  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  historyText: {
    fontSize: 10,
    color: '#0066C9',
    fontWeight: '600',
  },

  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 85,
  },

  feeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 11,
    marginBottom: 10,
    elevation: 2,
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },

  feeIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 7,
  },

  feeCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    flexShrink: 1,
  },

  badgeBox: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
    marginLeft: 5,
    maxWidth: 135,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  amountGrid: {
    marginTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  amountItem: {
    width: '24%',
    alignItems: 'center',
  },

  amountLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
    fontWeight: '500',
  },

  amountValue: {
    fontSize: 11.5,
    fontWeight: '800',
  },

  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  dashedDivider: {
    borderStyle: 'dashed',
    borderWidth: 0.6,
    borderColor: '#D8D8D8',
    marginTop: 13,
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },

  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.9,
    minWidth: 0,
  },

  smallIconCircle: {
    width: 23,
    height: 23,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },

  infoTextBox: {
    flex: 1,
    minWidth: 0,
  },

  infoLabel: {
    fontSize: 8.5,
    color: '#777',
    fontWeight: '500',
  },

  infoValue: {
    fontSize: 9.5,
    color: '#111',
    fontWeight: '700',
    marginTop: 1,
  },

  receiptViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },

  receiptViewText: {
    fontSize: 10,
    fontWeight: '700',
  },

  verticalLine: {
    width: 1,
    height: 24,
    backgroundColor: '#D6D6D6',
    marginHorizontal: 3,
  },

  payNowBtn: {
    marginTop: 10,
    backgroundColor: colors.orange,
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },

  payNowText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },

  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },

  summaryCard: {
    width: '31%',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
  },

  summaryLabel: {
    fontSize: 9,
    color: colors.black,
    marginTop: 3,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },

  rowLabel: { color: colors.placeholder },

  rowValue: { fontWeight: '700' },
  commonAmountHeader: {
  flexDirection: 'row',
  backgroundColor: '#fff',
  borderRadius: 10,
  paddingVertical: 8,
  paddingHorizontal: 6,
  marginBottom: 8,
  elevation: 2,
},

commonAmountLabel: {
  width: '25%',
  textAlign: 'center',
  fontSize: 11,
  fontWeight: '800',
  color: '#111',
},
});