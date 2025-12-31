import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadFromStorageSync, saveToStorage, migrateData } from '../utils/storage';

const AppContext = createContext();

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function AppProvider({ children }) {
  
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


  // 학생 목록 저장
  useEffect(() => {
    saveToStorage('students', students);
  }, [students]);

  // 출석 기록 저장
  useEffect(() => {
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


