import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserMedia } from '../../hooks/useUserMedia';
import WebcamPreview from '../../components/interview/WebcamPreview';
import AudioVisualizer from '../../components/interview/AudioVisualizer';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import { createSession } from '../../services/interviewService';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();

    /* 미디어 훅 */
    const {
        stream,
        status: mediaStatus,
        error: mediaError,
        devices,
        start: startMedia,
        stop: stopMedia,
        switchCamera,
        switchMicrophone,
    } = useUserMedia({ video: true, audio: true });

    /* 면접 설정 상태 */
    const [category, setCategory] = useState('general');
    const [questionCount, setQuestionCount] = useState(5);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [selectedMic, setSelectedMic] = useState('');

    /* UI 상태 */
    const [isStarting, setIsStarting] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [startError, setStartError] = useState(null);

    /* 페이지 진입 시 미디어 시작 */
    useEffect(() => {
        startMedia();
        return () => stopMedia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* 카메라 변경 */
    const handleCameraChange = async e => {
        setSelectedCamera(e.target.value);
        await switchCamera(e.target.value);
    };

    /* 마이크 변경 */
    const handleMicChange = async e => {
        setSelectedMic(e.target.value);
        await switchMicrophone(e.target.value);
    };

    /* 면접 시작 */
    const handleStartInterview = async () => {
        setIsStarting(true);
        setStartError(null);

        try {
            const session = await createSession({ category, questionCount });
            navigate(`/interview/${session.sessionId}`);
        } catch (err) {
            setStartError(err.message || '세션 생성에 실패했습니다. 다시 시도해 주세요.');
            setIsStarting(false);
        }
    };

    /* 기기 상태 체크 */
    const isReady = mediaStatus === 'active';
    const isDenied = mediaStatus === 'denied';

    return (
        <div className="dashboard">
            {/* 배경 그라디언트 효과 */}
            <div className="dashboard__bg-glow" />

            <div className="dashboard__container">
                {/* 헤더 */}
                <header className="dashboard__header">
                    <div className="dashboard__logo">
                        <span className="dashboard__logo-icon">◈</span>
                        <span className="dashboard__logo-text">InterviewAI</span>
                    </div>
                    <p className="dashboard__subtitle">AI 면접 시뮬레이터</p>
                </header>

                <div className="dashboard__grid">
                    {/* 왼쪽: 웹캠 미리보기 */}
                    <section className="dashboard__camera-section">
                        <h2 className="dashboard__section-title">
                            <span className="dashboard__step-badge">01</span>
                            기기 확인
                        </h2>

                        {/* 카메라 상태 메시지 */}
                        {isDenied && (
                            <div className="dashboard__alert dashboard__alert--danger">
                                <span>⚠</span>
                                카메라/마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.
                            </div>
                        )}
                        {mediaError && !isDenied && (
                            <div className="dashboard__alert dashboard__alert--warning">
                                <span>⚠</span>
                                {mediaError.message}
                            </div>
                        )}

                        {/* 웹캠 프리뷰 */}
                        <WebcamPreview
                            stream={stream}
                            style={{ borderRadius: '16px', border: '1px solid var(--color-border)' }}
                            overlay={
                                isReady && (
                                    <div className="dashboard__cam-badge">
                                        <span className="dashboard__rec-dot" />
                                        LIVE
                                    </div>
                                )
                            }
                        />

                        {/* 오디오 시각화 */}
                        <Card variant="outlined" padding="var(--space-md)" style={{ marginTop: '12px' }}>
                            <p className="dashboard__label">마이크 입력</p>
                            <AudioVisualizer
                                stream={stream}
                                active={isReady}
                                height={48}
                                barCount={40}
                            />
                        </Card>

                        {/* 기기 선택 */}
                        {devices.cameras.length > 0 && (
                            <div className="dashboard__device-selects">
                                <div className="dashboard__select-group">
                                    <label className="dashboard__label">카메라</label>
                                    <select
                                        value={selectedCamera}
                                        onChange={handleCameraChange}
                                        className="dashboard__select"
                                    >
                                        {devices.cameras.map(d => (
                                            <option key={d.deviceId} value={d.deviceId}>
                                                {d.label || `카메라 ${d.deviceId.slice(0, 8)}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="dashboard__select-group">
                                    <label className="dashboard__label">마이크</label>
                                    <select
                                        value={selectedMic}
                                        onChange={handleMicChange}
                                        className="dashboard__select"
                                    >
                                        {devices.microphones.map(d => (
                                            <option key={d.deviceId} value={d.deviceId}>
                                                {d.label || `마이크 ${d.deviceId.slice(0, 8)}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* 오른쪽: 면접 설정 */}
                    <section className="dashboard__settings-section">
                        <h2 className="dashboard__section-title">
                            <span className="dashboard__step-badge">02</span>
                            면접 설정
                        </h2>

                        {/* 카테고리 선택 */}
                        <div className="dashboard__category-grid">
                            {[
                                { value: 'general', label: '일반 면접', icon: '💬' },
                                { value: 'technical', label: '기술 면접', icon: '💻' },
                                { value: 'behavioral', label: '행동 면접', icon: '🧠' },
                                { value: 'situational', label: '상황 면접', icon: '🎯' },
                            ].map(item => (
                                <button
                                    key={item.value}
                                    className={`dashboard__category-btn ${category === item.value ? 'dashboard__category-btn--active' : ''}`}
                                    onClick={() => setCategory(item.value)}
                                >
                                    <span className="dashboard__category-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* 질문 수 선택 */}
                        <div className="dashboard__field">
                            <label className="dashboard__label">질문 수</label>
                            <div className="dashboard__count-buttons">
                                {[3, 5, 7, 10].map(n => (
                                    <button
                                        key={n}
                                        className={`dashboard__count-btn ${questionCount === n ? 'dashboard__count-btn--active' : ''}`}
                                        onClick={() => setQuestionCount(n)}
                                    >
                                        {n}개
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 안내 사항 */}
                        <Card variant="glass" padding="var(--space-md)" style={{ marginTop: 'auto' }}>
                            <h3 className="dashboard__notice-title">면접 진행 안내</h3>
                            <ul className="dashboard__notice-list">
                                <li>조용하고 밝은 공간에서 진행하세요.</li>
                                <li>답변은 타이머 종료 전 자동 저장됩니다.</li>
                                <li>각 질문당 최대 3분이 주어집니다.</li>
                                <li>AI가 답변을 분석하여 피드백을 제공합니다.</li>
                            </ul>
                        </Card>

                        {/* 오류 메시지 */}
                        {startError && (
                            <div className="dashboard__alert dashboard__alert--danger" style={{ marginTop: '12px' }}>
                                {startError}
                            </div>
                        )}

                        {/* 시작 버튼 */}
                        <Button
                            variant="primary"
                            size="lg"
                            disabled={!isReady}
                            loading={isStarting}
                            onClick={handleStartInterview}
                            style={{ width: '100%', marginTop: '16px' }}
                        >
                            {!isReady ? '기기 연결 확인 중...' : '면접 시작하기 →'}
                        </Button>
                    </section>
                </div>
            </div>

            {/* 설정 모달 (예시) */}
            <Modal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                title="상세 설정"
                size="sm"
            >
                <p style={{ color: 'var(--color-text-secondary)' }}>추가 설정 옵션이 여기에 표시됩니다.</p>
            </Modal>
        </div>
    );
}