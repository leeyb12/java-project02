import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserMedia } from '../../hooks/useUserMedia';
import { useMediaRecorder } from '../../hooks/useMediaRecorder';
import WebcamPreview from '../../components/interview/WebcamPreview';
import AudioVisualizer from '../../components/interview/AudioVisualizer';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { fetchQuestions, submitAnswer, endSession } from '../../services/interviewService';

// AI 면접관 이미지 에셋
import aiAvatar from '../../assets/images/ai-avatar.png';
import './InterviewRoom.css';

const DEFAULT_TIME_LIMIT = 180; // 기본 3분 (초)

export default function InterviewRoom() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    /* 미디어 훅 */
    const { stream, status: mediaStatus, start: startMedia } = useUserMedia({ video: true, audio: true });
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
    const [phase, setPhase] = useState('loading'); // 'loading' | 'ready' | 'thinking' | 'answering' | 'submitting' | 'done'
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
                await startMedia();
                if (sessionId) {
                    const qs = await fetchQuestions(sessionId);
                    setQuestions(qs);
                } else {
                    /* 개발용 더미 질문 */
                    setQuestions([
                        { id: 'q1', text: '자기소개를 해주세요.', category: '일반', timeLimit: 120 },
                        { id: 'q2', text: '지원 동기가 무슨인가요?', category: '일반', timeLimit: 180 },
                        { id: 'q3', text: '본인의 강점과 약점을 말해주세요.', category: '행동', timeLimit: 180 },
                    ]);
                }
                setPhase('ready');
            } catch (err) {
                setError(err.message);
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    /* 타이머 정리 함수 */
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    /* 답변 제출 함수 (최상단 배치로 가독성 및 호이스팅 확보) */
    const handleSubmitAnswer = useCallback(async () => {
        if (isSubmitting) return;
        clearTimer();
        setIsSubmitting(true);
        setPhase('submitting');

        try {
            const blob = await stopRecording();

            if (blob && sessionId) {
                await submitAnswer(
                    sessionId,
                    currentQuestion.id,
                    blob,
                    { onUploadProgress: setUploadProgress }
                );
            }

            resetRecording();
            setUploadProgress(0);

            if (isLastQuestion) {
                if (sessionId) await endSession(sessionId);
                navigate(`/feedback/${sessionId || ''}`);
            } else {
                setCurrentIndex(prev => prev + 1);
                setPhase('ready');
            }
        } catch (err) {
            setError(err.message);
            setPhase('answering');
        } finally {
            setIsSubmitting(false);
        }
    }, [
        isSubmitting, clearTimer, stopRecording, sessionId,
        currentQuestion, resetRecording, isLastQuestion, navigate
    ]);

    /* 타이머 시작 (시간 만료 시 이펙트 대신 여기서 직접 제출 트리거) */
    const startTimer = useCallback((limit) => {
        clearTimer();
        setTimeLeft(limit);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearTimer();
                    // 시간이 다 되면 동기 이펙트 대신 매끄럽게 이벤트 핸들러로서 자동 제출 실행
                    handleSubmitAnswer();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [clearTimer, handleSubmitAnswer]);

    /* 언마운트 정리 */
    useEffect(() => () => clearTimer(), [clearTimer]);

    /* 답변 시작 */
    const handleStartAnswer = () => {
        const limit = currentQuestion?.timeLimit ?? DEFAULT_TIME_LIMIT;
        setPhase('answering');
        startRecording();
        startTimer(limit);
    };

    /* 면접 종료 (중도 이탈) */
    const handleExit = async () => {
        clearTimer();
        if (sessionId) await endSession(sessionId).catch(() => { });
        navigate('/dashboard');
    };

    /* 시간 포맷 */
    const formatTime = secs => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const timerWarning = timeLeft <= 30 && phase === 'answering';

    if (error) {
        return (
            <div className="interview-room interview-room--error">
                <p className="interview-room__error-msg">오류가 발생했습니다: {error}</p>
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
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
                            style={{ width: `${questions.length ? ((currentIndex + (phase === 'done' ? 1 : 0)) / questions.length) * 100 : 0}%` }}
                        />
                    </div>
                    <span className="interview-room__progress-count">
                        {currentIndex + 1} / {questions.length || '?'}
                    </span>
                </div>

                {/* 타이머 */}
                <div className={`interview-room__timer ${timerWarning ? 'interview-room__timer--warning' : ''}`}>
                    <span className="interview-room__timer-icon">⏱</span>
                    {formatTime(timeLeft)}
                </div>

                <Button variant="ghost" size="sm" onClick={() => setShowExitModal(true)}>
                    종료
                </Button>
            </header>

            <div className="interview-room__body">
                {/* 왼쪽: 내 웹캠 & 오디오 피드백 */}
                <aside className="interview-room__sidebar">
                    <div className="interview-room__webcam-container">
                        <WebcamPreview
                            stream={stream}
                            overlay={
                                recStatus === 'recording' && (
                                    <div className="interview-room__rec-indicator">
                                        <span className="interview-room__rec-dot" />
                                        REC {formatTime(recDuration)}
                                    </div>
                                )
                            }
                        />
                    </div>

                    <AudioVisualizer
                        stream={stream}
                        active={recStatus === 'recording'}
                        height={40}
                        barCount={28}
                        style={{ marginTop: '12px' }}
                    />

                    {/* 업로드 진행률 */}
                    {phase === 'submitting' && (
                        <div className="interview-room__upload">
                            <p className="interview-room__upload-label">답변 전송 중... {uploadProgress}%</p>
                            <div className="interview-room__upload-bar">
                                <div
                                    className="interview-room__upload-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </aside>

                {/* 오른쪽: AI 면접관 이미지 및 질문 영역 */}
                <main className="interview-room__main">
                    {phase === 'loading' && (
                        <div className="interview-room__loading">
                            <div className="interview-room__spinner" />
                            <p>면접을 준비하고 있습니다...</p>
                        </div>
                    )}

                    {(phase === 'ready' || phase === 'thinking' || phase === 'answering' || phase === 'submitting') && currentQuestion && (
                        <div className="interview-room__interview-zone">
                            {/* AI 면접관 섹션 */}
                            <div className="interview-room__avatar-wrapper">
                                <img 
                                    src={aiAvatar} 
                                    alt="AI 면접관" 
                                    className={`interview-room__avatar-img ${phase === 'answering' ? 'interview-room__avatar-img--listening' : ''}`} 
                                />
                                <div className="interview-room__avatar-label">AI 가상 면접관</div>
                            </div>

                            {/* 질문 보드 섹션 */}
                            <div className="interview-room__question-board">
                                <div className="interview-room__category-badge">
                                    {currentQuestion.category} 핵심 문항
                                </div>
                                <h1 className="interview-room__question">
                                    "{currentQuestion.text}"
                                </h1>
                            </div>

                            {/* 가이드 안내 및 액션 영역 */}
                            <div className="interview-room__control-panel">
                                {phase === 'ready' && (
                                    <p className="interview-room__hint">
                                        질문을 충분히 숙지하신 후, 아래 <strong>답변 시작</strong> 버튼을 눌러주세요.
                                    </p>
                                )}

                                {phase === 'answering' && (
                                    <p className="interview-room__hint interview-room__hint--recording">
                                        🔴 <strong>답변 녹화 중</strong> — 카메라를 정면으로 응시하며 자연스럽게 말씀하세요.
                                    </p>
                                )}

                                <div className="interview-room__actions">
                                    {phase === 'ready' && (
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            disabled={mediaStatus !== 'active'}
                                            onClick={handleStartAnswer}
                                            leftIcon={<span>▶</span>}
                                        >
                                            답변 시작
                                        </Button>
                                    )}

                                    {phase === 'answering' && (
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            loading={isSubmitting}
                                            onClick={handleSubmitAnswer}
                                            leftIcon={<span>■</span>}
                                        >
                                            {isLastQuestion ? '최종 면접 완료' : '답변 완료 (다음 질문)'}
                                        </Button>
                                    )}

                                    {phase === 'submitting' && (
                                        <Button variant="secondary" size="lg" disabled loading>
                                            AI가 데이터 분석 중...
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* 중도 퇴장 확인 모달 */}
            <Modal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                title="면접을 중단하고 나가시겠습니까?"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowExitModal(false)}>
                            이어서 면접 보기
                        </Button>
                        <Button variant="danger" onClick={handleExit}>
                            중단 후 퇴장
                        </Button>
                    </>
                }
            >
                <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.95rem' }}>
                    지금 퇴장하시면 현재 세션의 모든 면접 기록과 분석 데이터가 폐기됩니다. 신중하게 결정해 주세요.
                </p>
            </Modal>
        </div>
    );
}