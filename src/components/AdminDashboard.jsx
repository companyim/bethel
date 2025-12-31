import React from 'react';
import { useApp } from '../context/AppContext';
import { calculateTotalTalent } from '../utils/talentUtils';
import { parseExcelFile } from '../utils/excelParser';

function AdminDashboard() {
  const { students, attendanceData, isAdminMode, setStudents, setAttendanceData, addStudent, adminPassword } = useApp();

  if (!isAdminMode) return null;

  const totalStudents = students.length;
  const totalRecords = attendanceData.length;
  const uniqueDates = new Set(attendanceData.map(r => r.date)).size;
  const presentCount = attendanceData.filter(r => r.status === 'present').length;
  const absentCount = attendanceData.filter(r => r.status === 'absent').length;
  const totalTalent = calculateTotalTalent(students);

  const handleExportJSON = () => {
    const data = {
      students,
      attendanceData,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.students && data.attendanceData) {
          if (confirm('기존 데이터를 모두 덮어쓰시겠습니까?')) {
            setStudents(data.students);
            setAttendanceData(data.attendanceData);
            alert('데이터가 성공적으로 가져와졌습니다.');
          }
        } else {
          alert('올바른 형식의 JSON 파일이 아닙니다.');
        }
      } catch (error) {
        alert('JSON 파일을 읽는 중 오류가 발생했습니다.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    // xlsx 라이브러리를 사용한 Excel 내보내기
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(attendanceData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '출석기록');
      XLSX.writeFile(wb, `attendance-${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const newStudents = await parseExcelFile(file);
      let addedCount = 0;
      let skippedCount = 0;

      newStudents.forEach(student => {
        const exists = students.some(
          s => s.name === student.name && String(s.grade) === String(student.grade)
        );
        
        if (!exists) {
          addStudent(student.name, student.grade, student.baptismName, student.department || '');
          addedCount++;
        } else {
          skippedCount++;
        }
      });

      alert(`${addedCount}명의 학생이 추가되었습니다.${skippedCount > 0 ? ` (${skippedCount}명 중복)` : ''}`);
      e.target.value = '';
    } catch (error) {
      alert('Excel 파일을 읽는 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  const handleClearAll = () => {
    if (!confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    // 비밀번호 확인
    const password = prompt('데이터 삭제를 확인하기 위해 비밀번호를 입력하세요:');
    
    if (!password) {
      alert('비밀번호를 입력하지 않았습니다. 삭제가 취소되었습니다.');
      return;
    }

    if (password !== adminPassword) {
      alert('비밀번호가 올바르지 않습니다. 삭제가 취소되었습니다.');
      return;
    }

    // 최종 확인
    if (confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <section className="section admin-dashboard">
      <h2>관리자 대시보드</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">전체 학생</div>
          <div className="stat-value">{totalStudents}명</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">전체 기록</div>
          <div className="stat-value">{totalRecords}건</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">출석일 수</div>
          <div className="stat-value">{uniqueDates}일</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">출석</div>
          <div className="stat-value">{presentCount}건</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">결석</div>
          <div className="stat-value">{absentCount}건</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-title">총 지급된 달란트</div>
          <div className="stat-value">{totalTalent}개</div>
        </div>
      </div>

      <div className="admin-actions">
        <h3>데이터 관리</h3>
        <div className="action-buttons">
          <button onClick={handleExportJSON} className="btn-secondary">
            JSON 내보내기
          </button>
          <label className="btn-secondary">
            JSON 가져오기
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={handleExportExcel} className="btn-secondary">
            Excel 내보내기
          </button>
          <label className="btn-secondary">
            Excel 파일 불러오기
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              style={{ display: 'none' }}
            />
          </label>
          <small style={{ display: 'block', marginTop: '10px', color: '#666' }}>
            Excel 형식: A열(번호), B열(학년), C열(이름), D열(세례명), E열(부서)
          </small>
          <button onClick={handleClearAll} className="btn-danger">
            모든 데이터 삭제
          </button>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;


