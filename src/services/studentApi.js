import axios from 'axios';
import { studentapi } from '../screens/Api';
import { getAuthContext, getJwt } from './appStorage';

/**
 * All student API calls: base URL + Bearer JWT from storage (when present).
 * Use relative paths like `profile_detail.php` (base already ends with `/`).
 */
export const studentApi = axios.create({
  baseURL: studentapi,
  headers: {
    'Content-Type': 'application/json',
  },
});

studentApi.interceptors.request.use(async (config) => {
  const jwt = await getJwt();
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  // Default axios Content-Type is application/json; multipart must omit the
  // header so RN sets multipart/form-data with a boundary. AxiosHeaders needs
  // `false` to clear the default — plain `delete` often leaves JSON and breaks uploads.
  if (config.data instanceof FormData) {
    if (config.headers?.set) {
      config.headers.set('Content-Type', false);
    } else {
      config.headers['Content-Type'] = false;
    }
  }
  return config;
});

export async function fetchStudentProfileDetail() {
  const { jwt, studentId } = await getAuthContext();
  if (!jwt || studentId == null) return null;
  const response = await studentApi.post('profile_detail.php', {
    studentid: studentId,
  });
  if (response?.data?.status === true) {
    return response.data.data;
  }
  return null;
}
