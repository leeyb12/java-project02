# 👥 프로젝트 역할 분담 명세

**작성 일자**: 2026년 6월 1일  
**프로젝트**: InterviewAI - AI 기반 맞춤형 면접 시뮬레이터

---

## 📋 팀 구성

| 이름       | 담당 분야                     | 역할                   |
| ---------- | ----------------------------- | ---------------------- |
| **최재화** | 백엔드 개발                   | Backend Lead           |
| **이윤범** | 프론트엔드 + DB + 백엔드 수정 | Frontend Lead + DevOps |

---

## 🔧 상세 역할 분담

### 1️⃣ **최재화 (Backend Lead)**

#### A. 초기 백엔드 구축

- **Spring Boot 프로젝트 세팅**
  - Gradle 의존성 관리 구성
  - Java 21, Spring Boot 4.0.6 설정
  - application.properties 설정

- **API 설계 및 구현**

  ```
  ✅ ResumeController 개발
     └─ POST /resume/upload (이력서 업로드)
     └─ GET /resume/{id} (이력서 조회)

  ✅ InterviewController 개발
     └─ POST /sessions (세션 생성)
     └─ GET /sessions/{id} (세션 조회)
     └─ PATCH /sessions/{id}/end (세션 종료)

  ✅ QuestionController 개발
     └─ GET /sessions/{id}/questions (질문 조회)

  ✅ AnswerController 개발
     └─ POST /sessions/{id}/answers (답변 제출)

  ✅ FeedbackController 개발
     └─ GET /sessions/{id}/feedback (피드백 조회)
  ```

- **서비스 계층 개발 (Business Logic)**

  ```
  ✅ ResumeService
     └─ 파일 업로드 처리
     └─ PDFBox를 통한 PDF 텍스트 추출
     └─ Apache POI를 통한 DOCX 처리
     └─ 개인정보 파싱 (이름, 기술, 경력, 학력)
     └─ DB 저장 및 조회

  ✅ InterviewService
     └─ 세션 생성 및 관리
     └─ 질문 목록 조회
     └─ 세션 종료 처리

  ✅ OllamaService
     └─ Ollama API 연동
     └─ 프롬프트 엔지니어링
     └─ LLM 기반 질문 생성
     └─ 응답 JSON 파싱

  ✅ AnswerService
     └─ 답변 blob 저장
     └─ 점수 계산
  ```

- **데이터 액세스 계층 (MyBatis)**

  ```
  ✅ ResumeMapper.xml
     └─ INSERT, SELECT, UPDATE 쿼리

  ✅ InterviewMapper.xml
     └─ 세션 CRUD 쿼리
     └─ 질문 CRUD 쿼리
     └─ 답변 CRUD 쿼리
  ```

- **DTO/Entity 설계**

  ```
  ✅ ResumeRequestDto
  ✅ ResumeUploadResponseDto
  ✅ InterviewRequestDto
  ✅ InterviewResponseDto
  ✅ QuestionDto
  ✅ AnswerDto
  ✅ FeedbackDto
  ```

- **외부 API 연동**
  - Ollama LLM 서버 연동
  - Spring WebFlux 비동기 호출
  - 오류 처리 및 재시도 로직

#### B. 핵심 파일

```
Backend/src/main/java/com/pknu26/interview/
├── controller/
│   ├── ResumeController.java
│   ├── InterviewController.java
│   ├── QuestionController.java
│   ├── AnswerController.java
│   └── FeedbackController.java
│
├── service/
│   ├── ResumeService.java
│   ├── InterviewService.java
│   ├── OllamaService.java
│   └── AnswerService.java
│
├── dto/
│   ├── ResumeRequestDto.java
│   ├── ResumeUploadResponseDto.java
│   ├── InterviewRequestDto.java
│   ├── InterviewResponseDto.java
│   ├── QuestionDto.java
│   ├── AnswerDto.java
│   └── FeedbackDto.java
│
├── entity/
│   ├── Resume.java
│   ├── InterviewSession.java
│   ├── Question.java
│   ├── Answer.java
│   └── Feedback.java
│
├── repository/
│   ├── InterviewMapper.java
│   └── ResumeMapper.java
│
└── config/
    ├── CorsConfig.java
    ├── MyBatisConfig.java
    └── OllamaConfig.java

Backend/src/main/resources/mapper/
├── ResumeMapper.xml
├── InterviewMapper.xml
├── QuestionMapper.xml
├── AnswerMapper.xml
└── FeedbackMapper.xml

Backend/build.gradle
└── 의존성 관리: Spring Boot, MyBatis, Oracle, PDFBox, POI
```

---

### 2️⃣ **이윤범 (Frontend Lead + DevOps)**

#### A. 프론트엔드 개발

##### 1️⃣ React/Vite 프로젝트 구축

```
✅ package.json 설정
   └─ React 19.2.6, Vite 8.0.12, React Router 7.15.1

✅ vite.config.js 설정
   └─ 개발 서버 포트: 5173
   └─ API 프록시 설정

✅ ESLint 및 Prettier 설정
```

##### 2️⃣ 페이지 개발 (Pages)

```
✅ Dashboard.jsx
   ├─ 좌측: 기기 확인 섹션
   │  └─ WebcamPreview
   │  └─ AudioVisualizer
   │  └─ 카메라/마이크 선택
   │
   ├─ 중앙: 이력서 업로드 섹션
   │  └─ 드래그 앤 드롭
   │  └─ 파일 업로드 진행률
   │  └─ 파싱된 정보 표시
   │
   ├─ 우측: 면접 설정 섹션
   │  └─ 카테고리 선택
   │  └─ 난이도 선택
   │  └─ 질문 수 선택
   │  └─ 시작 버튼
   │
   └─ ⭐ NEW: 카메라 사용 토글
      └─ Boolean 상태 관리
      └─ sessionStorage 저장
      └─ 조건부 UI 렌더링

✅ InterviewRoom.jsx
   ├─ 헤더
   │  └─ 진행률 바
   │  └─ 타이머
   │  └─ 종료 버튼
   │
   ├─ 좌측: 미디어 섹션
   │  ├─ (카메라 O) WebcamPreview
   │  ├─ (카메라 X) "🎙️ 음성 면접 진행 중" 표시 ⭐
   │  ├─ AudioVisualizer
   │  └─ 업로드 진행률
   │
   ├─ 우측: 면접 진행 섹션
   │  ├─ 질문 텍스트
   │  ├─ 타이머 기반 자동 제출
   │  └─ 답변 녹화 및 업로드
   │
   └─ ⭐ 카메라 미사용 시 처리
      └─ useCamera 플래그 확인
      └─ 비디오 기기 없이 진행

✅ Feedback.jsx
   ├─ 종합 점수 표시
   ├─ 질문별 점수 및 피드백
   ├─ 핵심 키워드
   ├─ 개선 사항
   └─ 재시도 버튼
```

##### 3️⃣ 컴포넌트 개발 (Components)

```
✅ common/
   ├─ Button.jsx (다양한 크기 및 색상)
   ├─ Card.jsx (카드 레이아웃)
   └─ Modal.jsx (모달 다이얼로그)

✅ interview/
   ├─ WebcamPreview.jsx (카메라 영상 표시)
   ├─ AudioVisualizer.jsx (오디오 시각화)
   ├─ ResumeUpload.jsx (이력서 업로드)
   └─ InterviewTimer.jsx (타이머 컴포넌트)
```

##### 4️⃣ React Hooks 개발

```
✅ useUserMedia.js
   ├─ 카메라/마이크 스트림 관리
   ├─ 기기 열거 및 전환
   ├─ 권한 요청 처리
   └─ ⭐ 동적 constraints (video: useCamera)

✅ useMediaRecorder.js
   ├─ 녹화 시작/중지
   ├─ Blob 변환
   └─ 타이머 기반 자동 중지

✅ 커스텀 Hooks
   ├─ useSessionStorage
   └─ useCountdown (타이머)
```

##### 5️⃣ API 서비스 계층

```
✅ api.js
   ├─ Axios 인스턴스 설정
   └─ 180초 타임아웃 설정

✅ interviewService.js
   ├─ uploadResume()
   ├─ createSessionWithResume() ⭐ useCamera 전달
   ├─ fetchQuestions()
   ├─ submitAnswer()
   ├─ endSession()
   └─ fetchFeedback()
```

##### 6️⃣ 스타일링

```
✅ CSS 모듈 방식
   ├─ Dashboard.css
   ├─ InterviewRoom.css
   ├─ Feedback.css
   ├─ index.css (전역)
   └─ App.css

✅ 스타일 특징
   ├─ 반응형 디자인
   ├─ 다크 모드 변수
   └─ 애니메이션 효과
```

#### B. 데이터베이스 개발

```
✅ Oracle DB 스키마 설계
   ├─ RESUME 테이블 (이력서 정보)
   ├─ INTERVIEW_SESSION 테이블 (세션 관리)
   │  └─ ⭐ use_camera COLUMN 추가
   ├─ QUESTION 테이블 (질문)
   ├─ ANSWER 테이블 (답변)
   └─ FEEDBACK 테이블 (피드백)

✅ SQL 스크립트 작성
   ├─ interview_schema.sql (CREATE TABLE)
   ├─ interview_sequence_schema.sql (시퀀스)
   └─ 인덱스 및 제약조건 설정
```

#### C. 백엔드 수정 및 확장 작업

##### 🎯 카메라 옵션 기능 구현

**1단계: DTO 수정**

```java
// ResumeRequestDto.java 수정
@Data
public class ResumeRequestDto {
    private String resumeId;
    private String category;
    private int questionCount;
    private String difficulty;
    private Boolean useCamera = true;  // ⭐ NEW 필드
}
```

**2단계: Entity 수정**

```java
// InterviewSession.java 수정
@Getter @Builder
public class InterviewSession {
    private String id;
    private String resumeId;
    private String category;
    private int questionCount;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Boolean useCamera;  // ⭐ NEW 필드
}
```

**3단계: Service 로직 수정**

```java
// InterviewService.java 수정
public InterviewSession createSessionWithQuestions(
        String resumeId,
        String category,
        int questionCount,
        List<QuestionDto> questions,
        Boolean useCamera) {  // ⭐ NEW 파라미터
    // useCamera를 세션에 저장
    session.setUseCamera(useCamera != null ? useCamera : true);
}
```

**4단계: Controller 수정**

```java
// ResumeController.java 수정
@PostMapping("/sessions")
public ResponseEntity<Map<String, Object>> createSession(@RequestBody ResumeRequestDto req) {
    InterviewSession session = interviewService.createSessionWithQuestions(
            req.getResumeId(),
            req.getCategory(),
            req.getQuestionCount(),
            questions,
            req.getUseCamera()  // ⭐ 전달
    );

    response.put("useCamera", session.getUseCamera());  // ⭐ 응답에 포함
}
```

**5단계: 프론트엔드 연동**

```jsx
// Dashboard.jsx
const handleStartInterview = async () => {
  sessionStorage.setItem("interviewUseCamera", useCamera.toString());
  const session = await createSessionWithResume({
    category,
    difficulty,
    questionCount,
    useCamera, // ⭐ 전달
  });
};

// InterviewRoom.jsx
const [useCamera, setUseCamera] = useState(
  sessionStorage.getItem("interviewUseCamera") !== "false",
);

// 카메라 설정에 따라 다른 UI 렌더링
{
  useCamera ? <WebcamPreview /> : <AudioModeDisplay />;
}
```

**6단계: 데이터베이스 마이그레이션**

```sql
-- interview_schema.sql 수정
ALTER TABLE INTERVIEW_SESSION ADD COLUMN USE_CAMERA CHAR(1) DEFAULT 'Y';
```

#### D. 기타 백엔드 개선

```
✅ 에러 처리 강화
   ├─ CustomException 정의
   └─ 전역 예외 핸들러 구현

✅ 유효성 검사
   ├─ 입력 데이터 검증
   └─ NULL 체크

✅ 성능 최적화
   ├─ 쿼리 최적화
   ├─ 인덱스 추가
   └─ 캐싱 전략 (향후)
```

#### E. 핵심 파일

```
Frontend/
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   │
│   ├── pages/
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx ⭐ (카메라 토글 추가)
│   │   │   └── Dashboard.css
│   │   │
│   │   ├── InterviewRoom/
│   │   │   ├── InterviewRoom.jsx ⭐ (카메라 옵션 처리)
│   │   │   └── InterviewRoom.css
│   │   │
│   │   └── Feedback/
│   │       ├── Feedback.jsx
│   │       └── Feedback.css
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   └── Modal.jsx
│   │   │
│   │   └── interview/
│   │       ├── WebcamPreview.jsx
│   │       ├── AudioVisualizer.jsx
│   │       └── ResumeUpload.jsx
│   │
│   ├── hooks/
│   │   ├── useUserMedia.js
│   │   ├── useMediaRecorder.js
│   │   └── useCountdown.js
│   │
│   └── services/
│       ├── api.js
│       └── interviewService.js ⭐ (useCamera 주석 추가)

Backend/ (수정 부분)
├── src/main/java/com/pknu26/interview/
│   ├── dto/
│   │   └── ResumeRequestDto.java ⭐ (useCamera 추가)
│   │
│   ├── entity/
│   │   └── InterviewSession.java ⭐ (useCamera 추가)
│   │
│   ├── service/
│   │   └── InterviewService.java ⭐ (useCamera 파라미터 추가)
│   │
│   └── controller/
│       └── ResumeController.java ⭐ (useCamera 처리)

Database/
└── Backend/sql/
    └── interview_schema.sql ⭐ (USE_CAMERA 컬럼 추가)
```

---

## 📊 작업 진행 타임라인

### Phase 1: 초기 구축 (최재화)

- ✅ Spring Boot 프로젝트 설정
- ✅ API 설계 및 기본 구현
- ✅ Ollama 연동

### Phase 2: 프론트엔드 개발 (이윤범)

- ✅ React/Vite 프로젝트 구축
- ✅ Dashboard, InterviewRoom, Feedback 페이지 개발
- ✅ 미디어 관련 Hooks 개발

### Phase 3: 통합 (양방향 협력)

- ✅ API 호출 연동
- ✅ 통합 테스트

### Phase 4: 카메라 옵션 추가 (이윤범 주도)

- ✅ 프론트엔드: Dashboard/InterviewRoom 수정
- ✅ 백엔드: DTO/Entity/Service 수정
- ✅ 데이터베이스: 스키마 업데이트

### Phase 5: 최종 테스트 및 배포

- ✅ 시나리오 테스트
- ✅ 버그 수정
- ✅ 보고서 작성

---

## 🤝 협업 규칙

### API 명세 공유

```
프론트엔드에서 필요한 API 엔드포인트
  ↓
백엔드에서 구현 및 문서화 (Swagger)
  ↓
프론트엔드에서 axios 서비스 구현
  ↓
통합 테스트
```

### 코드 리뷰

```
프론트엔드 변경사항
  └─ 이윤범 self-review → 최재화 review (필요시)

백엔드 변경사항
  └─ 최재화 self-review → 이윤범 review (필요시)

공유 영역 (DTO, 스키마)
  └─ 양쪽 모두 리뷰
```

### 커뮤니케이션

- 일일 스탠드업: 10분 (진행 상황 공유)
- 통합 이슈 발생 시: 즉시 논의
- PR/MR: 최소 1명 리뷰 후 머지

---

## 📈 성과 지표

| 항목                    | 최재화                 | 이윤범                 |
| ----------------------- | ---------------------- | ---------------------- |
| **개발 라인 수**        | 2,000+                 | 3,500+                 |
| **API 엔드포인트**      | 7개                    | -                      |
| **React 컴포넌트**      | -                      | 15+                    |
| **데이터베이스 테이블** | -                      | 5개                    |
| **기능 구현**           | 이력서 분석, 질문 생성 | 면접 진행, 피드백 표시 |
| **외부 API**            | Ollama 연동            | 없음                   |

---

## ✅ 최종 체크리스트

### 최재화

- [ ] Spring Boot 백엔드 완성
- [ ] API 명세 문서화
- [ ] Ollama 연동 테스트
- [ ] Oracle DB 스키마 검증
- [ ] 에러 처리 완성

### 이윤범

- [ ] React 프론트엔드 완성
- [ ] 모든 페이지 개발 완료
- [ ] 카메라 옵션 기능 구현
- [ ] API 통합 완료
- [ ] 데이터베이스 마이그레이션
- [ ] 백엔드 수정 사항 적용
- [ ] 보고서 및 가이드 작성

### 공동

- [ ] 통합 테스트 완료
- [ ] 시연 데모 준비
- [ ] 스크린샷 촬영 완료
- [ ] 최종 보고서 완성

---

**문서 작성일**: 2026년 6월 1일  
**작성자**: 개발팀 (최재화, 이윤범)

---
