import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  JWT: 'jwt',
  SL_ID: 'sl_id',
  CHILDREN: 'children',
  SELECTED_STUDENT: 'selectedStudent',
};

export async function getJwt() {
  return AsyncStorage.getItem(STORAGE_KEYS.JWT);
}

export async function setJwt(token) {
  await AsyncStorage.setItem(STORAGE_KEYS.JWT, token);
}

export async function getSlId() {
  return AsyncStorage.getItem(STORAGE_KEYS.SL_ID);
}

export async function getChildrenRaw() {
  return AsyncStorage.getItem(STORAGE_KEYS.CHILDREN);
}

export async function getChildren() {
  const raw = await getChildrenRaw();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getSelectedStudentRaw() {
  return AsyncStorage.getItem(STORAGE_KEYS.SELECTED_STUDENT);
}

export async function getSelectedStudent() {
  const raw = await getSelectedStudentRaw();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setSelectedStudent(student) {
  await AsyncStorage.setItem(
    STORAGE_KEYS.SELECTED_STUDENT,
    JSON.stringify(student),
  );
}

export async function persistLoginSession(payload) {
  const children = payload.children ?? [];
  // AsyncStorage v3 replaces the legacy `multiSet` method with `setMany`.
  await AsyncStorage.setMany({
    [STORAGE_KEYS.JWT]: payload.jwt,
    [STORAGE_KEYS.SL_ID]: payload.sl_id,
    [STORAGE_KEYS.CHILDREN]: JSON.stringify(children),
  });
}

export async function clearSession() {
  await AsyncStorage.clear();
}

export async function clearSelectedStudent() {
  await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_STUDENT);
}

/** JWT + selected student id for authenticated API bodies */
export async function getAuthContext() {
  const jwt = await getJwt();
  const selectedStudent = await getSelectedStudent();
  const studentId =
    selectedStudent &&
    typeof selectedStudent === 'object' &&
    'id' in selectedStudent
      ? selectedStudent.id
      : null;
  return { jwt, studentId, selectedStudent };
}
