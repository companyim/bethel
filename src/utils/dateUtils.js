// 2026년의 모든 일요일 날짜 배열 반환
export function getSundays2026() {
  const sundays = [];
  const year = 2026;
  
  // 2026년 1월 1일부터 12월 31일까지 반복
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      // 일요일인지 확인 (0 = 일요일)
      if (date.getDay() === 0) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        sundays.push(dateStr);
      }
    }
  }
  
  return sundays;
}

// 날짜 포맷팅 (YYYY.MM.DD (일) 형식)
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day} (일)`;
}

