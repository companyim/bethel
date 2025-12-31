import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatTalentDisplay } from '../utils/talentUtils';

function StudentRecordSearch() {
  const { students, attendanceData } = useApp();
  const [searchName, setSearchName] = useState('');
  const [searchGrade, setSearchGrade] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const handleSearch = () => {
    if (!searchName.trim() || !searchGrade) {
      alert('이름과 학년을 모두 입력해주세요.');
      return;
    }

    const student = students.find(
      s => s.name === searchName.trim() && String(s.grade) === searchGrade
    );

    if (!student) {
      alert('등록된 학생을 찾을 수 없습니다.');
      setSearchResults(null);
      return;
    }

    const records = attendanceData.filter(
      r => r.student === student.name && String(r.grade) === String(student.grade)
    );

    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;

    setSearchResults({
      student,
      records: records.sort((a, b) => new Date(b.date) - new Date(a.date)),
      presentCount,
      absentCount
    });
  };

  return (
    <section className="section student-record-search">
      <h2>출석 기록 조회</h2>

      <div className="search-form">
        <input
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="학생 이름"
        />
        <select value={searchGrade} onChange={(e) => setSearchGrade(e.target.value)}>
          <option value="">학년 선택</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="4">4학년</option>
          <option value="5">5학년</option>
          <option value="6">6학년</option>
          <option value="유치부">유치부</option>
          <option value="첫영성체">첫영성체</option>
        </select>
        <button onClick={handleSearch} className="btn-primary">
          조회
        </button>
      </div>

      {searchResults && (
        <div className="search-results">
          <div className="student-info">
            <h3>
              {formatTalentDisplay(
                searchResults.student.name,
                searchResults.student.baptismName,
                searchResults.student.talent || 0,
                searchResults.student.department || ''
              )}
            </h3>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-label">출석:</span>
                <span className="stat-value">{searchResults.presentCount}회</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">결석:</span>
                <span className="stat-value">{searchResults.absentCount}회</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">총 달란트:</span>
                <span className="stat-value">{searchResults.student.talent || 0}개</span>
              </div>
            </div>
          </div>

          <div className="records-list">
            <h4>출석 기록</h4>
            {searchResults.records.length === 0 ? (
              <div className="empty-message">출석 기록이 없습니다.</div>
            ) : (
              <ul>
                {searchResults.records.map((record, idx) => (
                  <li key={`${record.date}-${idx}`} className="record-item">
                    <span className="record-date">{record.date}</span>
                    <span className={`record-status ${record.status}`}>
                      {record.status === 'present' ? '출석' : '결석'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default StudentRecordSearch;


