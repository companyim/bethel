// 로컬 스토리지 읽기 (Firebase 비활성화)
export async function loadFromStorage(key, defaultValue = null) {
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

// 로컬 스토리지 쓰기 (Firebase 비활성화)
export async function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
    return false;
  }
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


