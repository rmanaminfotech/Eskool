import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigator } from '../navigation/BottomNavigator';
import Pdf from 'react-native-pdf';
import RNFS from 'react-native-fs';
import CommonHeader from '../components/CommonHeader';
import { imageapi } from './Api';
import { fetchStudentProfileDetail, studentApi } from '../services/studentApi';
import AppAlertModal from '../components/AppAlertModal';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { colors } from '../utils/colors';
import FullScreenLoader from '../components/FullScreenLoader';
export default function Notice() {
  const navigation = useNavigation();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfVisible, setPdfVisible] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [student, setStudent] = useState(null);
  const [originalPdfUrl, setOriginalPdfUrl] = useState("");
  const PDF_BASE_URL = `${imageapi}`;
const [alertVisible, setAlertVisible] = useState(false);
const [alertConfig, setAlertConfig] = useState({
  title: "",
  message: "",
});
const showAlert = (title, message) => {
  setAlertConfig({ title, message });
  setAlertVisible(true);
};

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
  }
};

const formatDate = (dateString) => {
  return dateString; 
};

const handleView = async (item) => {
  if (!item.pdf_url) {
    showAlert("No PDF", "No file available for this notice");
    return;
  }

  try {
    setLoading(true);

    const localPath = `${RNFS.CachesDirectoryPath}/temp.pdf`;

    const download = await RNFS.downloadFile({
      fromUrl: item.pdf_url,
      toFile: localPath,
    }).promise;

    if (download.statusCode === 200) {
      setOriginalPdfUrl(item.pdf_url); 
      setSelectedPdf(`file://${localPath}`);
      setSelectedFileName(
        item.nb_pdf
          ? item.nb_pdf.replace(/[^a-zA-Z0-9.]/g, "_")
          : "file.pdf"
      );
      setPdfVisible(true);
    } else {
      showAlert("Error", "Failed to load PDF");
    }
  } catch (error) {
    console.log("PDF Load Error:", error);
    showAlert("Error", "Unable to open PDF");
  } finally {
    setLoading(false);
  }
};

const handleDownload = async () => {
  try {
    const url = originalPdfUrl;
    const downloadPath = `${RNFS.DownloadDirectoryPath}/${selectedFileName}`;

    if (Platform.OS === "android" && Platform.Version < 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        showAlert("Permission Denied", "Storage permission is required");
        return;
      }
    }

    const result = await RNFS.downloadFile({
      fromUrl: url,
      toFile: downloadPath,
    }).promise;

    if (result.statusCode === 200) {
      showAlert("Download Complete", `Saved to:\n${downloadPath}`);
    } else {
      showAlert("Error", "Download failed");
    }
  } catch (error) {
    console.log("Download error:", error);
    showAlert("Error", "Failed to download PDF");
  }
};

  useEffect(() => {
    fetchNotices();
  }, []);

const fetchNotices = async () => {
  try {
    const response = await studentApi.get('notice_record.php');
    const json = response.data;

    if (json?.status === true) {
      const formatted = json.data.map(item => ({
        nb_id: item.nb_id,
        nb_title: item.title,
        nb_date: item.date,        
        nb_pdf: item.pdf,
        pdf_url: item.pdf_url,     
      }));

      setNotices(formatted);
    } else {
      setNotices([]);
    }

  } catch (error) {
    console.log('API Error:', error);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }
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

      <FlatList
        data={notices}
        keyExtractor={item => item.nb_id}
        contentContainerStyle={{ padding: 14 }}
        ListEmptyComponent={
  !loading && (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No notice available now
      </Text>
    </View>
  )
}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => handleView(item)}
          >
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.nb_title}</Text>
                <Text style={styles.date}>
                  {formatDate(item.nb_date)}
                </Text>
              </View>

              {/* Arrow Icon */}
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/271/271228.png' }}
                style={styles.arrowIcon}
              />
            </View>
          </TouchableOpacity>
        )}
      />

    <Modal
       visible={pdfVisible}
    animationType="slide"
       transparent={false}
         onRequestClose={() => setPdfVisible(false)} 
>
          <View style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.blue }]}
              onPress={handleDownload}>
              <Text style={styles.modalBtnText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.red }]}
              onPress={() => setPdfVisible(false)} >
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>

        <Pdf
  source={{ uri: selectedPdf }}
  style={{ flex: 1 }}
  trustAllCerts={false}/>
        </View>
      </Modal>

      <View style={styles.bottomNavWrapper}>
        <BottomNavigator />
      </View>
      </>
    
    <AppAlertModal
  visible={alertVisible}
  title={alertConfig.title}
  message={alertConfig.message}
  confirmText="OK"
  onConfirm={() => setAlertVisible(false)}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundcolor },
  card: { backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontWeight: '700', fontSize: 15, color: colors.black },
  date: { fontSize: 12, color: colors.gray2, marginTop: 4 },
  arrowIcon: { width: 18, height: 18, tintColor: colors.icon },
  bottomNavWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.orange,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  modalBtnText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 40,
},

emptyText: {
  fontSize: 15,
  fontWeight: '800',
  color: colors.gray2,
},
});