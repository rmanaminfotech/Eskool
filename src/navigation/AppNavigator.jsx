import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import StudentProfile from '../screens/StudentProfile';
import Faq from '../screens/Faq';
import AdmissionFeeRecord from '../screens/AdmissionFeeRecord';
import Sample from '../screens/Sample';
import { Attendence } from '../screens/Attendence';
import Notice from '../screens/Notice';
import NoticeDetails from '../screens/NoticeDetails';
import { Routine } from '../screens/Routine';
import Sidebar from '../screens/Sidebar';
import Notification from '../screens/Notification';
import { TutionFee } from '../screens/TutionFee';
import { VerifyOtpScreen } from '../screens/VerifyOtpScreen';
import { StudentSelectionScreen } from '../screens/StudentSelectionScreen';
import Transportation from '../screens/Transportation';
import UploadReceipt from '../screens/UploadReceipt';
import ForgetPassword from '../screens/ForgetPassword';
import Homework from '../screens/Homework';
import Message from '../screens/Message';
import Contactus from '../screens/Contactus';
import PrivacyPolicy from '../screens/PrivacyPolicy';
import TermsandCondition from '../screens/TermsandCondition';
import AcademicsCalender from '../screens/AcademicsCalender';

const Stack = createNativeStackNavigator();

/* ---------------- ROOT STACK ---------------- */

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="StudentProfile" component={StudentProfile} />
      <Stack.Screen name="Attendence" component={Attendence} />
      <Stack.Screen name="Faq" component={Faq} />
      <Stack.Screen name="AdmissionFeeRecord" component={AdmissionFeeRecord} />
      <Stack.Screen name="Sample" component={Sample} />
      <Stack.Screen name="Notice" component={Notice} />
      <Stack.Screen name="NoticeDetails" component={NoticeDetails} />
      <Stack.Screen name="Routine" component={Routine} />
      <Stack.Screen name="Sidebar" component={Sidebar} />
      <Stack.Screen name="Notification" component={Notification} />
      <Stack.Screen name="TutionFee" component={TutionFee} />
      <Stack.Screen name="VerifyOtpScreen" component={VerifyOtpScreen} />
      <Stack.Screen
        name="StudentSelectionScreen"
        component={StudentSelectionScreen}
      />
      <Stack.Screen name="Transportation" component={Transportation} />
      <Stack.Screen name="UploadReceipt" component={UploadReceipt} />
      <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
      <Stack.Screen name="Homework" component={Homework} />
      <Stack.Screen name="Message" component={Message} />
      <Stack.Screen name="Contactus" component={Contactus} />
      <Stack.Screen name="TermsandCondition" component={TermsandCondition} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <Stack.Screen name='AcademicsCalender' component={AcademicsCalender} />
    </Stack.Navigator>
  );
}
