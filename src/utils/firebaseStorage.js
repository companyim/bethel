import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase-config';

let db = null;
let isInitialized = false;

// Firebase 초기화
function initFirebase() {
  console.log('initFirebase 호출됨, isInitialized:', isInitialized);
  
  if (isInitialized) {
    console.log('이미 초기화됨, db 반환');
    return db;
  }
  
  if (!firebaseConfig) {
    console.log('Firebase 설정이 없습니다. LocalStorage를 사용합니다.');
    return null;
  }

  console.log('Firebase 초기화 시도...', firebaseConfig.projectId);
  
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isInitialized = true;
    console.log('✅ Firebase가 초기화되었습니다!');
    return db;
  } catch (error) {
    console.error('❌ Firebase 초기화 오류:', error);
    console.error('오류 상세:', error.message, error.code);
    return null;
  }
}

// Firebase에서 데이터 읽기 (null 반환 = 데이터 없음, defaultValue = 기본값)
export async function loadFromFirebase(key, defaultValue = null) {
  const firestore = initFirebase();
  if (!firestore) {
    console.log(`Firebase가 초기화되지 않았습니다. ${key} 로드 불가.`);
    return null; // Firebase가 없으면 null 반환 (데이터 없음을 의미)
  }

  try {
    const docRef = doc(firestore, 'attendanceApp', key);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data().value;
      console.log(`Firebase에서 ${key} 로드 완료:`, data);
      return data;
    }
    console.log(`Firebase에 ${key} 데이터가 없습니다.`);
    return null; // 데이터가 없으면 null 반환
  } catch (error) {
    console.error(`Error loading ${key} from Firebase:`, error);
    console.error('Error details:', error.message, error.code);
    return null; // 오류 시 null 반환
  }
}

// Firebase에 데이터 쓰기
export async function saveToFirebase(key, value) {
  const firestore = initFirebase();
  if (!firestore) {
    console.log(`Firebase가 초기화되지 않았습니다. ${key} 저장 불가.`);
    return false;
  }

  try {
    const docRef = doc(firestore, 'attendanceApp', key);
    await setDoc(docRef, { value }, { merge: true });
    console.log(`Firebase에 ${key} 저장 완료`);
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to Firebase:`, error);
    console.error('Error details:', error.message, error.code);
    return false;
  }
}

// Firebase 실시간 구독 (데이터 변경 감지)
export function subscribeToFirebase(key, callback) {
  const firestore = initFirebase();
  if (!firestore) return () => {};

  try {
    const docRef = doc(firestore, 'attendanceApp', key);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data().value);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Error subscribing to ${key}:`, error);
    });

    return unsubscribe;
  } catch (error) {
    console.error(`Error subscribing to ${key}:`, error);
    return () => {};
  }
}

