import { loadFromFirebase, saveToFirebase } from './firebaseStorage';
import { firebaseConfig } from '../config/firebase-config';

// Firebase 사용 여부 확인
const useFirebase = firebaseConfig !== null;

// 스토리지 읽기 (Firebase 우선, 없으면 LocalStorage)
// null 반환 = Firebase에 데이터 없음, defaultValue = 기본값
export async function loadFromStorage(key, defaultValue = null) {
  if (useFirebase) {
    try {
      const data = await loadFromFirebase(key, defaultValue);
      // Firebase에서 데이터를 가져왔으면 (null이 아니면) LocalStorage에도 저장 (백업)
      if (data !== null) {
        try {
          localStorage.setItem(key, JSON.stringify(data));
          return data;
        } catch (e) {
          // LocalStorage 저장 실패해도 Firebase 데이터는 반환
          return data;
        }
      }
      // Firebase에 데이터가 없으면 (null) LocalStorage 확인
    } catch (error) {
      console.error(`Firebase 로드 실패, LocalStorage 사용:`, error);
    }
  }
  
  // LocalStorage 사용 (Firebase가 없거나 Firebase에 데이터가 없을 때)
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
}

// 동기식 로드 (기존 코드와의 호환성을 위해 유지)
export function loadFromStorageSync(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
}

// 스토리지 쓰기 (Firebase 우선, 없으면 LocalStorage)
// isAdminMode는 보안상 Firebase에 저장하지 않음
export async function saveToStorage(key, value) {
  // 먼저 LocalStorage에 저장 (빠른 반응을 위해)
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
  
  // isAdminMode는 Firebase에 저장하지 않음 (보안상)
  if (key === 'isAdminMode') {
    return true;
  }
  
  // Firebase에도 저장
  if (useFirebase) {
    try {
      await saveToFirebase(key, value);
    } catch (error) {
      console.error(`Error saving ${key} to Firebase:`, error);
      // Firebase 저장 실패해도 LocalStorage는 성공했으므로 true 반환
    }
  }
  
  return true;
}

// 데이터 마이그레이션 (기존 데이터 구조 업데이트)
export function migrateData(students) {
  if (!Array.isArray(students)) return [];
  
  return students.map(student => {
    // talent 필드가 없으면 0으로 초기화
    if (typeof student.talent === 'undefined') {
      student.talent = 0;
    }
    // department 필드가 없으면 빈 문자열로 초기화
    if (typeof student.department === 'undefined') {
      student.department = '';
    }
    return student;
  });
}

