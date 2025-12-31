import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatTalentDisplay } from '../utils/talentUtils';

function StudentManagement() {
  const { students, addStudent, deleteStudent, isAdminMode } = useApp();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('1');
  const [baptismName, setBaptismName] = useState('');
  const [department, setDepartment] = useState('');
  const [filterGrade, setFilterGrade] = useState(''); // 학년 필터

  if (!isAdminMode) return null;

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    
    // 중복 확인
    const exists = students.some(
      s => s.name === name.trim() && String(s.grade) === grade
    );
    
    if (exists) {
      alert('이미 등록된 학생입니다.');
      return;
    }

    addStudent(name.trim(), grade, baptismName.trim(), department);
    setName('');
    setBaptismName('');
    setGrade('1');
    setDepartment('');
  };

  // 학년별로 그룹화
  const studentsByGrade = {};
  students.forEach(student => {
    const gradeKey = String(student.grade);
    if (!studentsByGrade[gradeKey]) {
      studentsByGrade[gradeKey] = [];
    }
    studentsByGrade[gradeKey].push(student);
  });

  // 학년 정렬
  const sortedGrades = Object.keys(studentsByGrade).sort((a, b) => {
    const aNum = parseInt(a) || 999;
    const bNum = parseInt(b) || 999;
    if (aNum !== bNum) return aNum - bNum;
    return a.localeCompare(b);
  });

  // 필터링된 학년 목록
  const displayGrades = !filterGrade
    ? [] // 학년을 선택하지 않으면 빈 배열
    : filterGrade === 'all'
    ? sortedGrades // 전체 학년 선택 시 모든 학년
    : sortedGrades.filter(g => String(g) === filterGrade); // 특정 학년 선택 시 해당 학년만

  return (
    <section className="section student-management">
      <h2>학생 관리</h2>
      
      <div className="grade-filter" style={{ marginBottom: '20px' }}>
        <label>학년 필터: </label>
        <select 
          value={filterGrade} 
          onChange={(e) => setFilterGrade(e.target.value)}
          style={{ padding: '8px', marginLeft: '10px', minWidth: '150px' }}
        >
          <option value="">학년을 선택하세요</option>
          <option value="all">전체 학년</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="4">4학년</option>
          <option value="5">5학년</option>
          <option value="6">6학년</option>
          <option value="첫영성체">첫영성체</option>
          <option value="유치부">유치부</option>
        </select>
      </div>
      
      <div className="student-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="학생 이름"
        />
        <select value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="4">4학년</option>
          <option value="5">5학년</option>
          <option value="6">6학년</option>
          <option value="첫영성체">첫영성체</option>
          <option value="유치부">유치부</option>
        </select>
        <input
          type="text"
          value={baptismName}
          onChange={(e) => setBaptismName(e.target.value)}
          placeholder="세례명 (선택)"
        />
        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">부서 선택</option>
          <option value="성가대">성가대</option>
          <option value="복음퀴즈부">복음퀴즈부</option>
          <option value="율동부">율동부</option>
          <option value="전례부">전례부</option>
        </select>
        <button onClick={handleAddStudent} className="btn-primary">
          학생 추가
        </button>
      </div>

      <div className="student-list">
        {displayGrades.length > 0 ? (
          displayGrades.map(gradeKey => {
            const gradeStudents = studentsByGrade[gradeKey];
            const gradeDisplay = /^\d+$/.test(gradeKey) ? `${gradeKey}학년` : gradeKey;
            
            return (
              <div key={gradeKey} className="grade-section">
                <h3>{gradeDisplay} ({gradeStudents.length}명)</h3>
                <ul>
                  {gradeStudents.map((student, idx) => (
                    <li key={`${student.name}-${student.grade}-${idx}`} className="student-item">
                      <span>{formatTalentDisplay(student.name, student.baptismName, student.talent || 0, student.department || '')}</span>
                      <button
                        onClick={() => deleteStudent(student.name, student.grade)}
                        className="btn-delete"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        ) : (
          <div className="empty-message">
            {filterGrade && filterGrade !== 'all'
              ? '해당 학년에 등록된 학생이 없습니다.' 
              : '학년을 선택하면 학생 목록이 표시됩니다.'}
          </div>
        )}
      </div>
    </section>
  );
}

export default StudentManagement;

