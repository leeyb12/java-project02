-- [1] 면접 세션 테이블: 면접의 큰 틀을 저장
CREATE TABLE INTERVIEW_SESSIONS (
    SESSION_ID    VARCHAR2(50)  PRIMARY KEY,    -- UUID 또는 고유 ID
    MEMBER_ID     VARCHAR2(50)  NOT NULL,       -- 사용자 ID
    RESUME_CONTENT CLOB          NOT NULL,       -- PDF에서 추출한 이력서 텍스트
    JOB_CATEGORY  VARCHAR2(100),                -- 지원 직군 (예: 백엔드 개발자)
    CREATED_AT    TIMESTAMP     DEFAULT SYSDATE -- 생성 일시
);

-- [2] 면접 상세 테이블: 각 질문과 답변, 피드백을 저장
CREATE TABLE INTERVIEW_DETAILS (
    DETAIL_ID     NUMBER        PRIMARY KEY,    -- 시퀀스로 증가할 ID
    SESSION_ID    VARCHAR2(50)  NOT NULL,       -- 세션 테이블 외래키
    QUESTION_TEXT CLOB          NOT NULL,       -- AI가 생성한 질문
    USER_ANSWER   CLOB,                         -- 사용자가 입력한 답변
    AI_EVALUATION CLOB,                         -- AI의 평가/피드백
    SCORE         NUMBER(3),                    -- 문항별 점수 (0-100)
    SORT_ORDER    NUMBER,                       -- 질문 노출 순서
    CONSTRAINT FK_SESSION_DETAIL FOREIGN KEY (SESSION_ID) 
    REFERENCES INTERVIEW_SESSIONS(SESSION_ID) ON DELETE CASCADE
);

CREATE SEQUENCE SEQ_DETAIL_ID 
START WITH 1 
INCREMENT BY 1 
NOCACHE;

COMMIT;