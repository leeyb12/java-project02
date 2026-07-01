import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserMedia } from "../../hooks/useUserMedia";
import { useMediaRecorder } from "../../hooks/useMediaRecorder";
import { useFaceExpression } from "../../hooks/useFaceExpression";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import WebcamPreview from "../../components/interview/WebcamPreview";
import AudioVisualizer from "../../components/interview/AudioVisualizer";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import {
  fetchQuestions,
  submitAnswer,
  endSession,
  analyzeAppearance,
} from "../../services/interviewService";
import {
  captureFrame,
  expressionLabel,
  EXPRESSION_EMOJI,
} from "../../utils/vision";
import "./InterviewRoom.css";

/** 세션별 복장·표정 분석 결과 sessionStorage 키 */
const ANALYSIS_KEY = (sid) => `interviewAnalysis_${sid || "demo"}`;

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

  /* 표정 감지 훅 (브라우저 face-api) */
  const faceExpr = useFaceExpression();

  /* 답변 음성 → 텍스트 변환 (브라우저 STT) */
  const speech = useSpeechRecognition({ lang: "ko-KR" });

  /* 표정 감지 및 프레임 캡처용 숨김 video 엘리먼트 */
  const detectVideoRef = useRef(null);

  /* 질문별 복장·표정 분석 누적 결과 */
  const analysisRef = useRef([]);

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

  /* 표정 감지/캡처용 숨김 video에 스트림 연결 */
  useEffect(() => {
    const v = detectVideoRef.current;
    if (!v) return;
    if (useCamera && stream) {
      v.srcObject = stream;
      v.play().catch(() => {});
    } else {
      v.srcObject = null;
    }
    return () => {
      if (v) v.srcObject = null;
    };
  }, [stream, useCamera]);

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

      /* 답변 음성 → 텍스트 (STT) 종료 및 최종 텍스트 확보 */
      const answerText = speech.stop();

      /* 복장·표정 분석 (카메라 사용 시): 프레임 1장 캡처 + 표정 요약 */
      let frame = null;
      let expressionSummary = null;
      if (useCamera) {
        frame = captureFrame(detectVideoRef.current);
        expressionSummary = faceExpr.summarize();
        faceExpr.stop();
      }

      /* 표정 요약 → 행동 코멘트 문자열 */
      const behavior = expressionSummary
        ? `${expressionLabel(expressionSummary.dominant)} 표정 위주(집중도 ${Math.round(
            (expressionSummary.stability ?? 0) * 100,
          )}%)`
        : null;

      const questionText =
        currentQuestion.questionText ?? currentQuestion.text ?? "";

      /* 답변 업로드(+AI 평가) + 복장 분석을 병렬 수행 (분석 실패는 무시) */
      const tasks = [];
      if (sessionId) {
        tasks.push(
          submitAnswer(sessionId, currentQuestion.id, blob, {
            answerText,
            questionText,
            behavior,
            onUploadProgress: setUploadProgress,
          }),
        );
      }

      let clothing = null;
      if (frame && sessionId) {
        tasks.push(
          analyzeAppearance(sessionId, {
            questionId: currentQuestion.id,
            imageBase64: frame,
          })
            .then((res) => {
              clothing = res?.clothing ?? null;
            })
            .catch(() => {
              /* 비전 모델 미설치/실패 시 조용히 무시 */
            }),
        );
      }
      await Promise.allSettled(tasks);

      /* 질문별 분석 결과 누적 + sessionStorage 저장 */
      if (useCamera && (expressionSummary || clothing)) {
        analysisRef.current.push({
          questionId: currentQuestion.id,
          questionText: currentQuestion.questionText,
          expression: expressionSummary,
          clothing,
        });
        try {
          sessionStorage.setItem(
            ANALYSIS_KEY(sessionId),
            JSON.stringify(analysisRef.current),
          );
        } catch {
          /* 저장 실패 무시 */
        }
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
    useCamera,
    faceExpr,
    speech,
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
    if (useCamera) faceExpr.start(detectVideoRef.current);
    speech.start(); // 답변 음성 → 텍스트 변환 시작
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

          {/* 표정 감지/프레임 캡처용 숨김 video */}
          <video
            ref={detectVideoRef}
            autoPlay
            playsInline
            muted
            style={{ display: "none" }}
          />

          {/* 실시간 표정 표시 */}
          {useCamera && phase === "answering" && (
            <div className="interview-room__expression">
              <span className="interview-room__expression-label">
                실시간 표정
              </span>
              {faceExpr.current ? (
                <span className="interview-room__expression-value">
                  {EXPRESSION_EMOJI[faceExpr.current.dominant] || "🙂"}{" "}
                  {expressionLabel(faceExpr.current.dominant)}
                </span>
              ) : (
                <span className="interview-room__expression-value interview-room__expression-value--muted">
                  {faceExpr.ready ? "얼굴 인식 중..." : "표정 분석 준비 중..."}
                </span>
              )}
            </div>
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

                {/* 실시간 답변 자막 (STT) */}
                {phase === "answering" && speech.supported && (
                  <div className="interview-room__transcript">
                    <span className="interview-room__transcript-label">
                      📝 실시간 답변 인식
                    </span>
                    <p className="interview-room__transcript-text">
                      {speech.transcript || "말씀하시면 자동으로 텍스트로 변환됩니다..."}
                    </p>
                  </div>
                )}

                {phase === "answering" && !speech.supported && (
                  <p className="interview-room__hint">
                    ⚠️ 이 브라우저는 음성 인식을 지원하지 않아 답변 텍스트가
                    저장되지 않습니다. (Chrome 권장)
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
