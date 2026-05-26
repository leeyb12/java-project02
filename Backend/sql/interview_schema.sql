-- ============================================================
--  Oracle 전용 DDL
--  실행 순서: resumes → interview_sessions
-- ============================================================

-- ── 기존 테이블 삭제 (재실행 시) ────────────────────────────────
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE interview_sessions CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE resumes CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

-- ── 이력서 테이블 ──────────────────────────────────────────────
CREATE TABLE resumes (
    id               VARCHAR2(36)   NOT NULL,
    file_name        VARCHAR2(255)  NOT NULL,
    raw_text         CLOB,
    parsed_info_json CLOB,
    created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_resumes PRIMARY KEY (id)
);

COMMENT ON TABLE  resumes              IS '이력서';
COMMENT ON COLUMN resumes.id           IS '이력서 UUID';
COMMENT ON COLUMN resumes.file_name    IS '원본 파일명';
COMMENT ON COLUMN resumes.raw_text     IS '추출된 전체 텍스트';
COMMENT ON COLUMN resumes.parsed_info_json IS 'Ollama 파싱 결과 JSON';
COMMENT ON COLUMN resumes.created_at   IS '업로드 일시';

-- ── 면접 세션 테이블 ────────────────────────────────────────────
CREATE TABLE interview_sessions (
    id             VARCHAR2(36)  NOT NULL,
    resume_id      VARCHAR2(36),
    category       VARCHAR2(50)  NOT NULL,
    question_count NUMBER(3)     DEFAULT 5 NOT NULL,
    status         VARCHAR2(20)  DEFAULT 'active' NOT NULL,
    started_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at       TIMESTAMP,
    CONSTRAINT pk_interview_sessions PRIMARY KEY (id),
    CONSTRAINT fk_session_resume
        FOREIGN KEY (resume_id) REFERENCES resumes(id)
        ON DELETE SET NULL,
    CONSTRAINT chk_status
        CHECK (status IN ('active', 'ended'))
);

COMMENT ON TABLE  interview_sessions               IS '면접 세션';
COMMENT ON COLUMN interview_sessions.id            IS '세션 UUID';
COMMENT ON COLUMN interview_sessions.resume_id     IS '연결된 이력서 ID (없으면 NULL)';
COMMENT ON COLUMN interview_sessions.category      IS '면접 카테고리';
COMMENT ON COLUMN interview_sessions.question_count IS '질문 수';
COMMENT ON COLUMN interview_sessions.status        IS '세션 상태 (active/ended)';
COMMENT ON COLUMN interview_sessions.started_at    IS '시작 일시';
COMMENT ON COLUMN interview_sessions.ended_at      IS '종료 일시';

-- 💡 면접 질문 상세 테이블(INTERVIEW_DETAILS) 생성
CREATE TABLE INTERVIEW_DETAILS (
    DETAIL_ID     NUMBER PRIMARY KEY,                  -- 질문 PK (시퀀스로 증가)
    SESSION_ID    VARCHAR2(100) NOT NULL,              -- 면접 세션 ID (외래키 역할)
    QUESTION_TEXT VARCHAR2(4000) NOT NULL,             -- AI가 생성한 질문 내용
    USER_ANSWER   CLOB,                                -- 사용자의 답변 데이터
    AI_EVALUATION CLOB,                                -- AI 피드백/평가 결과
    SCORE         NUMBER,                              -- 해당 질문 점수
    SORT_ORDER    NUMBER NOT NULL                      -- 질문 순서 (1, 2, 3...)
);