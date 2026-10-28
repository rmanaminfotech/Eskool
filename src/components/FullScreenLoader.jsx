import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '../utils/colors';

const FullScreenLoader = ({ visible = false }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color={colors.orange} />
      <Text style={styles.text}>Please wait...</Text>
    </View>
  );
};

export default FullScreenLoader;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    zIndex: 999,
  },

  text: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray2,
    fontWeight: '500',
  },
});