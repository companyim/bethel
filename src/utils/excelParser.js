import * as XLSX from 'xlsx';

// Excel 파일 파싱
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        const students = parseExcelData(jsonData);
        resolve(students);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Excel 데이터 파싱 (A: 번호, B: 학년, C: 이름, D: 세례명)
function parseExcelData(jsonData) {
  const students = [];
  
  // 첫 번째 행은 헤더일 수 있으므로 건너뛰기
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    if (!row || row.length < 3) continue;
    
    // A열(인덱스 0): 번호 - 무시
    // B열(인덱스 1): 학년
    let grade = '';
    if (row[1] !== undefined && row[1] !== null) {
      const gradeStr = String(row[1]).trim();
      // 숫자 추출 시도 (예: "6학년" -> 6)
      const numMatch = gradeStr.match(/\d+/);
      if (numMatch && ['1', '2', '4', '5', '6'].includes(numMatch[0])) {
        grade = parseInt(numMatch[0]);
      } else {
        // 숫자가 아니면 문자열로 저장 (첫영성체, 유치부 등)
        grade = gradeStr;
      }
    }
    
    // C열(인덱스 2): 이름
    let name = '';
    if (row[2] !== undefined && row[2] !== null) {
      name = String(row[2]).trim();
    }
    
    // D열(인덱스 3): 세례명
    let baptismName = '';
    if (row[3] !== undefined && row[3] !== null) {
      baptismName = String(row[3]).trim();
    }
    
    // E열(인덱스 4): 부서
    let department = '';
    if (row[4] !== undefined && row[4] !== null) {
      department = String(row[4]).trim();
    }
    
    // 이름이 있으면 추가
    if (name && grade) {
      students.push({
        name,
        grade,
        baptismName,
        department,
        talent: 0 // 초기 달란트는 0
      });
    }
  }
  
  return students;
}


