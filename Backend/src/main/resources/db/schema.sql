-- =====================================================================
-- 면접 시뮬레이터 추가 테이블 DDL (Oracle)
-- 실행: SQL*Plus / SQL Developer 등에서 interview 스키마로 접속 후 실행
-- =====================================================================

-- 답변 + AI 평가 결과
CREATE TABLE INTERVIEW_ANSWERS (
    ANSWER_ID     VARCHAR2(36)  PRIMARY KEY,       -- UUID
    SESSION_ID    VARCHAR2(64)  NOT NULL,          -- 세션 ID
    QUESTION_ID   VARCHAR2(64),                    -- 질문 ID
    QUESTION_TEXT CLOB,                            -- 질문 본문
    ANSWER_TEXT   CLOB,                            -- STT로 변환된 답변 텍스트
    VIDEO_PATH    VARCHAR2(500),                   -- 저장된 녹화본 파일 경로
    SCORE         NUMBER(3),                       -- AI 점수 (0~100)
    STRENGTHS     CLOB,                            -- 잘한 점 (JSON 배열 문자열)
    IMPROVEMENTS  CLOB,                            -- 고쳐야 할 점 (JSON 배열 문자열)
    PRONUNCIATION VARCHAR2(1000),                  -- 발음/전달력 코멘트
    BEHAVIOR      VARCHAR2(1000),                  -- 행동/표정 코멘트
    CREATED_AT    TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX IDX_ANSWERS_SESSION ON INTERVIEW_ANSWERS (SESSION_ID);

-- 오답노트 (사용자가 담은 항목)
CREATE TABLE WRONG_NOTE (
    NOTE_ID       VARCHAR2(36)  PRIMARY KEY,       -- UUID
    SESSION_ID    VARCHAR2(64),
    QUESTION_ID   VARCHAR2(64),
    QUESTION_TEXT CLOB,
    ANSWER_TEXT   CLOB,
    IMPROVEMENTS  CLOB,                            -- 개선점 (JSON 배열 문자열)
    SCORE         NUMBER(3),
    CREATED_AT    TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX IDX_WRONGNOTE_SESSION ON WRONG_NOTE (SESSION_ID);
