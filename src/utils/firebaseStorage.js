import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase-config';

let db = null;
let isInitialized = false;

// Firebase 초기화
function initFirebase() {
  if (isInitialized) return db;
  
  if (!firebaseConfig) {
    return null;
  }

  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isInitialized = true;
    return db;
  } catch (error) {
    console.error('Firebase 초기화 오류:', error);
    return null;
  }
}

// Firebase에서 데이터 읽기 (null 반환 = 데이터 없음)
export async function loadFromFirebase(key, defaultValue = null) {
  const firestore = initFirebase();
  if (!firestore) return null;

  try {
    const docRef = doc(firestore, 'attendanceApp', key);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().value;
    }
    return null;
  } catch (error) {
    console.error(`Error loading ${key} from Firebase:`, error);
    return null;
  }
}

// Firebase에 데이터 쓰기
export async function saveToFirebase(key, value) {
  // isAdminMode는 보안상 Firebase에 저장하지 않음
  if (key === 'isAdminMode') {
    return false;
  }

  const firestore = initFirebase();
  if (!firestore) return false;

  try {
    const docRef = doc(firestore, 'attendanceApp', key);
    await setDoc(docRef, { value }, { merge: true });
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to Firebase:`, error);
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

