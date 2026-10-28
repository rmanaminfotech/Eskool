import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { studentApi } from '../services/studentApi';
import { colors } from '../utils/colors';

const PaymentModal = ({ visible, onClose, navigation }) => {
  const [bankData, setBankData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchBankDetails();
    }
  }, [visible]);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);

      const res = await studentApi.get('bank_record.php');

      if (res?.data?.status === "true") {
        setBankData(res.data.data); 
      }
    } catch (error) {
      console.log("Bank API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
<Modal
  visible={visible}
  transparent
  animationType="slide"
  onRequestClose={onClose}
>
        <View style={styles.overlay}>
        <View style={styles.container}>

          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Icon name="close" size={22} color={colors.icon} />
          </TouchableOpacity>

          <Text style={styles.title}>Scan & Pay</Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.orange} style={{ marginTop: 20 }} />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ width: '100%', marginTop: 10 }}
                contentContainerStyle={{ paddingBottom: 20 }} // ✅ allows proper scroll

            >
              {bankData.map((item, index) => (
                <View key={index} style={styles.bankCard}>

                  {/* ✅ QR only if available */}
                  {item.qr_code && (
                    <Image
                      source={{ uri: item.qr_code }}
                      style={styles.barcode}
                      resizeMode="contain"
                    />
                  )}

                  {/* ✅ Bank Details */}
                  <View style={{ width: '100%', marginTop: 10 }}>

                    <View style={styles.row}>
                      <Text style={styles.label}>Account Name:</Text>
                      <Text style={styles.value}>{item.bank_account_name}</Text>
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>Account No:</Text>
                      <Text style={styles.value}>{item.bank_account_no}</Text>
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>IFSC:</Text>
                      <Text style={styles.value}>{item.bank_ifsc_code}</Text>
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>Bank:</Text>
                      <Text style={styles.value}>{item.bank_name}</Text>
                    </View>

                  </View>

                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => {
              onClose();
              navigation.navigate('UploadReceipt');
            }}
          >
            <Text style={styles.uploadText}>
              Upload Receipt / Screenshot
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

export default PaymentModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

container: {
  backgroundColor: colors.white,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 20,
  alignItems: 'center',
  maxHeight: '75%',   // ✅ LIMIT HEIGHT (important)
},

  title: {
    fontSize: 18,
    fontWeight: '700',
  },

barcode: {
  width: 160,
  height: 160,
  alignSelf: 'center',
},

  uploadBtn: {
    backgroundColor: colors.orange,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },

  uploadText: {
    color: colors.white,
    fontWeight: '700',
  },

  closeIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 6,
  },

  row: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: 4,
  },

  label: {
    width: '40%',
    fontWeight: '700',
  },

  value: {
    width: '60%',
    fontWeight: '600',
  },
  bankCard: {
  backgroundColor: colors.white,
  borderRadius: 12,
  padding: 12,
  marginBottom: 15,
  borderWidth: 1,
  borderColor: colors.border,
},

});