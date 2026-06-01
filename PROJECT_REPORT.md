# AI 면접 시뮬레이션 시스템 프로젝트 보고서

**작성 일자**: 2026년 6월 1일  
**프로젝트 명**: InterviewAI - AI 기반 맞춤형 면접 시뮬레이터

---

## 📑 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [요구사항 명세서](#2-요구사항-명세서)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [기술 스택](#4-기술-스택)
5. [사용 도구 및 환경](#5-사용-도구-및-환경)
6. [역할 분담](#6-역할-분담)
7. [구현 상세 내용](#7-구현-상세-내용)
8. [시연 가이드](#8-시연-가이드)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 목표

본 프로젝트는 **AI 기반 맞춤형 면접 시뮬레이션 시스템**으로, 사용자가 이력서를 업로드하면 Ollama LLM을 활용하여 개인 맞춤형 질문을 자동 생성하고, 면접 시뮬레이션을 진행한 후 AI 피드백을 제공하는 웹 애플리케이션입니다.

### 1.2 프로젝트 특징

| 항목                 | 설명                                                |
| -------------------- | --------------------------------------------------- |
| **맞춤형 질문 생성** | 이력서 내용을 분석하여 개인화된 면접 질문 자동 생성 |
| **다중 모드 지원**   | 카메라 포함/제외 두 가지 면접 모드 지원             |
| **AI 기반 평가**     | Ollama LLM을 활용한 답변 분석 및 피드백             |
| **실시간 녹화**      | 면접 답변 영상/음성 실시간 녹화                     |
| **사용자 친화적 UI** | 직관적인 대시보드 및 면접실 인터페이스              |

### 1.3 적용 대상

- 💼 취업 준비생
- 🎓 기술 면접 준비자
- 🏢 기업 채용담당자 (미래 확장)

---

## 2. 요구사항 명세서

### 2.1 기능 요구사항 (FR)

#### FR-01: 이력서 업로드 및 파싱

- **설명**: 사용자가 PDF/DOCX 형식의 이력서를 업로드하면 자동으로 텍스트 추출
- **입력**: PDF, DOCX, DOC, TXT 파일 (최대 10MB)
- **처리 절차**:
  1. 파일 검증 (형식, 크기)
  2. 텍스트 추출 (PDFBox, Apache POI)
  3. 개인정보 파싱 (이름, 기술스택, 경력, 학력)
  4. DB 저장 (Resume 테이블)
- **출력**: `resumeId`, 추출된 텍스트, 파싱된 정보

#### FR-02: AI 기반 맞춤형 질문 생성

- **설명**: 이력서 또는 사용자 선택 카테고리 기반으로 Ollama LLM이 면접 질문 생성
- **입력**:
  - `resumeId` (선택사항)
  - `category` (일반/기술/행동/상황)
  - `questionCount` (3~10개)
  - `difficulty` (쉬움/보통/어려움)
- **처리 절차**:
  1. 이력서 내용 조회
  2. Ollama API 호출 (프롬프트 기반 질문 생성)
  3. JSON 파싱
  4. 기본값 유효성 검사
- **출력**: 생성된 질문 목록 (id, text, category, timeLimit)

#### FR-03: 면접 세션 생성 및 관리

- **설명**: 사용자 설정에 따라 면접 세션 생성 및 추적
- **세션 정보**:
  - Session ID (UUID)
  - Resume ID (선택사항)
  - Category, Question Count, Difficulty
  - **useCamera** (카메라 사용 여부) - 신규
  - Status (active/ended)
  - 시작 시간, 종료 시간
- **기능**:
  - 세션 생성: `POST /api/v1/interviews/sessions`
  - 세션 조회: `GET /api/v1/interviews/sessions/{sessionId}`
  - 세션 종료: `PATCH /api/v1/interviews/sessions/{sessionId}/end`

#### FR-04: 면접 진행 (질문 제시 및 답변 녹화)

- **설명**: 질문을 순차적으로 제시하고 사용자 답변을 녹화/저장
- **처리 절차**:
  1. 질문 목록 조회
  2. 타이머 기반 답변 진행 (질문별 시간 제한)
  3. **카메라 있음**: 비디오 + 오디오 녹화
  4. **카메라 없음**: 오디오만 녹화
  5. 블롭 업로드 및 DB 저장
- **API**:
  - `GET /api/v1/interviews/sessions/{sessionId}/questions`
  - `POST /api/v1/interviews/sessions/{sessionId}/answers`

#### FR-05: 피드백 및 평가

- **설명**: 면접 종료 후 AI 기반 종합 평가 리포트 제공
- **평가 항목**:
  - 종합 점수 (0~100)
  - 질문별 피드백
  - 핵심 키워드 추출
  - 개선 사항 제안
- **API**: `GET /api/v1/interviews/sessions/{sessionId}/feedback`

#### FR-06: 카메라 옵션 (신규)

- **설명**: 사용자가 카메라 없이도 음성 기반 면접 진행 가능
- **기능**:
  - Dashboard에서 "카메라 사용" 토글
  - 카메라 미사용 시 마이크만으로 진행
  - 백엔드에서 useCamera 플래그 저장
- **영향 범위**:
  - Frontend: Dashboard, InterviewRoom 수정
  - Backend: ResumeRequestDto, InterviewSession 수정
  - Database: interview_session 테이블에 `use_camera` 컬럼 추가

### 2.2 비기능 요구사항 (NFR)

| 요구사항        | 설명               | 목표값                |
| --------------- | ------------------ | --------------------- |
| **응답 시간**   | 질문 생성 시간     | 5초 이내              |
| **파일 처리**   | 이력서 업로드 처리 | 30초 이내             |
| **동시성**      | 최대 동시 사용자   | 100명                 |
| **가용성**      | 시스템 가용율      | 99%                   |
| **보안**        | CORS 제한          | localhost:5173만 허용 |
| **데이터 저장** | 녹화 파일 보관     | 30일                  |

### 2.3 제약사항

1. **Ollama 서버 의존성**: Ollama 서버가 실행 중이어야 함
2. **Oracle DB 의존성**: 데이터 저장을 위해 Oracle DB 필수
3. **파일 형식**: PDF, DOCX, DOC, TXT만 지원
4. **네트워크**: 로컬 네트워크 환경에서 실행
5. **브라우저**: 웹카메라/마이크 권한 필요 (카메라 사용 시)

---

## 3. 시스템 아키텍처

### 3.1 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                        클라이언트 (React)                      │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │  Dashboard   │ InterviewRoom │      Feedback Page       │ │
│  │ (기기확인,    │  (면접 진행)  │   (결과 확인)           │ │
│  │ 이력서업로드) │              │                        │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST API
                           │ Axios
                           ▼
┌─────────────────────────────────────────────────────────────┐
│             백엔드 (Spring Boot 4.0.6)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ResumeController                                     │  │
│  │  ├─ POST /resume/upload        (이력서 업로드)       │  │
│  │  ├─ POST /sessions             (세션 생성)           │  │
│  │  ├─ GET  /sessions/{id}        (세션 조회)           │  │
│  │  ├─ GET  /sessions/{id}/questions                   │  │
│  │  ├─ POST /sessions/{id}/answers                     │  │
│  │  └─ GET  /sessions/{id}/feedback                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service Layer                                        │  │
│  │  ├─ ResumeService        (이력서 관리)              │  │
│  │  ├─ InterviewService     (세션 관리)                │  │
│  │  ├─ OllamaService        (AI 질문 생성)             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Layer (MyBatis)                                 │  │
│  │  ├─ InterviewMapper      (SQL 쿼리)                 │  │
│  │  └─ ResumeMapper                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────┬──────────────────────┘
           │                          │
           ▼                          ▼
    ┌──────────────┐        ┌────────────────────┐
    │  Oracle DB   │        │  Ollama LLM Server │
    │              │        │                    │
    │ ├─ Resume    │        │ (로컬 LLM)         │
    │ ├─ Session   │        │                    │
    │ ├─ Question  │        │ 질문 생성 엔진     │
    │ └─ Answer    │        │                    │
    └──────────────┘        └────────────────────┘
```

### 3.2 데이터 흐름도

```
1. 이력서 업로드 흐름
   ┌─────────────┐
   │ 사용자 업로드│
   └──────┬──────┘
          │ PDF/DOCX 파일
          ▼
   ┌──────────────┐
   │ 파일 검증     │ (형식, 크기)
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ 텍스트 추출   │ (PDFBox/POI)
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ 정보 파싱     │ (이름, 기술, 경력)
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ DB 저장      │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ resumeId 반환│
   └──────────────┘

2. 면접 질문 생성 흐름
   ┌─────────────────┐
   │ 사용자 설정     │
   │ (카테고리,     │
   │  난이도,      │
   │  질문수)      │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ 세션 생성        │
   └────────┬────────┘
            │ useCamera 저장
            ▼
   ┌─────────────────┐
   │ Ollama 호출      │
   │ (프롬프트 생성)  │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ JSON 파싱       │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ 질문 목록 반환  │
   └─────────────────┘

3. 면접 진행 및 답변 흐름
   ┌─────────────────┐
   │ 면접 시작        │
   └────────┬────────┘
            │ useCamera 확인
            ▼
   ┌─────────────────┐        ┌─────────────────┐
   │ 카메라 모드     │        │ 음성 모드        │
   │ (비디오+오디오) │        │ (오디오만)       │
   └────────┬────────┘        └────────┬────────┘
            │                         │
            ├─────────────┬───────────┘
                          │
                          ▼
                ┌─────────────────┐
                │ 질문 제시/타이머 │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ 사용자 답변      │
                │ (블롭 녹화)      │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ 서버 업로드      │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ DB 저장         │
                └─────────────────┘
```

---

## 4. 기술 스택

### 4.1 백엔드 기술

| 계층           | 기술           | 버전         | 역할                       |
| -------------- | -------------- | ------------ | -------------------------- |
| **Framework**  | Spring Boot    | 4.0.6        | 웹 애플리케이션 프레임워크 |
| **Java**       | Java           | 21           | 프로그래밍 언어            |
| **Database**   | Oracle DB      | 11g+         | 데이터 저장                |
| **ORM/Mapper** | MyBatis        | 3.0.4        | SQL 매퍼                   |
| **API**        | Spring Web     | -            | REST API 제공              |
| **Reactive**   | Spring WebFlux | -            | Ollama 비동기 호출         |
| **JSON**       | Jackson        | 2.17.0       | JSON 변환                  |
| **PDF**        | PDFBox         | 3.0.1        | PDF 텍스트 추출            |
| **DOCX**       | Apache POI     | 5.2.5        | Word 파일 처리             |
| **Util**       | Lombok         | latest       | 보일러플레이트 감소        |
| **JDBC**       | Oracle JDBC    | 23.3.0.23.09 | DB 드라이버                |

### 4.2 프론트엔드 기술

| 계층          | 기술              | 버전   | 역할              |
| ------------- | ----------------- | ------ | ----------------- |
| **Framework** | React             | 19.2.6 | UI 라이브러리     |
| **Bundler**   | Vite              | 8.0.12 | 빌드 도구         |
| **Router**    | React Router      | 7.15.1 | 클라이언트 라우팅 |
| **HTTP**      | Axios             | 1.16.1 | HTTP 클라이언트   |
| **Language**  | JavaScript (ES6+) | -      | 프로그래밍 언어   |
| **Styling**   | CSS3              | -      | 스타일링          |

### 4.3 외부 서비스

| 서비스     | 버전 | 용도                    |
| ---------- | ---- | ----------------------- |
| **Ollama** | 최신 | LLM 기반 질문 생성      |
| **CORS**   | -    | 크로스 오리진 요청 처리 |

---

## 5. 사용 도구 및 환경

### 5.1 개발 환경

| 도구                | 버전/사양               | 용도                |
| ------------------- | ----------------------- | ------------------- |
| **IDE**             | IntelliJ IDEA / VS Code | 코드 에디터         |
| **Java SDK**        | JDK 21                  | 자바 컴파일 및 실행 |
| **Build Tool**      | Gradle 8.x              | 의존성 관리 및 빌드 |
| **Node.js**         | 18.x+                   | JavaScript 런타임   |
| **npm**             | 9.x+                    | 패키지 관리자       |
| **Database**        | Oracle Database 11g+    | 데이터 저장소       |
| **API Testing**     | Postman / REST Client   | API 테스트          |
| **Version Control** | Git/GitHub              | 소스 관리           |

### 5.2 런타임 환경

| 항목             | 요구사항                  |
| ---------------- | ------------------------- |
| **Java Runtime** | JRE 21 이상               |
| **Node.js**      | 18.0 이상                 |
| **RAM**          | 최소 4GB (권장 8GB)       |
| **Storage**      | 최소 5GB (프로젝트 + DB)  |
| **네트워크**     | 로컬 네트워크 (localhost) |

### 5.3 시스템 구성도

```
┌──────────────────────────────────────────────────────────┐
│                    개발자 머신                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                  Port Configuration                 │ │
│  │  ├─ 3000: React Dev Server (Vite)                  │ │
│  │  ├─ 8080: Spring Boot 백엔드                       │ │
│  │  ├─ 1521: Oracle DB 리스너                         │ │
│  │  └─ 11434: Ollama 서버                             │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            Application Stack                        │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │ React 앱 (localhost:5173)                    │  │ │
│  │  │ ├─ Components                                 │  │ │
│  │  │ ├─ Hooks                                      │  │ │
│  │  │ └─ Services                                   │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │ Spring Boot (localhost:8080)                 │  │ │
│  │  │ ├─ Controllers                                │  │ │
│  │  │ ├─ Services                                   │  │ │
│  │  │ ├─ MyBatis Mappers                            │  │ │
│  │  │ └─ External APIs                              │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │ Oracle Database (localhost:1521)             │  │ │
│  │  │ ├─ Resume Table                               │  │ │
│  │  │ ├─ InterviewSession Table                      │  │ │
│  │  │ ├─ Question Table                              │  │ │
│  │  │ └─ Answer Table                                │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │ Ollama LLM Server (localhost:11434)          │  │ │
│  │  │ └─ AI 질문 생성 엔진                          │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 6. 역할 분담

### 6.1 팀 구성 및 역할

#### 담당자 1: **최재화** (Backend)

**담당 업무:**

- Spring Boot 백엔드 초기 구축
- API 설계 및 구현
  - ResumeController (이력서 업로드, 세션 생성)
  - 질문 생성 엔지 (Ollama 연동)
  - 피드백 API 개발
- MyBatis ORM 설정
- Oracle DB 스키마 설계
- Ollama 외부 API 연동

**구현 파일:**

- `Backend/src/main/java/com/pknu26/interview/controller/ResumeController.java`
- `Backend/src/main/java/com/pknu26/interview/controller/InterviewController.java`
- `Backend/src/main/java/com/pknu26/interview/service/OllamaService.java`
- `Backend/src/main/java/com/pknu26/interview/service/ResumeService.java`
- `Backend/src/main/resources/mapper/*.xml`

---

#### 담당자 2: **이윤범** (Frontend + Database + Backend Modifications)

**담당 업무:**

**A. 프론트엔드 개발**

- React/Vite 프로젝트 구축
- 페이지 개발
  - Dashboard: 기기 테스트, 이력서 업로드, 면접 설정
  - InterviewRoom: 실시간 면접 진행
  - Feedback: 결과 페이지
- 컴포넌트 개발
  - WebcamPreview, AudioVisualizer
  - Button, Card, Modal
- React Hooks 개발
  - useUserMedia: 카메라/마이크 관리
  - useMediaRecorder: 녹화 기능
- API 통신 (axios)

**B. 데이터베이스 개선**

- Oracle DB 스키마 설계
- 테이블 생성 (Resume, InterviewSession, Question, Answer)
- 인덱스 및 제약조건 설정
- 데이터 무결성 관리

**C. 백엔드 수정 및 확장**

- **카메라 옵션 기능 추가**
  - ResumeRequestDto에 `useCamera` 필드 추가
  - InterviewSession 엔티티에 `useCamera` 필드 추가
  - InterviewService에 useCamera 파라미터 전달 로직 추가
- Dto/Entity 수정 및 검증
- 에러 처리 개선
- 병렬성 및 성능 최적화

**구현 파일:**

```
Frontend/
├─ src/pages/Dashboard/Dashboard.jsx          ⭐ 카메라 토글 추가
├─ src/pages/InterviewRoom/InterviewRoom.jsx  ⭐ 카메라 옵션 처리
├─ src/components/interview/WebcamPreview.jsx
├─ src/hooks/useUserMedia.js
└─ src/services/interviewService.js

Backend (수정)/
├─ src/main/java/com/pknu26/interview/dto/ResumeRequestDto.java     ⭐
├─ src/main/java/com/pknu26/interview/entity/InterviewSession.java  ⭐
└─ src/main/java/com/pknu26/interview/service/InterviewService.java ⭐

Database/
└─ sql/interview_schema.sql                   ⭐ use_camera 컬럼 추가
```

### 6.2 협업 프로세스

```
프로젝트 초기화
    ↓
[최재화] 백엔드 기본 구조 및 API 설계
    ↓
[이윤범] 프론트엔드 컴포넌트 개발
    ↓
API 통신 연동 (양방향 협력)
    ↓
통합 테스트
    ↓
[이윤범] 카메라 옵션 기능 추가
    ↓
최종 테스트 및 배포
```

---

## 7. 구현 상세 내용

### 7.1 핵심 기능 구현

#### 7.1.1 이력서 업로드 및 텍스트 추출

```java
// ResumeService.java
public ResumeUploadResponseDto upload(MultipartFile file) throws IOException {
    // 1. 파일 검증
    // 2. PDFBox / Apache POI를 사용한 텍스트 추출
    // 3. 개인정보 파싱 (정규식 기반)
    // 4. DB 저장
    // 5. DTO 반환
}
```

**지원 파일 형식:**

- PDF: PDFBox 3.0.1
- DOCX/DOC: Apache POI 5.2.5
- TXT: 기본 문자열 처리

#### 7.1.2 AI 기반 질문 생성

```java
// OllamaService.java
public String generateQuestions(String resumeText, String category,
                                int questionCount, String difficulty) {
    // 1. 프롬프트 구성
    // 2. Ollama API 호출 (Spring WebFlux)
    // 3. JSON 응답 수신
    // 4. 반환
}
```

**Ollama 프롬프트 예시:**

```
당신은 면접관입니다. 다음 이력서를 기반으로 [카테고리] 면접 질문을
[난이도] 수준으로 [숫자]개 생성하세요.

이력서:
[resumeText]

JSON 형식으로 반환하세요:
{
  "questions": [
    {"text": "질문", "category": "카테고리", "timeLimit": 180}
  ]
}
```

#### 7.1.3 카메라 옵션 기능 (신규)

```java
// ResumeRequestDto.java
@Data
public class ResumeRequestDto {
    private String resumeId;
    private String category;
    private int questionCount;
    private String difficulty;
    private Boolean useCamera = true;  // ⭐ NEW
}

// InterviewSession.java
@Getter
@Builder
public class InterviewSession {
    // ... 기존 필드 ...
    private Boolean useCamera;  // ⭐ NEW
}
```

**프론트엔드 구현:**

```jsx
// Dashboard.jsx
const [useCamera, setUseCamera] = useState(true);

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

// 카메라 없으면 음성 모드로 표시
{
  !useCamera && <div>🎙️ 음성 면접 진행 중</div>;
}
```

### 7.2 데이터베이스 스키마

#### 7.2.1 주요 테이블

**RESUME 테이블**

```sql
CREATE TABLE RESUME (
    RESUME_ID          VARCHAR2(36) PRIMARY KEY,
    USER_ID            VARCHAR2(50),
    FILE_NAME          VARCHAR2(255),
    RAW_TEXT           CLOB,
    EXTRACTED_NAME     VARCHAR2(100),
    EXTRACTED_SKILLS   CLOB,
    EXTRACTED_EXP      CLOB,
    EXTRACTED_EDU      CLOB,
    CREATED_AT         TIMESTAMP DEFAULT SYSDATE,
    UPDATED_AT         TIMESTAMP DEFAULT SYSDATE
);
```

**INTERVIEW_SESSION 테이블**

```sql
CREATE TABLE INTERVIEW_SESSION (
    SESSION_ID         VARCHAR2(36) PRIMARY KEY,
    RESUME_ID          VARCHAR2(36),
    CATEGORY           VARCHAR2(50),
    QUESTION_COUNT     NUMBER,
    DIFFICULTY         VARCHAR2(20),
    USE_CAMERA         CHAR(1) DEFAULT 'Y',  -- ⭐ NEW
    STATUS             VARCHAR2(20) DEFAULT 'ACTIVE',
    STARTED_AT         TIMESTAMP DEFAULT SYSDATE,
    ENDED_AT           TIMESTAMP,
    FOREIGN KEY (RESUME_ID) REFERENCES RESUME(RESUME_ID)
);
```

**QUESTION 테이블**

```sql
CREATE TABLE QUESTION (
    QUESTION_ID        VARCHAR2(36) PRIMARY KEY,
    SESSION_ID         VARCHAR2(36),
    QUESTION_TEXT      CLOB,
    CATEGORY           VARCHAR2(50),
    TIME_LIMIT         NUMBER DEFAULT 180,
    SORT_ORDER         NUMBER,
    CREATED_AT         TIMESTAMP DEFAULT SYSDATE,
    FOREIGN KEY (SESSION_ID) REFERENCES INTERVIEW_SESSION(SESSION_ID)
);
```

**ANSWER 테이블**

```sql
CREATE TABLE ANSWER (
    ANSWER_ID          VARCHAR2(36) PRIMARY KEY,
    SESSION_ID         VARCHAR2(36),
    QUESTION_ID        VARCHAR2(36),
    VIDEO_BLOB         BLOB,
    AUDIO_BLOB         BLOB,
    SCORE              NUMBER(3),
    FEEDBACK           CLOB,
    KEYWORDS           VARCHAR2(500),
    SUBMITTED_AT       TIMESTAMP DEFAULT SYSDATE,
    FOREIGN KEY (SESSION_ID) REFERENCES INTERVIEW_SESSION(SESSION_ID),
    FOREIGN KEY (QUESTION_ID) REFERENCES QUESTION(QUESTION_ID)
);
```

### 7.3 API 명세서

| 메서드 | 엔드포인트                                   | 설명          | 요청                        | 응답                            |
| ------ | -------------------------------------------- | ------------- | --------------------------- | ------------------------------- |
| POST   | `/api/v1/interviews/resume/upload`           | 이력서 업로드 | MultipartFile               | resumeId, text, parsedInfo      |
| POST   | `/api/v1/interviews/sessions`                | 세션 생성     | ResumeRequestDto            | sessionId, startedAt, useCamera |
| GET    | `/api/v1/interviews/sessions/{id}`           | 세션 조회     | sessionId                   | InterviewSession                |
| GET    | `/api/v1/interviews/sessions/{id}/questions` | 질문 조회     | sessionId                   | List<Question>                  |
| POST   | `/api/v1/interviews/sessions/{id}/answers`   | 답변 제출     | sessionId, questionId, blob | answerId                        |
| GET    | `/api/v1/interviews/sessions/{id}/feedback`  | 피드백 조회   | sessionId                   | Feedback                        |
| PATCH  | `/api/v1/interviews/sessions/{id}/end`       | 세션 종료     | sessionId                   | -                               |

---

## 8. 시연 가이드

### 8.1 시연 순서 및 스크린샷 위치

프로젝트 데모 시 다음 순서로 진행하고, 각 단계마다 스크린샷을 첨부하세요.

#### **① 대시보드 진입 (Dashboard)**

- **설명**: 사용자가 애플리케이션에 처음 접속했을 때의 화면
- **시연 포인트**:
  - 로고 및 타이틀 표시 ("InterviewAI - AI 면접 시뮬레이터")
  - 좌측: 기기 확인 섹션
  - 우측: 이력서 업로드 및 면접 설정

**📸 스크린샷 위치: [Dashboard 초기 화면]**

```
프로젝트 폴더/screenshots/01_dashboard_initial.png
└─ 내용:
   - 웹캠 라이브 영상
   - 마이크 오디오 시각화
   - 카메라 사용 토글 (체크박스 표시)
```

---

#### **② 카메라 옵션 선택 (Camera Toggle)**

- **설명**: "카메라 사용" 체크박스를 체크/해제하는 모습
- **시연 포인트**:
  - ☑️ **카메라 사용**: 웹캠 프리뷰 및 기기 선택 표시
  - ☐ **카메라 미사용**: "음성 면접 진행" 안내 메시지 표시

**📸 스크린샷 위치: [카메라 사용 O] / [카메라 사용 X]**

```
프로젝트 폴더/screenshots/02_camera_enabled.png
├─ 내용: 체크박스 체크, 웹캠 프리뷰 활성화

프로젝트 폴더/screenshots/03_camera_disabled.png
└─ 내용: 체크박스 해제, "🎙️ 음성 면접 진행" 표시
```

---

#### **③ 이력서 업로드 (Resume Upload)**

- **설명**: PDF 또는 DOCX 이력서 파일 업로드 과정
- **시연 포인트**:
  - 드래그 앤 드롭 영역 표시
  - 파일 크기 및 형식 검증
  - 업로드 진행률 바
  - 파싱된 정보 (이름, 기술스택, 경력) 표시

**📸 스크린샷 위치: [업로드 전] / [업로드 진행] / [업로드 완료]**

```
프로젝트 폴더/screenshots/04_resume_dropzone.png
├─ 내용: "이력서를 드래그하거나 클릭"

프로젝트 폴더/screenshots/05_resume_uploading.png
├─ 내용: 진행 바 (30%, 50%, 100%)

프로젝트 폴더/screenshots/06_resume_completed.png
└─ 내용:
   ✓ 분석 완료 배지
   파싱된 정보: 이름, 기술스택, 경력
```

---

#### **④ 면접 설정 (Interview Configuration)**

- **설명**: 면접 카테고리, 난이도, 질문 수 선택
- **시연 포인트**:
  - 카테고리 선택: 일반/기술/행동/상황
  - 난이도 선택: 쉬움/보통/어려움
  - 질문 수 선택: 3/5/7/10개
  - "맞춤 음성 면접 시작하기" 버튼 (카메라 미사용 시)

**📸 스크린샷 위치: [면접 설정]**

```
프로젝트 폴더/screenshots/07_interview_settings.png
└─ 내용:
   - 선택된 카테고리 (하이라이트)
   - 난이도 버튼
   - 질문 수 선택
   - 시작 버튼 (활성화)
```

---

#### **⑤ 면접실 진입 (InterviewRoom)**

- **설명**: 면접이 시작되고 첫 번째 질문이 표시되는 화면
- **시연 포인트**:
  - 진행률 바 (1/5)
  - 타이머 표시
  - 질문 텍스트
  - 카메라 미사용 시: "🎙️ 음성 면접 진행 중" 표시
  - "답변 시작" 버튼

**📸 스크린샷 위치: [면접실 시작] / [음성 모드 표시]**

```
프로젝트 폴더/screenshots/08_interview_room_start.png
├─ 내용:
   - 진행률 바 (1/5)
   - 타이머 (3:00)
   - 첫 번째 질문

프로젝트 폴더/screenshots/09_interview_audio_mode.png
└─ 내용:
   - 🎙️ 음성 면접 진행 중 (카메라 미사용)
   - 마이크 오디오 시각화 (녹색 바)
```

---

#### **⑥ 면접 진행 (Interview In Progress)**

- **설명**: 사용자가 답변을 녹화하는 과정
- **시연 포인트**:
  - "답변 시작" 클릭 후 녹화 시작
  - 🔴 REC 표시 및 타이머 감소
  - 마이크 오디오 시각화 (활동)
  - 타이머 경고 (30초 이하)

**📸 스크린샷 위치: [녹화 중]**

```
프로젝트 폴더/screenshots/10_interview_recording.png
└─ 내용:
   - 🔴 REC 표시
   - 실시간 타이머 (2:15)
   - 오디오 시각화 (활동)
   - "다음 질문으로" 버튼 (활성화)
```

---

#### **⑦ 타이머 만료 및 다음 질문 (Auto Submission)**

- **설명**: 타이머가 만료되어 자동으로 답변이 제출되고 다음 질문으로 전환
- **시연 포인트**:
  - 업로드 진행 바 (제출 중)
  - 진행률 바 업데이트 (2/5)
  - 새로운 질문 표시

**📸 스크린샷 위치: [업로드 중] / [다음 질문]**

```
프로젝트 폴더/screenshots/11_answer_uploading.png
├─ 내용: 업로드 진행 바 (업로드 중... 65%)

프로젝트 폴더/screenshots/12_next_question.png
└─ 내용:
   - 진행률 바 (2/5)
   - 두 번째 질문
   - 새 타이머 시작
```

---

#### **⑧ 마지막 질문 (Final Question)**

- **설명**: 마지막 질문이 표시되고 완료 버튼이 표시되는 화면
- **시연 포인트**:
  - 진행률 바 (5/5 또는 거의 끝)
  - "답변 완료 (제출)" 버튼

**📸 스크린샷 위치: [마지막 질문]**

```
프로젝트 폴더/screenshots/13_final_question.png
└─ 내용:
   - 진행률 바 (5/5)
   - 마지막 질문 텍스트
   - "답변 완료 (제출)" 버튼
```

---

#### **⑨ 피드백 페이지 (Feedback)**

- **설명**: 면접 완료 후 AI 피드백 및 평가 리포트
- **시연 포인트**:
  - 종합 점수 표시 (0-100)
  - 질문별 점수 및 피드백
  - 핵심 키워드
  - 개선 사항 제안
  - 재시도 버튼

**📸 스크린샷 위치: [피드백 리포트]**

```
프로젝트 폴더/screenshots/14_feedback_overall.png
├─ 내용:
   - 종합 점수 (예: 82/100)
   - 점수 게이지
   - 평가 등급

프로젝트 폴더/screenshots/15_feedback_questions.png
├─ 내용:
   - Q1: 자기소개 (85점, 피드백)
   - Q2: 지원동기 (78점, 피드백)
   - Q3: 강점 약점 (80점, 피드백)

프로젝트 폴더/screenshots/16_feedback_suggestions.png
└─ 내용:
   - 핵심 키워드: 리더십, 문제해결, 팀웍
   - 개선 사항 (3가지)
   - 재시도 버튼
```

---

### 8.2 스크린샷 디렉토리 구조

```
프로젝트 루트/
├── screenshots/
│   ├── 01_dashboard_initial.png
│   ├── 02_camera_enabled.png
│   ├── 03_camera_disabled.png
│   ├── 04_resume_dropzone.png
│   ├── 05_resume_uploading.png
│   ├── 06_resume_completed.png
│   ├── 07_interview_settings.png
│   ├── 08_interview_room_start.png
│   ├── 09_interview_audio_mode.png
│   ├── 10_interview_recording.png
│   ├── 11_answer_uploading.png
│   ├── 12_next_question.png
│   ├── 13_final_question.png
│   ├── 14_feedback_overall.png
│   ├── 15_feedback_questions.png
│   └── 16_feedback_suggestions.png
│
└── PROJECT_REPORT.md (본 파일)
```

### 8.3 보고서에 스크린샷 삽입 방법

마크다운에서 스크린샷을 삽입할 때는 다음과 같이 작성하세요:

```markdown
## 시연 결과

### 1단계: 대시보드 초기 화면

![Dashboard Initial](./screenshots/01_dashboard_initial.png)
_캡션: 애플리케이션 시작 화면 - 웹캠 라이브, 마이크 테스트, 카메라 토글_

### 2단계: 카메라 미사용 모드

![Camera Disabled](./screenshots/03_camera_disabled.png)
_캡션: 카메라 체크박스 해제 시 "음성 면접 진행" 안내_

### 3단계: 이력서 업로드 완료

![Resume Completed](./screenshots/06_resume_completed.png)
_캡션: 파싱된 정보 (이름, 기술스택, 경력) 표시_

... (계속)
```

### 8.4 시연 시 확인할 핵심 포인트

| 항목             | 확인 사항                | 중요도 |
| ---------------- | ------------------------ | ------ |
| **카메라 옵션**  | 체크/해제 시 UI 변경     | ⭐⭐⭐ |
| **이력서 파싱**  | 개인정보 정확성          | ⭐⭐⭐ |
| **AI 질문 생성** | 이력서 기반 맞춤성       | ⭐⭐⭐ |
| **음성 녹화**    | 마이크 입력 감지         | ⭐⭐   |
| **타이머 작동**  | 정확한 시간 카운트       | ⭐⭐   |
| **자동 제출**    | 타이머 만료 시 자동 처리 | ⭐⭐⭐ |
| **피드백 생성**  | AI 분석 결과 표시        | ⭐⭐⭐ |
| **에러 처리**    | 네트워크 오류 대응       | ⭐⭐   |

### 8.5 시연 데모용 샘플 이력서

시연용으로 다음 내용의 샘플 이력서(PDF/DOCX)를 준비하세요:

```
[샘플 이력서]

이름: 김준호
연락처: 010-1234-5678
이메일: kim.junho@email.com

경력사항:
- (2021.01 ~ 2023.12) 소프트웨어 엔지니어 - OO회사
  · Spring Boot 기반 백엔드 시스템 개발
  · React 프론트엔드 개발
  · 팀 리더로서 5명 팀 관리

기술 스택:
- 백엔드: Java, Spring Boot, MyBatis, Oracle
- 프론트엔드: React, JavaScript, HTML/CSS
- 도구: Git, Docker, Kubernetes
- 데이터베이스: Oracle, MySQL

학력:
- 2020.02 학사학위 졸업 - 컴퓨터공학과
- 평점: 3.8/4.0
```

---

## 9. 주요 성과 및 학습점

### 9.1 기술적 성과

✅ **Spring Boot 4.0 기반의 확장 가능한 REST API 설계**

- 명확한 계층 분리 (Controller → Service → Mapper)
- 재사용 가능한 DTO 및 Entity 설계

✅ **React/Vite 기반의 고성능 SPA 구축**

- 실시간 미디어 처리 (WebRTC API 활용)
- 효율적인 상태 관리 (React Hooks)

✅ **Ollama LLM 외부 API 연동**

- 비동기 HTTP 통신 구현 (Spring WebFlux)
- 프롬프트 엔지니어링을 통한 질 높은 질문 생성

✅ **멀티 포맷 파일 처리**

- PDFBox를 통한 PDF 텍스트 추출
- Apache POI를 통한 DOCX 처리

✅ **카메라 옵션 기능 구현**

- 동적 유효성 검사 및 조건부 UI 렌더링
- sessionStorage를 활용한 상태 관리

### 9.2 협업 학습점

🤝 **버전 관리와 코드 리뷰**

- Git 기반 협업 프로세스
- 명확한 커밋 메시지 작성의 중요성

🤝 **API 명세 및 문서화**

- 프론트엔드/백엔드 간 명확한 인터페이스 정의
- 스웨거(Swagger) 문서 작성의 필요성

🤝 **전체 스택 이해**

- 데이터베이스부터 프론트엔드까지의 전 과정 이해
- 각 계층 간 데이터 흐름 파악

---

## 10. 향후 개선 사항

### 10.1 기능 확장

- [ ] **사용자 계정 관리**: 로그인/회원가입 기능
- [ ] **면접 기록 저장**: 과거 면접 결과 조회 및 비교
- [ ] **음성 텍스트 변환**: STT를 통한 답변 텍스트화
- [ ] **실시간 점수 피드백**: 면접 진행 중 실시간 평가
- [ ] **다양한 LLM 지원**: GPT, Claude 등 다중 모델 선택
- [ ] **모바일 최적화**: 반응형 디자인 개선
- [ ] **다국어 지원**: 영어, 중국어 등 다국어 면접

### 10.2 성능 개선

- [ ] **캐싱 전략**: Redis를 통한 응답 시간 개선
- [ ] **비디오 압축**: H.264 코덱 적용
- [ ] **데이터베이스 최적화**: 인덱스 추가, 쿼리 최적화
- [ ] **로드 밸런싱**: 다중 백엔드 서버 지원

### 10.3 보안 강화

- [ ] **JWT 인증**: OAuth 2.0 기반 토큰 인증
- [ ] **데이터 암호화**: 민감 정보 암호화 저장
- [ ] **HTTPS 적용**: SSL/TLS 인증서
- [ ] **XSS/CSRF 방어**: 보안 헤더 추가

---

## 11. 결론

본 프로젝트는 Spring Boot와 React를 활용하여 현대적이고 확장 가능한 AI 기반 면접 시뮬레이션 플랫폼을 성공적으로 구축했습니다.

특히 **카메라 옵션 기능**을 통해 다양한 사용자 환경을 지원하며, **Ollama LLM 연동**을 통해 개인화된 면접 경험을 제공합니다.

향후 사용자 계정 관리, 음성 텍스트 변환, 실시간 피드백 등의 기능을 추가하면 더욱 강력한 취업 준비 플랫폼으로 발전할 것으로 기대됩니다.

---

## 12. 참고 자료

### 12.1 기술 문서

- [Spring Boot 공식 문서](https://spring.io/projects/spring-boot)
- [React 공식 문서](https://react.dev)
- [MyBatis 공식 문서](https://mybatis.org)
- [Vite 공식 문서](https://vitejs.dev)
- [Ollama 공식 가이드](https://github.com/ollama/ollama)

### 12.2 라이브러리 문서

- [PDFBox](https://pdfbox.apache.org)
- [Apache POI](https://poi.apache.org)
- [Jackson](https://github.com/FasterXML/jackson)
- [Axios](https://axios-http.com)

---

**문서 작성일**: 2026년 6월 1일  
**최종 수정일**: 2026년 6월 1일  
**작성자**: 개발팀 (최재화, 이윤범)

---
