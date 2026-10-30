import React from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RNFS from 'react-native-fs';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Pdf from 'react-native-pdf';

const displayDate = value => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function NoticeDetails({ navigation, route }) {
  const notice = route.params?.notice || {};
  const message = notice.nb_message || notice.message || notice.description || notice.details ||
    `${notice.nb_title || 'This notice'} is attached as a PDF. Tap “Download Notice” below to read the complete notice.`;
  const hasPdf = Boolean(notice.pdf_url);
  const downloadNotice = async () => {
    if (!notice.pdf_url) {
      Alert.alert('No attachment', 'This notice does not have a PDF attachment.');
      return;
    }

    try {
      const safeName = String(notice.nb_pdf || notice.nb_title || 'notice')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`;
      if (Platform.OS === 'android') {
        // Android Download Manager handles scoped storage (Android 10+) and shows download progress.
        await ReactNativeBlobUtil.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: filename,
            description: 'Downloading school notice',
            mime: 'application/pdf',
            mediaScannable: true,
            path: `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${filename}`,
          },
        }).fetch('GET', notice.pdf_url);
        Alert.alert('Downloaded', `Saved to Downloads/${filename}`);
      } else {
        const target = `${RNFS.DocumentDirectoryPath}/${filename}`;
        const result = await RNFS.downloadFile({ fromUrl: notice.pdf_url, toFile: target }).promise;
        if (result.statusCode !== 200) throw new Error(`Download failed (${result.statusCode})`);
        Alert.alert('Downloaded', `Saved as ${filename}`);
      }
    } catch (error) {
      console.log('Notice download error:', error);
      Alert.alert('Download failed', 'Please try again.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={['#ffc342', '#ffdf89', '#fff9ed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hero}>
          <View style={styles.heroGlow} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <View style={styles.backArrow}>
              <View style={styles.arrowShaft} />
              <View style={[styles.arrowHead, styles.arrowHeadTop]} />
              <View style={[styles.arrowHead, styles.arrowHeadBottom]} />
            </View>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Notice Details</Text>
        </LinearGradient>

        <View style={styles.noticeSummary}>
          <View style={styles.summaryGlow} />
          <Image source={require('../assets/icons/dashboard-notice.png')} style={styles.noticeIcon} />
          <View style={styles.summaryText}>
            <Text numberOfLines={1} style={styles.noticeTitle}>{notice.nb_title || 'Notice'}</Text>
            <Text style={styles.noticeDate}>{displayDate(notice.nb_date)}</Text>
            <View style={styles.category}><Text style={styles.categoryText}>{notice.category || 'General'}</Text></View>
          </View>
        </View>

        <View style={[styles.messageCard, hasPdf && styles.pdfMessageCard]}>
          {hasPdf ? (
            <View style={styles.pdfWrap}>
              <Pdf
                source={{ uri: notice.pdf_url, cache: true }}
                style={styles.pdf}
                trustAllCerts={false}
                fitPolicy={0}
                minScale={1}
                maxScale={3}
                spacing={0}
                enableAntialiasing
                onError={error => console.log('Notice PDF preview error:', error)}
              />
            </View>
          ) : <Text style={styles.message}>{message}</Text>}
          <TouchableOpacity style={[styles.downloadButton, hasPdf && styles.pdfDownloadButton]} activeOpacity={0.85} onPress={downloadNotice}>
            <Text style={styles.downloadIcon}>↓</Text>
            <Text style={styles.downloadText}>Download Notice</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7fbff' },
  content: { paddingBottom: 28 },
  hero: { height: 120, paddingHorizontal: 16, paddingTop: 31, position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  heroGlow: { position: 'absolute', width: 260, height: 180, borderRadius: 120, right: -36, top: -83, backgroundColor: 'rgba(255,255,255,0.62)' },
  backButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#c78317', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  backArrow: { width: 22, height: 19, position: 'relative' },
  arrowShaft: { position: 'absolute', left: 3, right: 0, top: 9, height: 2.5, borderRadius: 2, backgroundColor: '#101e4a' },
  arrowHead: { position: 'absolute', left: 3, width: 12, height: 2.5, borderRadius: 2, backgroundColor: '#101e4a' },
  arrowHeadTop: { top: 5, transform: [{ rotate: '-45deg' }] },
  arrowHeadBottom: { top: 13, transform: [{ rotate: '45deg' }] },
  heroTitle: { position: 'absolute', left: 104, top: 46, color: '#101e4a', fontSize: 22, fontWeight: '900' },
  noticeSummary: { minHeight: 112, marginHorizontal: 8, marginTop: -3, paddingHorizontal: 21, paddingVertical: 16, borderRadius: 23, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', overflow: 'hidden', elevation: 4, shadowColor: '#213653', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } },
  summaryGlow: { position: 'absolute', width: 190, height: 150, borderRadius: 90, right: -40, top: -40, backgroundColor: '#f5faff' },
  noticeIcon: { width: 58, height: 58, resizeMode: 'contain', transform: [{ scale: 1.4 }] },
  summaryText: { flex: 1, marginLeft: 20, zIndex: 1 },
  noticeTitle: { color: '#101e4a', fontSize: 21, fontWeight: '900' },
  noticeDate: { color: '#69748b', fontSize: 16, marginTop: 5 },
  category: { alignSelf: 'flex-start', marginTop: 9, paddingVertical: 6, paddingHorizontal: 15, borderRadius: 16, backgroundColor: '#ffe0e9' },
  categoryText: { color: '#ed315c', fontSize: 12, fontWeight: '800' },
  messageCard: { marginHorizontal: 12, marginTop: 12, padding: 24, borderRadius: 23, backgroundColor: '#fff', elevation: 3, shadowColor: '#213653', shadowOpacity: 0.08, shadowRadius: 13, shadowOffset: { width: 0, height: 4 } },
  pdfMessageCard: { padding: 0, overflow: 'hidden' },
  message: { color: '#151b32', fontSize: 17, lineHeight: 28, fontWeight: '500' },
  pdfWrap: { height: 580, overflow: 'hidden', backgroundColor: '#f3f6fa' },
  pdf: { flex: 1, width: '100%', backgroundColor: '#f3f6fa' },
  downloadButton: { marginTop: 27, minHeight: 62, borderRadius: 17, backgroundColor: '#fff2df', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pdfDownloadButton: { marginHorizontal: 20, marginTop: 18, marginBottom: 20 },
  downloadIcon: { color: '#f48609', fontSize: 29, fontWeight: '900', marginRight: 9, marginTop: -3 },
  downloadText: { color: '#e97500', fontSize: 16, fontWeight: '900' },
});
