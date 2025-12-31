# Firebase 클라우드 동기화 설정 가이드

이 가이드를 따라 Firebase를 설정하면 모든 기기(데스크탑, 모바일)에서 데이터를 동기화할 수 있습니다.

## 1. Firebase 프로젝트 생성

1. https://console.firebase.google.com/ 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: "bethel-attendance")
4. Google Analytics 설정 (선택사항)
5. "프로젝트 만들기" 클릭

## 2. 웹 앱 추가

1. Firebase 콘솔에서 프로젝트 선택
2. 프로젝트 개요 화면에서 "웹" 아이콘 (</>) 클릭
3. 앱 닉네임 입력 (예: "베텔 주일학교 출석부")
4. "Firebase Hosting도 설정"은 선택하지 않아도 됩니다
5. "앱 등록" 클릭

## 3. Firebase 설정 정보 복사

앱 등록 후 나타나는 설정 정보를 복사합니다:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 4. 프로젝트에 설정 적용

1. `c:\cursor\src\config\firebase-config.js` 파일을 엽니다
2. `firebaseConfig` 변수를 위에서 복사한 값으로 교체합니다:

```javascript
export const firebaseConfig = {
  apiKey: "여기에_API_키_입력",
  authDomain: "여기에_도메인_입력",
  projectId: "여기에_프로젝트_ID_입력",
  storageBucket: "여기에_스토리지_버킷_입력",
  messagingSenderId: "여기에_메시징_센더_ID_입력",
  appId: "여기에_앱_ID_입력"
};
```

## 5. Firestore 데이터베이스 생성

1. Firebase 콘솔에서 "Firestore Database" 메뉴로 이동
2. "데이터베이스 만들기" 클릭
3. 보안 규칙: "테스트 모드로 시작" 선택 (개발용)
4. 위치 선택 (가장 가까운 지역 선택, 예: asia-northeast3 (서울))
5. "사용 설정" 클릭

## 6. 보안 규칙 설정 (중요!)

Firestore 데이터베이스 > 규칙 탭에서 다음 규칙을 설정합니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 출석부 앱 데이터 (모든 사용자 읽기/쓰기 가능)
    match /attendanceApp/{document} {
      allow read, write: if true;
    }
  }
}
```

**주의**: 위 규칙은 모든 사용자가 읽고 쓸 수 있습니다. 
더 안전하게 하려면 인증을 추가하거나 IP 제한 등을 설정할 수 있습니다.

## 7. 설정 완료

1. 설정 파일을 저장합니다
2. 개발 서버를 재시작합니다: `npm run dev`
3. 브라우저 콘솔을 확인하여 "Firebase가 초기화되었습니다" 메시지가 나타나는지 확인합니다

## 동기화 작동 방식

- Firebase가 설정되면 모든 데이터가 클라우드에 자동으로 동기화됩니다
- 한 기기에서 데이터를 변경하면 다른 기기에서도 실시간으로 업데이트됩니다
- Firebase가 설정되지 않으면 기존처럼 LocalStorage를 사용합니다

## 문제 해결

- Firebase 초기화 오류: 설정 정보가 정확한지 확인하세요
- 데이터가 동기화되지 않음: Firestore 보안 규칙을 확인하세요
- 콘솔에 오류 메시지 확인: 브라우저 개발자 도구(F12)의 콘솔 탭을 확인하세요

