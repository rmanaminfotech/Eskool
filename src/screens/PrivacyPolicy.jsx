import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { BottomNavigator } from '../navigation/BottomNavigator';
import CommonHeader from '../components/CommonHeader';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import { fetchStudentProfileDetail } from '../services/studentApi';
import { colors } from '../utils/colors';
import FullScreenLoader from '../components/FullScreenLoader';

const PrivacyPolicy = () => {
  const navigation = useNavigation();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const profileData = await fetchStudentProfileDetail();
      if (profileData) {
        setStudent(profileData);
      }

      const res = await axios.get("https://trinityconventpatna.in/privacy-policy.php");

      let html = res.data;

      html = html
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<section class="inner-header[\s\S]*?<\/section>/gi, '')
        .replace(/<div[^>]*breadcrumb[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<a[^>]*whatsapp[^>]*>[\s\S]*?<\/a>/gi, '');
html = html.replace(/Disable Preloader/gi, '');
      html = html.replace(/position:\s*fixed/gi, 'display:none');

      setHtmlContent(html);

    } catch (error) {
      console.log("Privacy Screen Error:", error);
    } finally {
      setLoading(false);
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

          <View style={{ flex: 1 }}>
            <WebView
              // ✅ ONLY CHANGE: use cleaned HTML instead of URI
              source={{ html: htmlContent }}

              startInLoadingState={true}
              renderLoading={() => (
                <ActivityIndicator
                  size="large"
                  color={colors.orange}
                  style={{ marginTop: 20 }}
                />
              )}

              injectedJavaScriptBeforeContentLoaded={`
                (function() {

                  document.documentElement.style.opacity = '0';

                  function cleanEarly() {
                    document.body.style.margin = '0';
                    document.body.style.padding = '16px';
                    document.body.style.background = '#fff';
                  }

                  document.addEventListener("DOMContentLoaded", cleanEarly);

                  window.addEventListener("load", function() {
                    document.documentElement.style.opacity = '1';
                  });

                })();
                true;
              `}

              injectedJavaScript={`
                (function() {

                  function cleanPage() {

                    var selectors = [
                      'section.inner-header.divider.layer-overlay.overlay-theme-colored-7'
                    ];

                    selectors.forEach(function(sel) {
                      var elements = document.querySelectorAll(sel);
                      elements.forEach(function(el) {
                        el.style.display = 'none';
                      });
                    });

                    document.body.style.margin = '0';
                    document.body.style.padding = '16px';
                    document.body.style.fontSize = '16px';
                    document.body.style.background = '#fff';
                  }

                  setTimeout(cleanPage, 300);
                  setTimeout(cleanPage, 800);
                  setTimeout(cleanPage, 1500);

                })();
                true;
              `}
            />
          </View>

          <View style={styles.bottomNavWrapper}>
            <BottomNavigator />
          </View>
        </>
      
    </View>
  );
};

export default PrivacyPolicy;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundcolor,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  text: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray2,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomNavWrapper: {
    height: 60,
  },
});