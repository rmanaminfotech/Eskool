import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors } from "../utils/colors";

const AppAlertModal = ({
  visible,
  title,
  message,
  iconName = "log-out-outline",
  iconColor = colors.red,
  confirmText = "Confirm",
  cancelText,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Icon name={iconName} size={36} color={iconColor} />

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSub}>{message}</Text>

          <View style={styles.modalRow}>
            {cancelText ? (
              <>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onCancel}>
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={onConfirm}>
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={onConfirm}>
                <Text style={styles.confirmText}>{confirmText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AppAlertModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    width: '80%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },

  modalTitle: { fontSize: 18, fontWeight: '700', marginTop: 10 },

  modalSub: {
    color: colors.subtitle,
    marginVertical: 10,
    textAlign: "center"
  },

  modalRow: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'center',
  },

  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 25,
    marginRight: 10,
  },

  cancelText: { color: colors.gray2 },

  confirmBtn: {
    backgroundColor: colors.red,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },

  confirmText: {
    color: colors.white,
    fontWeight: '600'
  },
});