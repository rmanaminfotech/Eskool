import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';

const HomePaymentReminderModal = ({
  visible,
  onClose,
  onPayNow,
  amount = '2,450.00',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Icon name="close" size={22} color="#888888" />
          </TouchableOpacity>

          <View style={styles.iconHalo}>
            <LinearGradient
              colors={['#FFE7D2', '#FFF5EE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconWrap}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>!</Text>
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.title}>Payment Reminder</Text>
          <Text style={styles.subtitle}>
            You have pending dues for the current term.
          </Text>
          <Text style={styles.description}>
            Please make the payment at the earliest to avoid late fees and
            service interruption.
          </Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Dues</Text>
            <Text style={styles.amount}>₹ {amount}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryButton}
            onPress={onPayNow}
          >
            <Text style={styles.primaryButtonText}>Pay Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.secondaryButton}
            onPress={onClose}
          >
            <Text style={styles.secondaryButtonText}>Remind Me Later</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Icon name="lock-closed-outline" size={14} color="#B8B8B8" />
            <Text style={styles.footerText}>Secure Payment</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default HomePaymentReminderModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F3F3',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  iconHalo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 34,
  },
  alertBadge: {
    position: 'absolute',
    top: 16,
    right: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF5D73',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  alertBadgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    color: '#222222',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: '#3A3A3A',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
    color: '#7E7E7E',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  summaryCard: {
    backgroundColor: '#FFF4F3',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F25F73',
  },
  primaryButton: {
    backgroundColor: '#FF9F00',
    borderRadius: 14,
    marginBottom: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#D6D6D6',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#595959',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#B0B0B0',
    fontWeight: '600',
  },
});
