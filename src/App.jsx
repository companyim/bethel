import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import StudentManagement from './components/StudentManagement';
import AttendanceCheck from './components/AttendanceCheck';
import StudentRecordSearch from './components/StudentRecordSearch';
import AdminRecordView from './components/AdminRecordView';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

// AppProvider 내부에서 useApp을 사용하기 위한 래퍼 컴포넌트
function AppContent() {
  const { isAdminMode } = useApp();

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        {/* 학생 모드: 출석 기록 조회만 표시 */}
        <StudentRecordSearch />

        {/* 관리자 모드일 때만 표시되는 컴포넌트들 */}
        {isAdminMode && (
          <>
            <StudentManagement />
            <AttendanceCheck />
            <AdminDashboard />
            <AdminRecordView />
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
