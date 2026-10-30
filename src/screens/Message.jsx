import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  FlatList,
  Linking,
  Modal,
  AppState,
   BackHandler,
} from 'react-native';

import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavigator } from '../navigation/BottomNavigator';
import { getAuthContext } from '../services/appStorage';
import { studentApi } from '../services/studentApi';
import AppAlertModal from '../components/AppAlertModal';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../utils/colors';
import FullScreenLoader from '../components/FullScreenLoader';
import { attachmentimages, studentapi } from './Api';
import LinearGradient from 'react-native-linear-gradient';
import { studentimageapi } from './Api';

const WA_BG = '#ece5dd';
const BUBBLE_OUT = '#dcf8c6';
const BUBBLE_IN = '#ffffff';

const norm = (v) => (v == null ? '' : String(v).toLowerCase().trim());

/** Map get_receiver.php list to Admin vs Class Teacher for the two cards. */
function resolveAdminAndTeacher(receivers) {
  if (!Array.isArray(receivers) || receivers.length === 0) {
    return { admin: null, teacher: null };
  }
  const admin = receivers.find((r) => {
    const t = norm(r.type);
    const n = norm(r.name);
    return t.includes('admin') || n.includes('admin');
  });
  const teacher = receivers.find((r) => {
    const t = norm(r.type);
    const n = norm(r.name);
    return (
      t.includes('teacher') ||
      t.includes('class') ||
      n.includes('class teacher') ||
      n.includes('classteacher')
    );
  });
  if (receivers.length >= 2 && !admin && !teacher) {
    return { admin: receivers[0], teacher: receivers[1] };
  }
  return { admin: admin || null, teacher: teacher || null };
}

function attachmentUrl(path) {
  if (!path) return null;
  const s = String(path).trim();
  if (!s || s === 'null' || s === 'undefined') return null;
  if (s.startsWith('http')) return s;
  return `${attachmentimages}${s.replace(/^\//, '')}`;
}

function pathWithoutQuery(s) {
  return String(s || '').split('?')[0].split('#')[0];
}

function hasImageExtension(pathOrUrl) {
  return /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(pathWithoutQuery(pathOrUrl));
}

/** Profile image for chat header — API may use any of these keys on receiver. */
function receiverAvatarUri(receiver) {
  if (!receiver || typeof receiver !== 'object') return null;
  const raw =
    receiver.photo_url ??
    receiver.photo ??
    receiver.photo_name ??
    receiver.image ??
    receiver.avatar ??
    receiver.profile_pic ??
    receiver.profile_image ??
    receiver.picture;
  return attachmentUrl(raw);
}

function receiverHeaderPlaceholderIcon(receiver) {
  const t = norm(receiver?.type);
  const n = norm(receiver?.name);
  if (t.includes('admin') || n.includes('admin')) return 'shield-checkmark';
  if (t.includes('teacher') || t.includes('class') || n.includes('teacher'))
    return 'school';
  return 'person';
}

function formatMsgTime(raw) {
  if (raw == null) return '';

  const formatDateObj = (d) =>
    d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return formatDateObj(raw);
  }

  if (typeof raw === 'number') {
    const n = new Date(raw);
    if (!Number.isNaN(n.getTime())) return formatDateObj(n);
  }

  const text = String(raw).trim();
  if (!text) return '';

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return formatDateObj(parsed);

  // Fallback for API values like:
  // "04:27:52 PM" or "2026-04-02 04:27:52 PM" (often non-ISO on Android/Hermes)
  const timeMatch = text.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?/);
  if (!timeMatch) return '';

  let hour = Number(timeMatch[1]);
  const minute = timeMatch[2];
  const ampm = timeMatch[3]?.toUpperCase();

  if (ampm) {
    if (hour === 0) hour = 12;
    if (hour > 12) hour = ((hour - 1) % 12) + 1;
    return `${hour}:${minute} ${ampm}`;
  }

  // If no AM/PM is present, assume 24-hour input and convert to 12-hour.
  if (Number.isNaN(hour)) return '';
  hour = Math.max(0, Math.min(23, hour));
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
}

function getMessageRawTime(row) {
  const createdAt = row.created_at ?? row.datetime ?? row.msg_time;
  if (createdAt) return createdAt;

  const datePart = row.date;
  const timePart = row.time;
  if (datePart && timePart) return `${String(datePart).trim()} ${String(timePart).trim()}`;

  return datePart ?? timePart ?? null;
}

function normalizeHistoryRow(row, index, studentId) {
  const text = row.message ?? row.msg ?? row.text ?? '';
  const id = row.id ?? row.message_id ?? `m-${index}`;
  const rawTime = getMessageRawTime(row);

  let mine = false;
  if (row.is_student === true || row.is_from_student === true) mine = true;
  else if (row.from_student === 1 || row.from_student === '1') mine = true;
  else if (norm(row.sender_type) === 'student') mine = true;
  else if (studentId != null && row.student_id != null)
    mine = String(row.student_id) === String(studentId);
  else if (studentId != null && row.sender_id != null)
    mine = String(row.sender_id) === String(studentId);

  const imageFile =
    row.file_url ??
    row.file_path ??
    row.attachment_url ??
    row.attachment_path ??
    row.file_name ??
    row.filename ??
    row.file ??
    row.files ??
    row.attachment ??
    row.image_url ??
    row.image ??
    row.photo_url ??
    row.photo ??
    row.media_url ??
    row.media ??
    row.upload ??
    row.document;

  const mimeType =
    row.mime_type ??
    row.mime ??
    row.file_mime ??
    row.file_type ??
    row.content_type ??
    (typeof row.type === 'string' && row.type.includes('/') ? row.type : null);

  return { id, text, rawTime, mine, imageFile, mimeType };
}

/** Single chat row: text, image preview, or generic file link */
function ChatBubble({ item }) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const uri = attachmentUrl(item.imageFile);
  const hasFile = Boolean(uri);
  const textEmpty = !String(item.text || '').trim();
  const mime = item.mimeType ? String(item.mimeType) : '';
  const mimeIsImage = /^image\//i.test(mime);
  const mimeIsPdf = /pdf/i.test(mime);
  const tryAsImage =
    hasFile &&
    !imageFailed &&
    (mimeIsImage ||
      hasImageExtension(uri) ||
      hasImageExtension(item.imageFile || '') ||
      (textEmpty && hasFile && !mimeIsPdf && !/\.pdf$/i.test(pathWithoutQuery(uri))));

 const openFile = () => {
  if (!tryAsImage && uri) {
    Linking.openURL(uri).catch(() => {});
  }
};

  return (
    <View
      style={[
        styles.bubbleRow,
        item.mine ? styles.bubbleRowOut : styles.bubbleRowIn,
      ]}
    >
      <View
        style={[
          styles.bubble,
          item.mine
            ? { backgroundColor: BUBBLE_OUT }
            : { backgroundColor: BUBBLE_IN },
        ]}
      >
       {tryAsImage ? (
  <TouchableOpacity onPress={() => setPreviewVisible(true)}>
    <Image
      source={{ uri }}
      style={styles.bubbleImage}
      resizeMode="cover"
      onError={() => setImageFailed(true)}
    />
  </TouchableOpacity>
) : null}
        {hasFile && !tryAsImage ? (
          <TouchableOpacity
            onPress={openFile}
            style={styles.bubbleFileRow}
            activeOpacity={0.7}
          >
            <Icon name="document-attach-outline" size={22} color={colors.gray2} />
            <Text style={styles.bubbleFileText} numberOfLines={2}>
              {mimeIsPdf ? 'PDF attachment' : 'Attachment'}
            </Text>
            <Icon name="open-outline" size={18} color={colors.orange} />
          </TouchableOpacity>
        ) : null}
        {item.text ? (
          <Text style={styles.bubbleText}>{item.text}</Text>
        ) : null}
        <Text style={styles.bubbleTime}>{formatMsgTime(item.rawTime)}</Text>
      </View>
      {previewVisible && (
  <Modal transparent={true}>
    <View
      style={{
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Close Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          zIndex: 10,
        }}
        onPress={() => setPreviewVisible(false)}
      >
        <Icon name="close" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Full Image */}
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '80%' }}
        resizeMode="contain"
      />
    </View>
  </Modal>
)}
    </View>
    
  );
}

/** Pull chat rows from common `message_record.php` response shapes. */
function extractMessageHistoryList(apiData) {
  if (!apiData || typeof apiData !== 'object') return [];
  if (Array.isArray(apiData)) return apiData;

  const tryFirstArray = (obj, keys) => {
    for (const k of keys) {
      const v = obj[k];
      if (Array.isArray(v)) return v;
    }
    return null;
  };

  const topKeys = [
    'messages',
    'message_record',
    'records',
    'history',
    'message_list',
    'chat',
    'rows',
    'list',
    'result',
    'items',
    'data',
  ];
  const fromTop = tryFirstArray(apiData, topKeys);
  if (fromTop) return fromTop;

  const inner = apiData.data;
  if (inner && typeof inner === 'object') {
    if (Array.isArray(inner)) return inner;
    const nestedKeys = [
      'messages',
      'message_record',
      'records',
      'history',
      'message_list',
      'list',
      'rows',
      'result',
      'items',
    ];
    const fromNested = tryFirstArray(inner, nestedKeys);
    if (fromNested) return fromNested;
  }

  return [];
}

const initialAlert = {
  visible: false,
  title: '',
  message: '',
  iconName: 'log-out-outline',
  iconColor: '#e74c3c',
};

/** Landing header is deliberately local to Messages so the reference treatment
 * does not alter the headers used by the rest of the app. */
function MessageLandingHeader({ student, navigation }) {
  const insets = useSafeAreaInsets();
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const { studentId } = await getAuthContext();
          if (!studentId) return;
          const res = await studentApi.post('today_notification.php', {
            student_id: studentId,
          });
          if (active && res?.data?.status) setCount(res.data.count || 0);
        } catch (error) {
          console.log('Message notification count error:', error);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <LinearGradient
      colors={['#ff9800', '#ffbe18', '#fff04b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.messageHeader, { paddingTop: insets.top + 10 }]}
    >
      <View style={styles.headerGlowLeft} />
      <View style={styles.headerGlowRight} />
      <View style={styles.messageHeaderRow}>
        <View style={styles.messageStudentPhotoWrap}>
          <Image
            source={
              student?.photo_name
                ? { uri: `${studentimageapi}${student.photo_name}` }
                : require('../assets/icons/avatar.png')
            }
            style={styles.messageStudentPhoto}
            resizeMode="cover"
          />
        </View>
        <View style={styles.messageHeaderText}>
          <Text style={styles.messageStudentName} numberOfLines={1}>
            {student?.trainees_name || '-'}
          </Text>
          <Text style={styles.messageStudentClass} numberOfLines={1}>
            Class: {student?.class_name || '-'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.messageNotificationBtn}
          onPress={() => navigation.navigate('Notification')}
          activeOpacity={0.8}
        >
          <Icon name="notifications-outline" size={33} color="#07133f" />
          {count > 0 ? (
            <View style={styles.messageBadge}>
              <Text style={styles.messageBadgeText}>{count > 9 ? '9+' : count}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

/**
 * Chat thread + composer. Separate component so parent `Message` keeps a short,
 * stable hook list (avoids Rules of Hooks issues with navigation / fast refresh).
 */
function MessageChatPanel({ receiver, onBack, showAlert }) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState(null);
  const [headerAvatarFailed, setHeaderAvatarFailed] = useState(false);
  const listRef = useRef(null);
  const hasScrolledInitially = useRef(false);
  const fetchInProgressRef = useRef(false);

const [showScrollBtn, setShowScrollBtn] = useState(false);
  useEffect(() => {
    const evt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(evt, () => {
     scrollToBottom();
    });
    return () => sub.remove();
  }, []);

  const fetchMessages = useCallback(async ({ silent = false } = {}) => {
    if (!receiver) return;
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;
    try {
      if (!silent) setHistoryLoading(true);
      const { jwt, studentId } = await getAuthContext();
      if (!studentId || !jwt) {
        console.log('[MessageRecord] skipped — missing auth', {
          hasStudentId: Boolean(studentId),
          hasJwt: Boolean(jwt),
        });
        setMessages([]);
        return;
      }

      const requestBody = {
        studentid: studentId,
        receiver_id: receiver.id,
        receiver_type: receiver.type,
      };
      console.log('[MessageRecord] request', {
        url: `${studentapi}message_record.php`,
        body: requestBody,
      });

      const res = await studentApi.post('message_record.php', requestBody);
      const fullData = res?.data;

      console.log('[MessageRecord] response', {
        httpStatus: res?.status,
        data: fullData,
      });

      const list = extractMessageHistoryList(fullData);

      if (list.length === 0 && fullData && typeof fullData === 'object') {
        console.log(
          '[MessageRecord] parsed 0 messages — inspect keys (API may use a different shape)',
          {
            topLevelKeys: Object.keys(fullData),
            nestedDataKeys:
              fullData.data != null && typeof fullData.data === 'object' && !Array.isArray(fullData.data)
                ? Object.keys(fullData.data)
                : null,
          },
        );
      } else {
        console.log('[MessageRecord] parsed message rows', { count: list.length });
      }

      setMessages(list.map((row, i) => normalizeHistoryRow(row, i, studentId)));
    } catch (error) {
      console.log('[MessageRecord] error', {
        message: error?.message,
        httpStatus: error?.response?.status,
        responseData: error?.response?.data,
      });
      setMessages([]);
    } finally {
      fetchInProgressRef.current = false;
      if (!silent) setHistoryLoading(false);
    }
  }, [receiver]);

  useEffect(() => {
    setHeaderAvatarFailed(false);
    setMessage('');
    setFile(null);
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!receiver || !isFocused) return undefined;

    const POLL_INTERVAL_MS = 4000;
    const intervalId = setInterval(() => {
      fetchMessages({ silent: true });
    }, POLL_INTERVAL_MS);

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        fetchMessages({ silent: true });
      }
    });

    return () => {
      clearInterval(intervalId);
      appStateSub.remove();
    };
  }, [fetchMessages, isFocused, receiver]);

  const sendMessage = async () => {
    const text = message.trim();
    const hasFile = Boolean(file?.uri);
    if (!receiver || (text === '' && !hasFile)) {
      showAlert('Error', 'Please enter a message or attach a file');
      return;
    }
    try {
      setSending(true);
      const { jwt, studentId } = await getAuthContext();
      if (!studentId || !jwt) {
        console.log('[SendMessage] auth missing', {
          hasStudentId: Boolean(studentId),
          hasJwt: Boolean(jwt),
        });
        return;
      }

      const isMultipart = Boolean(file?.uri);
      /** Matches `studentApi` interceptor: `Authorization: Bearer <jwt>` */
      const authorizationHeader = `Bearer ${jwt}`;
      console.log('[SendMessage] HTTP (via studentApi interceptor)', {
        method: 'POST',
        url: `${studentapi}send_message.php`,
        contentType: isMultipart
          ? 'multipart/form-data (boundary set by client; FormData clears default JSON Content-Type)'
          : 'application/json',
        authorizationScheme: 'Bearer',
        authorizationHeader,
      });

      const sid = String(studentId);
      const rid = String(receiver.id);
      const rtype = String(receiver.type ?? '');

      let res;
      if (file?.uri) {
        const formData = new FormData();
        formData.append('studentid', sid);
        formData.append('receiver_id', rid);
        formData.append('receiver_type', rtype);
        formData.append('message', text);
        formData.append('file', {
          uri: file.uri,
          type: file.type || 'image/jpeg',
          name: file.fileName || file.name || 'attachment.jpg',
        });
        console.log('[SendMessage] multipart (send_message.php)', {
          studentid: sid,
          receiver_id: rid,
          receiver_type: rtype,
          message: text,
          file: {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.fileName || file.name || 'attachment.jpg',
          },
        });
        // Use fetch for multipart: axios + FormData often yields "Network Error" on RN
        // when the default JSON Content-Type is still applied. Fetch omits Content-Type
        // so the native stack sets the multipart boundary correctly.
        const uploadUrl = `${studentapi}send_message.php`;
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: authorizationHeader,
          },
          body: formData,
        });
        const rawText = await uploadResponse.text();
        let parsed;
        try {
          parsed = rawText ? JSON.parse(rawText) : {};
        } catch {
          console.log('[SendMessage] multipart response not JSON', {
            httpStatus: uploadResponse.status,
            preview: rawText?.slice?.(0, 300),
          });
          parsed = {
            status: false,
            message: rawText || 'Invalid response from server',
          };
        }
        res = { status: uploadResponse.status, data: parsed };
      } else {
        const body = {
          studentid: sid,
          receiver_id: rid,
          receiver_type: rtype,
          message: text,
        };
        console.log('[SendMessage] JSON (send_message.php)', body);
        res = await studentApi.post('send_message.php', body);
      }

      const payload = res?.data;
      const ok =
        payload?.status === true ||
        payload?.status === 1 ||
        payload?.status === '1' ||
        payload?.status === 'true';

      console.log('[SendMessage] backend response', {
        httpStatus: res?.status,
        success: ok,
        data: payload,
      });

      if (ok) {
  console.log('[SendMessage] success — message accepted by server');

  setMessage('');
  setFile(null);
  await fetchMessages();
}else {
        const msg =
          payload?.message ||
          payload?.msg ||
          payload?.error ||
          'Failed to send message';
        console.log('[SendMessage] failed — server returned success=false', {
          reason: msg,
          raw: payload,
        });
        showAlert('Error', String(msg));
      }
    } catch (error) {
      console.log('[SendMessage] request error (network or HTTP error)', {
        message: error?.message,
        httpStatus: error?.response?.status,
        responseData: error?.response?.data,
      });
      const apiMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;
      showAlert('Error', apiMsg ? String(apiMsg) : 'Something went wrong');
    } finally {
      setSending(false);
    }
  };

const pickFile = async () => {
  try {
    const result = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
      includeBase64: false,
    });

    if (result.didCancel) return;

    if (result.assets && result.assets.length > 0) {
      const picked = result.assets[0];

      setFile({
        uri: picked.uri,
        type: picked.type,
        fileName: picked.fileName,
      });
    }
  } catch (err) {
    console.log('Image picker error:', err);
  }
};
const scrollToBottom = () => {
  requestAnimationFrame(() => {
    listRef.current?.scrollToEnd({ animated: true });
  });
};
  const renderBubble = ({ item }) => <ChatBubble item={item} />;

  const chatTitle =
    receiver?.name ||
    (norm(receiver?.type).includes('admin') ? 'Admin' : 'Class Teacher');

  const avatarUri = receiverAvatarUri(receiver);
  const showAvatarImage = Boolean(avatarUri) && !headerAvatarFailed;
  const placeholderIcon = receiverHeaderPlaceholderIcon(receiver);

  const chatInner = (
    <>
      <LinearGradient
        colors={['#FF9800', '#FFC107', '#FFEB3B']}
        style={styles.chatHeader}
      >
        <SafeAreaView edges={['top']} style={styles.chatHeaderSafe}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="arrow-back" size={24} color={colors.black} />
          </TouchableOpacity>
          {showAvatarImage ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.chatHeaderAvatar}
              resizeMode="cover"
              onError={() => setHeaderAvatarFailed(true)}
            />
          ) : (
            <View style={styles.chatHeaderAvatarPlaceholder}>
              <Icon
                name={placeholderIcon}
                size={22}
                color={colors.orange}
              />
            </View>
          )}
          <View style={styles.chatHeaderTextCol}>
            <Text style={styles.chatHeaderTitle}>{chatTitle}</Text>
            <Text style={styles.chatHeaderSub} numberOfLines={1}>
              {norm(receiver?.type) || 'Message'}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.chatBody}>
        {historyLoading ? (
          <View style={styles.historyLoader}>
            <ActivityIndicator size="small" color={colors.orange} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderBubble}
            contentContainerStyle={styles.listContent}
            keyboardDismissMode="none"
            keyboardShouldPersistTaps="always"
            onContentSizeChange={scrollToBottom}
            ListEmptyComponent={
              <Text style={styles.emptyHistory}>
                No messages yet. Say hello below.
              </Text>
            }
            onScroll={(e) => {
  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;

  const isNearBottom =
    layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

  setShowScrollBtn(!isNearBottom);
}}
scrollEventThrottle={16}
          />
        )}
      </View>
      {showScrollBtn && (
  <TouchableOpacity
    style={{
      position: 'absolute',
      right: 20,
      bottom: 110,
      backgroundColor: colors.orange,
      width: 45,
      height: 45,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    }}
    onPress={scrollToBottom}
  >
    <Icon name="arrow-down" size={24} color="#fff" />
  </TouchableOpacity>
)}

      {file?.uri ? (
        <View style={styles.pendingFile}>
          {file.type?.startsWith('image') ? (
            <Image
              source={{ uri: file.uri }}
              style={styles.pendingThumb}
            />
          ) : null}
          <Text style={styles.pendingFileText} numberOfLines={1}>
            {file.fileName || file.name || 'Attachment'}
          </Text>
          <TouchableOpacity onPress={() => setFile(null)}>
            <Text style={styles.pendingRemove}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <SafeAreaView edges={['bottom']} style={styles.inputBar}>
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={pickFile}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="attach-outline" size={24} color={colors.gray2} />
        </TouchableOpacity>
        <TextInput
  style={styles.chatInput}
  placeholder="Message"
  placeholderTextColor={colors.placeholder}
  multiline
  value={message}
  onChangeText={setMessage}
 onFocus={scrollToBottom}
/>
        <TouchableOpacity
          style={[styles.sendRound, sending && { opacity: 0.6 }]}
          onPress={sendMessage}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Icon name="send" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.chatWrap}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={
  Platform.OS === 'ios'
    ? insets.top
    : 0  
}
    >
      {chatInner}
    </KeyboardAvoidingView>
  );
}

const Message = () => {
  const navigation = useNavigation();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [adminReceiver, setAdminReceiver] = useState(null);
  const [teacherReceiver, setTeacherReceiver] = useState(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState(null);

  const [alert, setAlert] = useState(initialAlert);

  const showAlert = useCallback(
    (
      title,
      messageText,
      iconName = 'log-out-outline',
      iconColor = '#e74c3c',
    ) => {
      setAlert({
        visible: true,
        title,
        message: messageText,
        iconName,
        iconColor,
      });
    },
    [],
  );

  const fetchStudentProfile = useCallback(async () => {
    try {
      const { jwt, studentId } = await getAuthContext();
      if (!studentId || !jwt) return;

      const response = await studentApi.post('profile_detail.php', {
        studentid: studentId,
      });
      if (response?.data?.status === true) setStudent(response.data.data);

      const receiverRes = await studentApi.post('get_receiver.php', {
        studentid: studentId,
      });
      if (receiverRes?.data?.status === true) {
        const list = receiverRes.data.receivers || [];
        const { admin, teacher } = resolveAdminAndTeacher(list);
        setAdminReceiver(admin);
        setTeacherReceiver(teacher);
      }
    } catch (error) {
      console.log('Message Screen Error:', error);
      showAlert('Error', 'Failed to fetch profile/receivers');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchStudentProfile();
  }, [fetchStudentProfile]);

  const openChat = (receiver) => {
    if (!receiver) {
      showAlert('Unavailable', 'This contact is not available right now.');
      return;
    }
    setSelectedReceiver(receiver);
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
    setSelectedReceiver(null);
  };
  useEffect(() => {
  const backAction = () => {
    if (chatOpen) {
      setChatOpen(false);
      setSelectedReceiver(null);
      return true;
    }

    return false;
  };

  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    backAction
  );

  return () => backHandler.remove();
}, [chatOpen]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <FullScreenLoader visible={loading} />

        {!chatOpen ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
              <MessageLandingHeader student={student} navigation={navigation} />

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.landingContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.messageHeadingRow}>
                  <View style={styles.messageHeadingIcon}>
                    <Icon name="chatbubble" size={29} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.screenTitle}>Messages</Text>
                    <Text style={styles.screenSubtitle}>
                      Choose who you want to chat with
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.channelCard, styles.adminCard]}
                  onPress={() => openChat(adminReceiver)}
                  activeOpacity={0.85}
                  disabled={!adminReceiver}
                >
                  <View style={styles.cardBlobTop} />
                  <View style={styles.cardBlobBottom} />
                  <View style={[styles.channelIconWrap, styles.adminIconWrap]}>
                    <Icon name="shield-checkmark" size={42} color="#ff9e00" />
                  </View>
                  <View style={styles.channelContent}>
                    <Text style={styles.channelTitle}>School Admin</Text>
                    <Text style={styles.channelRole}>
                      {adminReceiver?.type || 'Admin'}
                    </Text>
                    <Text style={styles.channelHint} numberOfLines={3}>
                      Get updates, general queries{`\n`}and support from school admin
                    </Text>
                  </View>
                  <View style={[styles.cardArrow, styles.adminArrow]}>
                    <Icon name="chevron-forward" size={36} color="#53555b" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.channelCard, styles.teacherCard]}
                  onPress={() => openChat(teacherReceiver)}
                  activeOpacity={0.85}
                  disabled={!teacherReceiver}
                >
                  <View style={styles.cardBlobTop} />
                  <View style={styles.cardBlobBottom} />
                  <View style={[styles.channelIconWrap, styles.teacherIconWrap]}>
                    <Icon name="school" size={42} color="#ff9e00" />
                  </View>
                  <View style={styles.channelContent}>
                    <Text style={styles.channelTitle}>Class Teacher</Text>
                    <Text style={styles.channelRole} numberOfLines={1}>
                      {teacherReceiver?.name || 'Your class teacher'}
                    </Text>
                    <Text style={styles.channelHint} numberOfLines={3}>
                      Chat with your class teacher{`\n`}about your studies, homework{`\n`}and class activities
                    </Text>
                  </View>
                  <View style={[styles.cardArrow, styles.teacherArrow]}>
                    <Icon name="chevron-forward" size={36} color="#53555b" />
                  </View>
                </TouchableOpacity>

                <View style={styles.connectionNote}>
                  <View style={styles.connectionArt}>
                    <Icon name="chatbubble-ellipses" size={92} color="#d8f0ff" />
                    <Icon name="chatbubble" size={62} color="#fff0dc" style={styles.connectionReply} />
                  </View>
                  <Text style={styles.connectionText}>
                    Stay connected with your school.{`\n`}Ask doubts, get updates and more.
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.bottomNavWrapper}>
                <BottomNavigator variant="messages" />
              </View>
            </View>
          </TouchableWithoutFeedback>
        ) : selectedReceiver ? (
          <MessageChatPanel
            key={String(selectedReceiver.id)}
            receiver={selectedReceiver}
            onBack={() => {
  setChatOpen(false);
  setSelectedReceiver(null);
}}
            showAlert={showAlert}
          />
        ) : null}

        <AppAlertModal
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          iconName={alert.iconName}
          iconColor={alert.iconColor}
          onConfirm={() => setAlert((a) => ({ ...a, visible: false }))}
          confirmText="OK"
        />
      </View>
    </View>
  );
};

export default Message;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fbff' },
  bottomNavWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    shadowColor: '#5573a0', shadowOpacity: 0.11, shadowRadius: 18,
    shadowOffset: { width: 0, height: -5 }, elevation: 12,
  },
  messageHeader: {
    height: 110, paddingHorizontal: 21, paddingBottom: 10,
    borderBottomLeftRadius: 29, borderBottomRightRadius: 29, overflow: 'hidden',
  },
  headerGlowLeft: {
    position: 'absolute', width: 61, height: 61, borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.10)', left: -26, top: 4,
  },
  headerGlowRight: {
    position: 'absolute', width: 82, height: 82, borderRadius: 41,
    backgroundColor: 'rgba(255,255,255,0.12)', right: -33, bottom: -37,
  },
  messageHeaderRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end' },
  messageStudentPhotoWrap: {
    width: 60, height: 60, borderRadius: 30, padding: 3, backgroundColor: '#fff',
    shadowColor: '#a26d00', shadowOpacity: 0.14, shadowRadius: 6, elevation: 4,
  },
  messageStudentPhoto: { width: '100%', height: '100%', borderRadius: 27 },
  messageHeaderText: { flex: 1, marginLeft: 13, paddingBottom: 5 },
  messageStudentName: { color: '#07133f', fontSize: 19, fontWeight: '800' },
  messageStudentClass: { color: '#53617d', fontSize: 12, fontWeight: '500', marginTop: 4 },
  messageNotificationBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginLeft: 6, marginBottom: 5,
    shadowColor: '#a77e19', shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
  },
  messageBadge: {
    position: 'absolute', top: 4, right: 4, minWidth: 10, height: 10,
    paddingHorizontal: 2, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4343',
  },
  messageBadgeText: { color: '#fff', fontSize: 6, fontWeight: '800' },
  landingContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 75 },
  messageHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  messageHeadingIcon: {
    width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1689eb', marginRight: 13,
    shadowColor: '#1689eb', shadowOpacity: 0.22, shadowRadius: 8, elevation: 4,
  },
  screenTitle: {
    fontSize: 20, fontWeight: '800', color: '#081343', marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 12, color: '#64718b', fontWeight: '400',
  },
  channelCard: {
    minHeight: 132, flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
    borderRadius: 17, paddingHorizontal: 22, marginBottom: 16,
    shadowColor: '#6d85a3', shadowOpacity: 0.17, shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 }, elevation: 7,
  },
  adminCard: { backgroundColor: '#fffdfb' },
  teacherCard: { backgroundColor: '#fbfdff' },
  cardBlobTop: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    right: -34, top: -46, backgroundColor: 'rgba(255, 199, 123, 0.23)',
  },
  cardBlobBottom: {
    position: 'absolute', width: 110, height: 65, borderTopRightRadius: 60,
    left: -25, bottom: -29, backgroundColor: 'rgba(255, 204, 137, 0.19)',
  },
  channelIconWrap: {
    width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginRight: 18,
  },
  adminIconWrap: { backgroundColor: '#fff0dd' },
  teacherIconWrap: { backgroundColor: '#e2f3ff' },
  channelContent: { flex: 1, zIndex: 1 },
  channelTitle: {
    fontSize: 17, fontWeight: '800', color: '#081343',
  },
  channelRole: {
    fontSize: 13, color: '#65718a', fontWeight: '500', marginTop: 3,
  },
  channelHint: {
    fontSize: 11, lineHeight: 15, color: '#65718a', marginTop: 8,
  },
  cardArrow: {
    width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 6, zIndex: 1,
  },
  adminArrow: { backgroundColor: '#fff1e2' },
  teacherArrow: { backgroundColor: '#e2f3ff' },
  connectionNote: { alignItems: 'center', marginTop: 65, paddingBottom: 24 },
  connectionArt: { width: 115, height: 87, justifyContent: 'center', alignItems: 'center' },
  connectionReply: { position: 'absolute', right: 7, bottom: 7 },
  connectionText: { color: '#72809b', textAlign: 'center', fontSize: 11, lineHeight: 15 },
  chatWrap: { flex: 1, backgroundColor: WA_BG },
  chatHeader: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  chatHeaderSafe: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  backBtn: { padding: 8 },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  chatHeaderAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderTextCol: {
    flex: 1,
    minWidth: 0,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  chatHeaderSub: {
    fontSize: 12,
    color: colors.subtitle,
    marginTop: 2,
  },
  chatBody: { flex: 1 },
  historyLoader: {
    paddingTop: 24,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    paddingBottom: 30,
    flexGrow: 1,
  },
  emptyHistory: {
    textAlign: 'center',
    color: colors.subtitle,
    marginTop: 40,
    fontSize: 14,
  },
  bubbleRow: {
    marginBottom: 8,
    maxWidth: '88%',
  },
  bubbleRowOut: {
    alignSelf: 'flex-end',
  },
  bubbleRowIn: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    elevation: 1,
    shadowColor: colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  bubbleText: {
    fontSize: 15,
    color: '#222',
  },
  bubbleTime: {
    fontSize: 11,
    color: colors.subtitle,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  bubbleImage: {
    width: 200,
    height: 140,
    borderRadius: 8,
    marginBottom: 6,
    resizeMode: 'cover',
  },
  bubbleFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 220,
    marginBottom: 6,
    paddingVertical: 4,
  },
  bubbleFileText: {
    flex: 1,
    fontSize: 14,
    color: colors.blue,
    fontWeight: '500',
  },
inputBar: {
  flexDirection: 'row',
  alignItems: 'center', 
  paddingHorizontal: 10,
  paddingTop: 6,
  paddingBottom: 6, // FIX: prevent white gap
  backgroundColor: '#f0f0f0',
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: colors.border,
},
  chatInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 6,
    fontSize: 15,
    color: '#222',
  },
  attachBtn: {
    padding: 6,
  },
sendRound: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: colors.orange,
  justifyContent: 'center',
  alignItems: 'center',
},
  pendingFile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e8e8e8',
  },
  pendingThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 8,
  },
  pendingFileText: { flex: 1, fontSize: 13, color: colors.gray2 },
  pendingRemove: { color: colors.orange, fontWeight: '600', fontSize: 13 },
});
