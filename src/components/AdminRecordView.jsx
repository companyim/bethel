import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatTalentDisplay } from '../utils/talentUtils';
import { formatDate, getSundays2026 } from '../utils/dateUtils';

function AdminRecordView() {
  const { attendanceData, students, isAdminMode } = useApp();
  const [filterGrade, setFilterGrade] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterDate, setFilterDate] = useState('');

  if (!isAdminMode) return null;

  const sundays = getSundays2026();
  let filteredRecords = [...attendanceData];

  // 학년 필터링 (전체 학년이 아닐 때만 필터링)
  if (filterGrade && filterGrade !== 'all') {
    filteredRecords = filteredRecords.filter(r => String(r.grade) === filterGrade);
  }

  // 부서 필터링
  if (filterDepartment && filterDepartment !== 'all') {
    filteredRecords = filteredRecords.filter(r => r.department === filterDepartment);
  }

  if (filterStudent) {
    filteredRecords = filteredRecords.filter(r => r.student === filterStudent);
  }

  if (filterDate) {
    filteredRecords = filteredRecords.filter(r => r.date === filterDate);
  }

  // 날짜순 정렬 (최신순)
  filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 학생 이름 목록 (필터용)
  const studentNames = [...new Set(students.map(s => s.name))].sort();

  return (
    <section className="section admin-record-view">
      <h2>출석 기록 관리</h2>

      <div className="filter-controls">
        <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
          <option value="">학년을 선택하세요</option>
          <option value="all">전체 학년</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="4">4학년</option>
          <option value="5">5학년</option>
          <option value="6">6학년</option>
          <option value="유치부">유치부</option>
          <option value="첫영성체">첫영성체</option>
        </select>

        <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
          <option value="">부서를 선택하세요</option>
          <option value="all">전체 부서</option>
          <option value="성가대">성가대</option>
          <option value="복음퀴즈부">복음퀴즈부</option>
          <option value="율동부">율동부</option>
          <option value="전례부">전례부</option>
        </select>

        <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}>
          <option value="">전체 학생</option>
          {studentNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
          <option value="">전체 날짜</option>
          {sundays.map(date => (
            <option key={date} value={date}>
              {formatDate(date)}
            </option>
          ))}
        </select>
      </div>

      <div className="records-table">
        {!filterGrade && !filterDepartment ? (
          <div className="empty-message">학년 또는 부서를 선택해주세요.</div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-message">출석 기록이 없습니다.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>학생</th>
                <th>학년</th>
                <th>부서</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, idx) => {
                const student = students.find(
                  s => s.name === record.student && String(s.grade) === String(record.grade)
                );
                return (
                  <tr key={`${record.date}-${record.student}-${idx}`}>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      {formatTalentDisplay(
                        record.student,
                        student?.baptismName || '',
                        student?.talent || 0,
                        student?.department || record.department || ''
                      )}
                    </td>
                    <td>{/^\d+$/.test(String(record.grade)) ? `${record.grade}학년` : record.grade}</td>
                    <td>{record.department || '-'}</td>
                    <td>
                      <span className={`record-status ${record.status}`}>
                        {record.status === 'present' ? '출석' : '결석'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default AdminRecordView;


