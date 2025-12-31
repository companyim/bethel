import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getSundays2026, formatDate } from '../utils/dateUtils';
import { formatTalentDisplay } from '../utils/talentUtils';

function AttendanceCheck() {
  const { students, attendanceData, addAttendanceRecord, awardTalent, isAdminMode, setAttendanceData } = useApp();
  const [checkMode, setCheckMode] = useState('grade'); // 'grade' or 'department'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState({});
  
  const sundays = getSundays2026();

  // 선택된 날짜의 기존 출석 기록 로드
  useEffect(() => {
    if (selectedDate) {
      const records = attendanceData.filter(r => r.date === selectedDate);
      const status = {};
      records.forEach(record => {
        const key = `${record.student}_${String(record.grade)}`;
        status[key] = record.status;
      });
      setAttendanceStatus(status);
    } else {
      setAttendanceStatus({});
    }
  }, [selectedDate, attendanceData]);

  // 관리자 모드가 아니면 렌더링하지 않음 (모든 훅 호출 후)
  if (!isAdminMode) return null;

  // 학년별 또는 부서별 필터링된 학생 목록
  let filteredStudents = students;
  
  if (checkMode === 'grade') {
    // 학년별 필터링
    if (selectedGrade) {
      filteredStudents = filteredStudents.filter(s => String(s.grade) === selectedGrade);
    }
  } else {
    // 부서별 필터링
    if (selectedDepartment) {
      filteredStudents = filteredStudents.filter(s => s.department === selectedDepartment);
    }
  }

  const handleStatusChange = (studentName, studentGrade, status) => {
    const key = `${studentName}_${String(studentGrade)}`;
    setAttendanceStatus(prev => ({
      ...prev,
      [key]: status
    }));
  };

  const handleSave = () => {
    if (!selectedDate) {
      alert('날짜를 선택해주세요.');
      return;
    }

    if (checkMode === 'grade' && !selectedGrade) {
      alert('학년을 선택해주세요.');
      return;
    }

    if (checkMode === 'department' && !selectedDepartment) {
      alert('부서를 선택해주세요.');
      return;
    }

    if (filteredStudents.length === 0) {
      alert('해당 조건에 등록된 학생이 없습니다.');
      return;
    }

    // 해당 날짜와 조건의 기존 기록 삭제
    setAttendanceData(prev => 
      prev.filter(r => {
        if (r.date !== selectedDate) return true;
        if (checkMode === 'grade' && selectedGrade && String(r.grade) !== selectedGrade) return true;
        if (checkMode === 'department' && selectedDepartment && r.department !== selectedDepartment) return true;
        return false;
      })
    );

    // 새로운 출석 기록 추가 및 달란트 지급
    filteredStudents.forEach(student => {
      const key = `${student.name}_${String(student.grade)}`;
      const status = attendanceStatus[key] || 'present';
      const talentEarned = status === 'present';
      
      addAttendanceRecord(selectedDate, student.name, student.grade, status, talentEarned, student.department || '');
      
      // 출석한 경우 달란트 지급
      if (talentEarned) {
        awardTalent(student.name, student.grade);
      }
    });

    alert('출석이 저장되었습니다.');
  };

  // 모드 변경 시 필터 초기화
  const handleModeChange = (mode) => {
    setCheckMode(mode);
    setSelectedGrade('');
    setSelectedDepartment('');
    setAttendanceStatus({});
  };

  return (
    <section className="section attendance-check">
      <h2>출석 체크</h2>

      {/* 탭 버튼 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
        <button
          onClick={() => handleModeChange('grade')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: checkMode === 'grade' ? '#4CAF50' : 'transparent',
            color: checkMode === 'grade' ? 'white' : '#666',
            cursor: 'pointer',
            borderBottom: checkMode === 'grade' ? '3px solid #4CAF50' : '3px solid transparent',
            fontWeight: checkMode === 'grade' ? 'bold' : 'normal'
          }}
        >
          학년별 출석 체크
        </button>
        <button
          onClick={() => handleModeChange('department')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: checkMode === 'department' ? '#4CAF50' : 'transparent',
            color: checkMode === 'department' ? 'white' : '#666',
            cursor: 'pointer',
            borderBottom: checkMode === 'department' ? '3px solid #4CAF50' : '3px solid transparent',
            fontWeight: checkMode === 'department' ? 'bold' : 'normal'
          }}
        >
          부서별 출석 체크
        </button>
      </div>

      <div className="attendance-controls">
        <div className="form-group">
          <label>날짜 선택 (2026년 일요일)</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-select"
          >
            <option value="">날짜를 선택하세요</option>
            {sundays.map(date => (
              <option key={date} value={date}>
                {formatDate(date)}
              </option>
            ))}
          </select>
        </div>

        {checkMode === 'grade' ? (
          <div className="form-group">
            <label>학년 필터 (필수)</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="grade-select"
            >
              <option value="">학년을 선택하세요</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="4">4학년</option>
              <option value="5">5학년</option>
              <option value="6">6학년</option>
              <option value="유치부">유치부</option>
              <option value="첫영성체">첫영성체</option>
            </select>
          </div>
        ) : (
          <div className="form-group">
            <label>부서 필터 (필수)</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="department-select"
            >
              <option value="">부서를 선택하세요</option>
              <option value="성가대">성가대</option>
              <option value="복음퀴즈부">복음퀴즈부</option>
              <option value="율동부">율동부</option>
              <option value="전례부">전례부</option>
            </select>
          </div>
        )}
      </div>

      {filteredStudents.length > 0 && selectedDate ? (
        <>
          <div className="student-attendance-list">
            {filteredStudents.map((student, idx) => {
              const key = `${student.name}_${String(student.grade)}`;
              const currentStatus = attendanceStatus[key] || 'present';
              
              return (
                <div key={`${student.name}-${student.grade}-${idx}`} className="student-attendance-item">
                  <span className="student-name">
                    {formatTalentDisplay(student.name, student.baptismName, student.talent || 0, student.department || '')}
                  </span>
                  <div className="attendance-buttons">
                    <button
                      onClick={() => handleStatusChange(student.name, student.grade, 'present')}
                      className={currentStatus === 'present' ? 'btn-present active' : 'btn-present'}
                    >
                      출석
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.name, student.grade, 'absent')}
                      className={currentStatus === 'absent' ? 'btn-absent active' : 'btn-absent'}
                    >
                      결석
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={handleSave} className="btn-primary" style={{ marginTop: '20px' }}>
            출석 저장
          </button>
        </>
      ) : (
        <div className="empty-message">
          {!selectedDate ? '날짜를 선택해주세요.' : 
           (checkMode === 'grade' && !selectedGrade) ? '학년을 선택해주세요.' :
           (checkMode === 'department' && !selectedDepartment) ? '부서를 선택해주세요.' :
           '해당 조건에 등록된 학생이 없습니다.'}
        </div>
      )}
    </section>
  );
}

export default AttendanceCheck;

