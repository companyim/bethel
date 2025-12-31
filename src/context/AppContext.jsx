import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadFromStorage, loadFromStorageSync, saveToStorage, migrateData } from '../utils/storage';
import { subscribeToFirebase } from '../utils/firebaseStorage';
import { firebaseConfig } from '../config/firebase-config';

const AppContext = createContext();

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function AppProvider({ children }) {
  const useFirebase = firebaseConfig !== null;
  
  // 디버깅: 즉시 로그 출력 (useEffect 전에)
  console.log('=== AppProvider 렌더링 ===');
  console.log('firebaseConfig:', firebaseConfig);
  console.log('useFirebase:', useFirebase);
  
  // 디버깅: Firebase 설정 확인
  useEffect(() => {
    console.log('=== AppProvider useEffect 실행 ===');
    console.log('Firebase 설정:', firebaseConfig ? '있음' : '없음');
    console.log('useFirebase:', useFirebase);
  }, [useFirebase]);
  
  // 학생 목록 (초기값은 LocalStorage에서)
  const [students, setStudents] = useState(() => {
    const loaded = loadFromStorageSync('students', []);
    return migrateData(loaded);
  });

  // 출석 기록 (초기값은 LocalStorage에서)
  const [attendanceData, setAttendanceData] = useState(() => {
    return loadFromStorageSync('attendanceData', []);
  });

  // 관리자 모드 (항상 false로 시작 - 보안상 로그인해야만 관리자 모드)
  const [isAdminMode, setIsAdminMode] = useState(false);

  // 관리자 비밀번호 (초기값은 LocalStorage에서)
  const [adminPassword, setAdminPassword] = useState(() => {
    return loadFromStorageSync('adminPassword', null);
  });

  // Firebase 초기 로드 및 실시간 동기화
  useEffect(() => {
    if (!useFirebase) {
      console.log('Firebase가 설정되지 않았습니다. LocalStorage만 사용합니다.');
      return;
    }

    let unsubscribes = [];
    let isInitialLoadComplete = false;

    // 초기 로드 및 마이그레이션
    const loadInitialData = async () => {
      try {
        console.log('=== Firebase 초기 데이터 로딩 시작 ===');
        
        // Firebase에서 데이터 가져오기
        const [firebaseStudents, firebaseAttendance, firebasePassword] = await Promise.all([
          loadFromStorage('students', null),
          loadFromStorage('attendanceData', null),
          loadFromStorage('adminPassword', null)
        ]);

        console.log('Firebase에서 로드된 데이터:', {
          students: firebaseStudents?.length || 0,
          attendance: firebaseAttendance?.length || 0,
          hasPassword: firebasePassword !== null
        });

        // LocalStorage에서 데이터 가져오기
        const localStudents = loadFromStorageSync('students', []);
        const localAttendance = loadFromStorageSync('attendanceData', []);
        const localPassword = loadFromStorageSync('adminPassword', null);

        // Firebase 데이터가 있으면 우선 사용, 없으면 LocalStorage 사용 후 Firebase에 업로드
        if (firebaseStudents !== null && Array.isArray(firebaseStudents)) {
          console.log('Firebase에서 학생 데이터 사용:', firebaseStudents.length, '명');
          setStudents(migrateData(firebaseStudents));
        } else if (localStudents.length > 0) {
          console.log('LocalStorage 학생 데이터를 Firebase에 업로드합니다...', localStudents.length, '명');
          const migrated = migrateData(localStudents);
          setStudents(migrated);
          await saveToStorage('students', migrated);
        }

        if (firebaseAttendance !== null && Array.isArray(firebaseAttendance)) {
          console.log('Firebase에서 출석 데이터 사용:', firebaseAttendance.length, '건');
          setAttendanceData(firebaseAttendance);
        } else if (localAttendance.length > 0) {
          console.log('LocalStorage 출석 데이터를 Firebase에 업로드합니다...', localAttendance.length, '건');
          setAttendanceData(localAttendance);
          await saveToStorage('attendanceData', localAttendance);
        }

        // 관리자 비밀번호는 Firebase에서 로드
        if (firebasePassword !== null) {
          console.log('Firebase에서 관리자 비밀번호 로드됨');
          setAdminPassword(firebasePassword);
        } else if (localPassword !== null) {
          console.log('LocalStorage 관리자 비밀번호를 Firebase에 업로드합니다...');
          setAdminPassword(localPassword);
          await saveToStorage('adminPassword', localPassword);
        }

        isInitialLoadComplete = true;
        console.log('=== Firebase 초기 데이터 로딩 완료 ===');

        // 초기 로드 완료 후 실시간 동기화 구독 시작
        console.log('실시간 동기화 구독 시작...');
        
        unsubscribes.push(subscribeToFirebase('students', (data) => {
          if (isInitialLoadComplete && data !== null && Array.isArray(data) && data.length > 0) {
            console.log('🔄 Firebase에서 students 실시간 업데이트:', data.length, '명');
            isUpdatingFromFirebase.current.students = true;
            setStudents(migrateData(data));
          } else if (isInitialLoadComplete && data !== null && Array.isArray(data) && data.length === 0) {
            console.log('⚠️ Firebase에서 빈 students 배열 수신, 무시합니다.');
          }
        }));

        unsubscribes.push(subscribeToFirebase('attendanceData', (data) => {
          if (isInitialLoadComplete && data !== null && Array.isArray(data)) {
            console.log('🔄 Firebase에서 attendanceData 실시간 업데이트:', data.length, '건');
            isUpdatingFromFirebase.current.attendanceData = true;
            setAttendanceData(data);
          }
        }));

        unsubscribes.push(subscribeToFirebase('adminPassword', (data) => {
          if (isInitialLoadComplete && data !== null) {
            console.log('🔄 Firebase에서 adminPassword 실시간 업데이트');
            setAdminPassword(data);
          }
        }));

        console.log('✅ 실시간 동기화 구독 완료');

      } catch (error) {
        console.error('❌ Firebase 초기 로드 오류:', error);
        isInitialLoadComplete = true;
      }
    };

    loadInitialData();

    // 클린업
    return () => {
      console.log('Firebase 구독 해제');
      unsubscribes.forEach(unsub => unsub && unsub());
      unsubscribes = [];
    };
  }, [useFirebase]);

  // Firebase에서 업데이트 중인지 추적 (무한 루프 방지)
  const isUpdatingFromFirebase = React.useRef({ students: false, attendanceData: false });

  // 학생 목록 저장
  useEffect(() => {
    // Firebase에서 업데이트 중이면 저장하지 않음 (무한 루프 방지)
    if (isUpdatingFromFirebase.current.students) {
      isUpdatingFromFirebase.current.students = false;
      return;
    }
    saveToStorage('students', students);
  }, [students]);

  // 출석 기록 저장
  useEffect(() => {
    // Firebase에서 업데이트 중이면 저장하지 않음 (무한 루프 방지)
    if (isUpdatingFromFirebase.current.attendanceData) {
      isUpdatingFromFirebase.current.attendanceData = false;
      return;
    }
    saveToStorage('attendanceData', attendanceData);
  }, [attendanceData]);

  // 관리자 모드는 Firebase에 저장하지 않음 (보안상)
  // LocalStorage에만 저장 (세션 유지용)
  useEffect(() => {
    if (isAdminMode) {
      // 관리자 모드일 때만 LocalStorage에 저장 (세션 유지)
      localStorage.setItem('isAdminMode', JSON.stringify(true));
    } else {
      // 로그아웃 시 LocalStorage에서 제거
      localStorage.removeItem('isAdminMode');
    }
  }, [isAdminMode]);

  // 관리자 비밀번호 저장
  useEffect(() => {
    if (adminPassword) {
      saveToStorage('adminPassword', adminPassword);
    }
  }, [adminPassword]);

  // 학생 추가
  const addStudent = (name, grade, baptismName = '', department = '') => {
    const newStudent = {
      name,
      grade,
      baptismName,
      department,
      talent: 0
    };
    setStudents(prev => [...prev, newStudent]);
  };

  // 학생 삭제
  const deleteStudent = (name, grade) => {
    setStudents(prev => 
      prev.filter(s => !(s.name === name && String(s.grade) === String(grade)))
    );
  };

  // 출석 기록 추가
  const addAttendanceRecord = (date, student, grade, status, talentEarned = false, department = '') => {
    const newRecord = {
      date,
      student,
      grade,
      department,
      status,
      talentEarned
    };
    setAttendanceData(prev => [...prev, newRecord]);
  };

  // 출석 기록 삭제
  const deleteAttendanceRecord = (date, student, grade) => {
    setAttendanceData(prev =>
      prev.filter(r =>
        !(r.date === date && r.student === student && String(r.grade) === String(grade))
      )
    );
  };

  // 관리자 로그인
  const loginAdmin = (password) => {
    if (!adminPassword) {
      // 최초 로그인 시 비밀번호 설정
      setAdminPassword(password);
      setIsAdminMode(true);
      return true;
    }
    
    if (adminPassword === password) {
      setIsAdminMode(true);
      return true;
    }
    return false;
  };

  // 관리자 로그아웃
  const logoutAdmin = () => {
    setIsAdminMode(false);
  };

  // 비밀번호 변경
  const changePassword = (oldPassword, newPassword) => {
    if (adminPassword === oldPassword) {
      setAdminPassword(newPassword);
      return true;
    }
    return false;
  };

  // 달란트 지급
  const awardTalent = (studentName, studentGrade) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.name === studentName && String(s.grade) === String(studentGrade)) {
          return { ...s, talent: (s.talent || 0) + 1 };
        }
        return s;
      })
    );
  };

  const value = {
    students,
    attendanceData,
    isAdminMode,
    adminPassword,
    addStudent,
    deleteStudent,
    addAttendanceRecord,
    deleteAttendanceRecord,
    loginAdmin,
    logoutAdmin,
    changePassword,
    awardTalent,
    setStudents,
    setAttendanceData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}


