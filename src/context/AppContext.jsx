import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const isUpdatingFromFirebase = useRef(false); // Firebase 업데이트 중 무한 루프 방지

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
    if (!useFirebase) return;

    let unsubscribes = [];

    // Firebase에서 초기 데이터 로드
    const loadInitialData = async () => {
      isUpdatingFromFirebase.current = true;
      try {
        // 학생 데이터 로드
        const firebaseStudents = await loadFromStorage('students', null);
        if (firebaseStudents !== null && Array.isArray(firebaseStudents)) {
          setStudents(migrateData(firebaseStudents));
        }

        // 출석 기록 로드
        const firebaseAttendance = await loadFromStorage('attendanceData', null);
        if (firebaseAttendance !== null && Array.isArray(firebaseAttendance)) {
          setAttendanceData(firebaseAttendance);
        }

        // 관리자 비밀번호 로드
        const firebasePassword = await loadFromStorage('adminPassword', null);
        if (firebasePassword !== null) {
          setAdminPassword(firebasePassword);
        }
      } catch (error) {
        console.error('Firebase 초기 로드 오류:', error);
      } finally {
        isUpdatingFromFirebase.current = false;
      }
    };

    loadInitialData();

    // 실시간 구독 설정
    const unsubscribeStudents = subscribeToFirebase('students', (data) => {
      if (!isUpdatingFromFirebase.current && data !== null && Array.isArray(data)) {
        isUpdatingFromFirebase.current = true;
        setStudents(migrateData(data));
        setTimeout(() => {
          isUpdatingFromFirebase.current = false;
        }, 100);
      }
    });

    const unsubscribeAttendance = subscribeToFirebase('attendanceData', (data) => {
      if (!isUpdatingFromFirebase.current && data !== null && Array.isArray(data)) {
        isUpdatingFromFirebase.current = true;
        setAttendanceData(data);
        setTimeout(() => {
          isUpdatingFromFirebase.current = false;
        }, 100);
      }
    });

    const unsubscribePassword = subscribeToFirebase('adminPassword', (data) => {
      if (!isUpdatingFromFirebase.current && data !== null) {
        isUpdatingFromFirebase.current = true;
        setAdminPassword(data);
        setTimeout(() => {
          isUpdatingFromFirebase.current = false;
        }, 100);
      }
    });

    unsubscribes = [unsubscribeStudents, unsubscribeAttendance, unsubscribePassword];

    // 클린업
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [useFirebase]);

  // 학생 목록 저장
  useEffect(() => {
    if (!isUpdatingFromFirebase.current) {
      saveToStorage('students', students);
    }
  }, [students]);

  // 출석 기록 저장
  useEffect(() => {
    if (!isUpdatingFromFirebase.current) {
      saveToStorage('attendanceData', attendanceData);
    }
  }, [attendanceData]);

  // 관리자 모드는 Firebase에 저장하지 않음 (보안상)
  // LocalStorage에만 저장 (세션 유지용)
  useEffect(() => {
    if (isAdminMode) {
      localStorage.setItem('isAdminMode', JSON.stringify(true));
    } else {
      localStorage.removeItem('isAdminMode');
    }
  }, [isAdminMode]);

  // 관리자 비밀번호 저장
  useEffect(() => {
    if (adminPassword && !isUpdatingFromFirebase.current) {
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

