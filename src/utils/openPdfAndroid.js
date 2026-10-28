import { NativeModules, Platform } from 'react-native';

export async function openPdfWithAppChooser(absolutePath, title = 'Open with') {
  if (Platform.OS !== 'android') {
    throw new Error('openPdfWithAppChooser is Android-only');
  }

  const mod = NativeModules.OpenPdfAndroid;

  if (!mod?.openWithChooser) {
    throw new Error('OpenPdfAndroid is not registered');
  }

  await mod.openWithChooser(absolutePath, 'application/pdf', title);
}