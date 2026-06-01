import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserMedia } from "../../hooks/useUserMedia";
import { useMediaRecorder } from "../../hooks/useMediaRecorder";
import WebcamPreview from "../../components/interview/WebcamPreview";
import AudioVisualizer from "../../components/interview/AudioVisualizer";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import {
  fetchQuestions,
  submitAnswer,
  endSession,
} from "../../services/interviewService";
import "./InterviewRoom.css";

const DEFAULT_TIME_LIMIT = 180; // 기본 3분 (초)

/**
 * InterviewRoom 페이지
 * [진행] 타이머, 질문, 웹캠 연동 면접실
 */
export default function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  /* 웹캠 사용 여부 (sessionStorage에서 읽기) */
  const [useCamera, setUseCamera] = useState(
    sessionStorage.getItem("interviewUseCamera") !== "false",
  );

  /* 미디어 훅 */
  const {
    stream,
    status: mediaStatus,
    start: startMedia,
  } = useUserMedia({ video: useCamera, audio: true }); // 동적으로 비디오 설정
  const {
    status: recStatus,
    duration: recDuration,
    start: startRecording,
    stop: stopRecording,
    reset: resetRecording,
  } = useMediaRecorder(stream);

  /* 면접 상태 */
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("loading"); // 'loading' | 'ready' | 'thinking' | 'answering' | 'submitting' | 'done'
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_LIMIT);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* UI 상태 */
  const [showExitModal, setShowExitModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  /* 초기 데이터 로드 */
  useEffect(() => {
    const init = async () => {
      try {
        // sessionStorage에서 useCamera 설정 읽기
        const cameraUsage = sessionStorage.getItem("interviewUseCamera");
        if (cameraUsage !== null) {
          setUseCamera(cameraUsage !== "false");
        }

        await startMedia();
        if (sessionId) {
          const qs = await fetchQuestions(sessionId);
          setQuestions(qs);
        } else {
          /* 개발용 더미 질문 */
          setQuestions([
            {
              id: "q1",
              text: "자기소개를 해주세요.",
              category: "일반",
              timeLimit: 120,
            },
            {
              id: "q2",
              text: "지원 동기가 무엇인가요?",
              category: "일반",
              timeLimit: 180,
            },
            {
              id: "q3",
              text: "본인의 강점과 약점을 말해주세요.",
              category: "행동",
              timeLimit: 180,
            },
          ]);
        }
        setPhase("ready");
      } catch (err) {
        setError(err.message);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  /* 타이머 관리 */
  const clearTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  /* 답변 제출 */
  const handleSubmitAnswer = useCallback(async () => {
    if (isSubmitting) return;
    clearTimer();
    setIsSubmitting(true);
    setPhase("submitting");

    try {
      const blob = await stopRecording();

      if (blob && sessionId) {
        await submitAnswer(sessionId, currentQuestion.id, blob, {
          onUploadProgress: setUploadProgress,
        });
      }

      resetRecording();
      setUploadProgress(0);

      if (isLastQuestion) {
        if (sessionId) await endSession(sessionId);
        navigate(`/feedback/${sessionId || ""}`);
      } else {
        setCurrentIndex((prev) => prev + 1);
        setPhase("ready");
      }
    } catch (err) {
      setError(err.message);
      setPhase("answering");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    clearTimer,
    stopRecording,
    sessionId,
    currentQuestion,
    resetRecording,
    isLastQuestion,
    navigate,
  ]);

  /* 최신 handleSubmitAnswer를 ref로 유지 — interval 클로저에서 stale 참조 방지 */
  const submitRef = useRef(handleSubmitAnswer);
  useEffect(() => {
    submitRef.current = handleSubmitAnswer;
  }, [handleSubmitAnswer]);

  const startTimer = useCallback(
    (limit) => {
      clearTimer();
      setTimeLeft(limit);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            /* setState 대신 interval 콜백 안에서 직접 호출 — effect 연쇄 없음 */
            submitRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer],
  );

  /* 언마운트 정리 */
  useEffect(() => () => clearTimer(), [clearTimer]);

  /* 답변 시작 */
  const handleStartAnswer = () => {
    const limit = currentQuestion?.timeLimit ?? DEFAULT_TIME_LIMIT;
    setPhase("answering");
    startRecording();
    startTimer(limit);
  };

  /* 면접 종료 (중도 이탈) */
  const handleExit = async () => {
    clearTimer();
    if (sessionId) await endSession(sessionId).catch(() => {});
    navigate("/dashboard");
  };

  /* 시간 포맷 */
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timerWarning = timeLeft <= 30 && phase === "answering";

  if (error) {
    return (
      <div className="interview-room interview-room--error">
        <p className="interview-room__error-msg">
          오류가 발생했습니다: {error}
        </p>
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          대기실로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="interview-room">
      {/* 상단 헤더 바 */}
      <header className="interview-room__header">
        <div className="interview-room__progress">
          <span className="interview-room__progress-label">질문</span>
          <div className="interview-room__progress-bar">
            <div
              className="interview-room__progress-fill"
              style={{
                width: `${questions.length ? ((currentIndex + (phase === "done" ? 1 : 0)) / questions.length) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="interview-room__progress-count">
            {currentIndex + 1} / {questions.length || "?"}
          </span>
        </div>

        {/* 타이머 */}
        <div
          className={`interview-room__timer ${timerWarning ? "interview-room__timer--warning" : ""}`}
        >
          <span className="interview-room__timer-icon">⏱</span>
          {formatTime(timeLeft)}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowExitModal(true)}
        >
          종료
        </Button>
      </header>

      <div className="interview-room__body">
        {/* 왼쪽: 웹캠 & 오디오 */}
        <aside className="interview-room__sidebar">
          {useCamera && (
            <WebcamPreview
              stream={stream}
              overlay={
                recStatus === "recording" && (
                  <div className="interview-room__rec-indicator">
                    <span className="interview-room__rec-dot" />
                    REC {formatTime(recDuration)}
                  </div>
                )
              }
            />
          )}

          {!useCamera && (
            <div
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                borderRadius: "12px",
                padding: "32px 16px",
                textAlign: "center",
                color: "var(--color-text-secondary)",
                marginBottom: "12px",
              }}
            >
              <p style={{ fontSize: "48px", marginBottom: "12px" }}>🎙</p>
              <p style={{ fontWeight: 500, marginBottom: "8px" }}>
                음성 면접 진행 중
              </p>
              <p style={{ fontSize: "0.875rem" }}>마이크로만 진행됩니다.</p>
              {recStatus === "recording" && (
                <p
                  style={{
                    marginTop: "12px",
                    color: "var(--color-primary)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  🔴 녹화 중 {formatTime(recDuration)}
                </p>
              )}
            </div>
          )}

          <AudioVisualizer
            stream={stream}
            active={recStatus === "recording"}
            height={52}
            barCount={36}
            style={{ marginTop: "12px" }}
          />

          {/* 업로드 진행률 */}
          {phase === "submitting" && (
            <div className="interview-room__upload">
              <p className="interview-room__upload-label">
                업로드 중... {uploadProgress}%
              </p>
              <div className="interview-room__upload-bar">
                <div
                  className="interview-room__upload-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </aside>

        {/* 오른쪽: 질문 & 컨트롤 */}
        <main className="interview-room__main">
          {phase === "loading" && (
            <div className="interview-room__loading">
              <div className="interview-room__spinner" />
              <p>면접을 준비하고 있습니다...</p>
            </div>
          )}

          {(phase === "ready" ||
            phase === "thinking" ||
            phase === "answering" ||
            phase === "submitting") &&
            currentQuestion && (
              <>
                {/* 질문 카테고리 */}
                <div className="interview-room__category-badge">
                  {currentQuestion.category}
                </div>

                {/* 질문 텍스트 */}
                <h1 className="interview-room__question">
                  {currentQuestion.questionText}
                </h1>

                {/* 상태별 안내 */}
                {phase === "ready" && (
                  <p className="interview-room__hint">
                    준비가 되면 아래 버튼을 눌러 답변을 시작하세요. 답변은
                    자동으로 녹화됩니다.
                  </p>
                )}

                {phase === "answering" && (
                  <p className="interview-room__hint interview-room__hint--recording">
                    🔴 녹화 중 — 타이머가 종료되면 자동으로 제출됩니다.
                  </p>
                )}

                {/* 액션 버튼 */}
                <div className="interview-room__actions">
                  {phase === "ready" && (
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={useCamera && mediaStatus !== "active"}
                      onClick={handleStartAnswer}
                      leftIcon={<span>▶</span>}
                    >
                      답변 시작
                    </Button>
                  )}

                  {phase === "answering" && (
                    <Button
                      variant="secondary"
                      size="lg"
                      loading={isSubmitting}
                      onClick={handleSubmitAnswer}
                      leftIcon={<span>■</span>}
                    >
                      {isLastQuestion ? "답변 완료 (제출)" : "다음 질문으로"}
                    </Button>
                  )}

                  {phase === "submitting" && (
                    <Button variant="secondary" size="lg" disabled loading>
                      제출 중...
                    </Button>
                  )}
                </div>
              </>
            )}
        </main>
      </div>

      {/* 종료 확인 모달 */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="면접을 종료할까요?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowExitModal(false)}>
              계속하기
            </Button>
            <Button variant="danger" onClick={handleExit}>
              종료하기
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
          지금 종료하면 현재 진행 중인 답변이 저장되지 않을 수 있습니다. 정말
          종료하시겠습니까?
        </p>
      </Modal>
    </div>
  );
}
