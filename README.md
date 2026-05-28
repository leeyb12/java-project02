# Interview Simulation Project

Java Spring Boot 백엔드와 React/Vite 프론트엔드가 결합된 면접 시뮬레이션 프로젝트입니다. 이 프로젝트는 이력서 업로드, AI 기반 질문 생성, 면접 세션 관리, 녹화 답변 제출 및 피드백 확인 기능을 제공합니다.

---

## 프로젝트 구조

- `Backend/`
  - Spring Boot 4 기반 서버 애플리케이션
  - MyBatis + Oracle JDBC를 사용한 데이터 액세스
  - Ollama AI 서버와 연동하여 질문을 생성
  - `application.properties`에서 Oracle DB 및 Ollama 설정 관리
- `Frontend/`
  - React + Vite 기반 SPA
  - 면접 대시보드, 인터뷰룸, 피드백 화면을 포함
  - `axios`를 사용해 백엔드 API와 통신

---

## 주요 기능

- 이력서 업로드(PDF / DOCX)
- 이력서 텍스트 추출(PDFBox, Apache POI)
- Ollama LLM 기반 맞춤형 면접 질문 생성
- 면접 난이도 선택: 쉬움 / 보통 / 어려움
- 면접 세션 생성, 조회, 종료 처리
- 질문 목록 조회 및 답변 제출
- 면접 피드백 리포트 조회

---

## 요구사항

- Java 21
- Gradle
- Node.js / npm
- Oracle DB (예: `localhost:1521/xe`)
- Ollama 서버

---

## 백엔드 설정

### 1. DB 연결

`Backend/src/main/resources/application.properties`에서 다음 설정을 프로젝트 환경에 맞게 수정하세요.

```properties
spring.datasource.url=jdbc:oracle:thin:@localhost:1521:xe
spring.datasource.username=interview
spring.datasource.password=1234
```

### 2. Ollama 설정

```properties
ollama.api.url=http://localhost:11434
ollama.model.name=qwen3.5:4b
```

- Ollama 서버가 실행 중이어야 합니다.
- 모델명은 환경에 맞게 변경할 수 있습니다.

### 3. 백엔드 실행

```bash
cd Backend
./gradlew bootRun
```

윈도우에서는 `gradlew.bat bootRun`을 사용하세요.

---

## 면접 설정 옵션

`Dashboard` 페이지에서 다음 옵션을 선택할 수 있습니다.

- 면접 카테고리: 일반 / 기술 / 행동 / 상황
- 질문 수: 3 / 5 / 7 / 10
- 난이도: 쉬움 / 보통 / 어려움
- 이력서 업로드 여부에 따라 AI 맞춤 질문 포함 여부 결정

---

## 프론트엔드 설정

### 1. 패키지 설치

```bash
cd Frontend
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. API 기본 URL 변경

기본값은 `http://localhost:8080/api/v1`입니다. 다른 URL을 사용하려면 `VITE_API_BASE_URL` 환경 변수를 설정하세요.

예시:

```bash
set VITE_API_BASE_URL=http://localhost:8080/api/v1
npm run dev
```

---

## 주요 API 엔드포인트

- `POST /api/v1/interviews/sessions` - 면접 세션 생성 (`category`, `difficulty`, `questionCount`, `resumeId`)
- `GET /api/v1/interviews/sessions/{sessionId}` - 세션 조회
- `PATCH /api/v1/interviews/sessions/{sessionId}/end` - 세션 종료
- `GET /api/v1/interviews/sessions/{sessionId}/questions` - 세션 질문 목록 조회
- `POST /api/v1/interviews/sessions/{sessionId}/answers` - 답변 제출
- `GET /api/v1/interviews/sessions/{sessionId}/feedback` - 피드백 조회
- `POST /api/v1/interviews/resume/upload` - 이력서 업로드
- `POST /api/v1/interviews/resume/generate-questions` - 이력서 기반 질문 생성 (`category`, `difficulty`, `questionCount`, `resumeId`)

---

## 실행 순서 예시

1. Oracle DB가 실행 중인지 확인
2. Ollama 서버 실행
3. `Backend/`에서 백엔드 실행
4. `Frontend/`에서 프론트엔드 실행
5. 웹 브라우저에서 `http://localhost:5173` 접속

---

## 폴더 요약

- `Backend/src/main/java/com/pknu26/interview/`
  - `controller/` - HTTP 요청 핸들러
  - `service/` - 비즈니스 로직
  - `repository/` - MyBatis 매퍼 인터페이스
  - `dto/` - 데이터 전송 객체
  - `entity/` - DB 엔티티
- `Frontend/src/`
  - `pages/` - 화면 컴포넌트
  - `components/` - 재사용 컴포넌트
  - `services/` - API 호출 추상화

---

## 참고

- 프론트엔드는 React Router 기반으로 `/dashboard`, `/interview/:sessionId`, `/feedback/:sessionId` 경로를 사용합니다.
- 백엔드 `application.properties`에서 `spring.servlet.multipart.max-file-size`와 `max-request-size`가 업로드 용량을 허용하도록 설정되어 있습니다.
- `Backend/build.gradle`에는 Oracle JDBC, MyBatis, Spring WebFlux, PDFBox, Apache POI 등이 포함되어 있습니다.
