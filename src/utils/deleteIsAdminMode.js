// Firebase에서 isAdminMode 문서 삭제 유틸리티
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase-config';
import { initializeApp } from 'firebase/app';

export async function deleteIsAdminModeFromFirebase() {
  if (!firebaseConfig) {
    console.log('Firebase 설정이 없습니다.');
    return false;
  }

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const docRef = doc(db, 'attendanceApp', 'isAdminMode');
    await deleteDoc(docRef);
    console.log('✅ Firebase에서 isAdminMode 문서 삭제 완료');
    return true;
  } catch (error) {
    console.error('❌ isAdminMode 삭제 오류:', error);
    return false;
  }
}

