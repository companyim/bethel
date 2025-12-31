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

  // 관리자 모드 (초기값은 LocalStorage에서)
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return loadFromStorageSync('isAdminMode', false);
  });

  // 관리자 비밀번호 (초기값은 LocalStorage에서)
  const [adminPassword, setAdminPassword] = useState(() => {
    return loadFromStorageSync('adminPassword', null);
  });

  // Firebase 초기 로드 및 실시간 동기화
  useEffect(() => {
    if (!useFirebase) return;

    let unsubscribes = [];
    let isInitialLoadComplete = false;

    // 초기 로드 및 마이그레이션
    const loadInitialData = async () => {
      try {
        console.log('Firebase 초기 데이터 로딩 시작...');
        
        // Firebase에서 데이터 가져오기
        const [firebaseStudents, firebaseAttendance, firebaseAdminMode, firebasePassword] = await Promise.all([
          loadFromStorage('students', null),
          loadFromStorage('attendanceData', null),
          loadFromStorage('isAdminMode', null),
          loadFromStorage('adminPassword', null)
        ]);

        console.log('Firebase 데이터:', { firebaseStudents, firebaseAttendance, firebaseAdminMode, firebasePassword });

        // LocalStorage에서 데이터 가져오기
        const localStudents = loadFromStorageSync('students', []);
        const localAttendance = loadFromStorageSync('attendanceData', []);
        const localAdminMode = loadFromStorageSync('isAdminMode', false);
        const localPassword = loadFromStorageSync('adminPassword', null);

        // Firebase 데이터가 있으면 우선 사용, 없으면 LocalStorage 사용 후 Firebase에 업로드
        if (firebaseStudents !== null) {
          setStudents(migrateData(firebaseStudents));
        } else if (localStudents.length > 0) {
          console.log('LocalStorage 학생 데이터를 Firebase에 업로드합니다...');
          const migrated = migrateData(localStudents);
          setStudents(migrated);
          await saveToStorage('students', migrated);
        }

        if (firebaseAttendance !== null) {
          setAttendanceData(firebaseAttendance);
        } else if (localAttendance.length > 0) {
          console.log('LocalStorage 출석 데이터를 Firebase에 업로드합니다...');
          setAttendanceData(localAttendance);
          await saveToStorage('attendanceData', localAttendance);
        }

        if (firebaseAdminMode !== null) {
          setIsAdminMode(firebaseAdminMode);
        } else if (localAdminMode !== false) {
          setIsAdminMode(localAdminMode);
          await saveToStorage('isAdminMode', localAdminMode);
        }

        if (firebasePassword !== null) {
          setAdminPassword(firebasePassword);
        } else if (localPassword !== null) {
          setAdminPassword(localPassword);
          await saveToStorage('adminPassword', localPassword);
        }

        isInitialLoadComplete = true;
        console.log('Firebase 초기 데이터 로딩 완료');

        // 초기 로드 완료 후 실시간 동기화 구독 시작
        unsubscribes.push(subscribeToFirebase('students', (data) => {
          if (isInitialLoadComplete && data !== null && Array.isArray(data)) {
            console.log('Firebase에서 students 업데이트 받음:', data);
            setStudents(migrateData(data));
          }
        }));

        unsubscribes.push(subscribeToFirebase('attendanceData', (data) => {
          if (isInitialLoadComplete && data !== null && Array.isArray(data)) {
            console.log('Firebase에서 attendanceData 업데이트 받음:', data);
            setAttendanceData(data);
          }
        }));

        unsubscribes.push(subscribeToFirebase('isAdminMode', (data) => {
          if (isInitialLoadComplete && typeof data === 'boolean') {
            setIsAdminMode(data);
          }
        }));

        unsubscribes.push(subscribeToFirebase('adminPassword', (data) => {
          if (isInitialLoadComplete && data !== null) {
            setAdminPassword(data);
          }
        }));

      } catch (error) {
        console.error('Firebase 초기 로드 오류:', error);
        isInitialLoadComplete = true;
      }
    };

    loadInitialData();

    // 클린업
    return () => {
      unsubscribes.forEach(unsub => unsub && unsub());
      unsubscribes = [];
    };
  }, [useFirebase]);

  // 학생 목록 저장
  useEffect(() => {
    saveToStorage('students', students);
  }, [students]);

  // 출석 기록 저장
  useEffect(() => {
    saveToStorage('attendanceData', attendanceData);
  }, [attendanceData]);

  // 관리자 모드 저장
  useEffect(() => {
    saveToStorage('isAdminMode', isAdminMode);
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


