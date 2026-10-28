import Share from 'react-native-share';
import { Platform } from 'react-native';
import FileViewer from 'react-native-file-viewer';
import { generatePDF } from 'react-native-html-to-pdf';
import { generateReceiptHTML } from '../components/ReceiptTemplate';

const getSafeFileName = item => {
  const receiptNo =
    item?.receipt_no ||
    item?.receiptNo ||
    item?.reference_no ||
    item?.bill_no ||
    item?.sno ||
    Date.now();

  return `receipt-${String(receiptNo).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
};

const getFileUrl = filePath =>
  filePath.startsWith('file://') ? filePath : `file://${filePath}`;

const getAbsolutePath = filePath =>
  filePath.startsWith('file://') ? filePath.replace('file://', '') : filePath;

export const shareReceiptPDF = async ({ student, item, school }) => {
  const fileName = getSafeFileName(item);
  const html = generateReceiptHTML({
    student,
    item,
    school,
  });

  const pdf = await generatePDF({
    html,
    fileName,
  });

  if (!pdf?.filePath) {
    throw new Error('Receipt PDF was not created');
  }

  if (Platform.OS === 'android') {
    await FileViewer.open(getAbsolutePath(pdf.filePath), {
      showOpenWithDialog: true,
    });
    return;
  }

  await Share.open({
    title: 'Share or Download Receipt',
    subject: 'Fee Receipt',
    message: 'Fee receipt attached.',
    url: getFileUrl(pdf.filePath),
    type: 'application/pdf',
    filename: fileName,
    failOnCancel: false,
    showAppsToView: true,
  });
};
