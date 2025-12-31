// 출석 시 달란트 지급 함수
export function awardTalentForAttendance(students, studentName, studentGrade) {
  const student = students.find(
    s => s.name === studentName && String(s.grade) === String(studentGrade)
  );
  
  if (student) {
    student.talent = (student.talent || 0) + 1;
    return true;
  }
  return false;
}

// 총 달란트 계산 함수
export function calculateTotalTalent(students) {
  return students.reduce((total, student) => {
    return total + (student.talent || 0);
  }, 0);
}

// 달란트 표시 포맷팅 함수
export function formatTalentDisplay(name, baptismName, talent, department = '') {
  const baptismText = baptismName ? ` (${baptismName})` : '';
  const departmentText = department ? ` [부서: ${department}]` : '';
  const talentText = talent > 0 ? ` [달란트: ${talent}]` : '';
  return `${name}${baptismText}${departmentText}${talentText}`;
}


