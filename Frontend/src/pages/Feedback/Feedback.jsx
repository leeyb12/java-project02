import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { fetchFeedback } from '../../services/interviewService';
import './Feedback.css';


export default function Feedback() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'answers'

    /* 피드백 데이터 로드 */
    useEffect(() => {
        const load = async () => {
            try {
                if (sessionId) {
                    const data = await fetchFeedback(sessionId);
                    setFeedback(data);
                } else {
                    /* 개발용 더미 데이터 */
                    setFeedback({
                        sessionId: 'demo',
                        overallScore: 78,
                        answers: [
                            {
                                questionId: 'q1',
                                questionText: '자기소개를 해주세요.',
                                score: 85,
                                feedback: '명확하고 간결하게 경력을 소개했습니다. 구체적인 프로젝트 사례를 추가하면 더욱 인상적일 것입니다.',
                                keywords: ['명확성', '간결함', '경력 소개'],
                                videoUrl: null,
                            },
                            {
                                questionId: 'q2',
                                questionText: '지원 동기가 무엇인가요?',
                                score: 70,
                                feedback: '회사에 대한 기본적인 이해는 있으나, 지원 직무와의 연결성을 더 구체적으로 표현하면 좋겠습니다.',
                                keywords: ['지원 동기', '회사 이해'],
                                videoUrl: null,
                            },
                            {
                                questionId: 'q3',
                                questionText: '본인의 강점과 약점을 말해주세요.',
                                score: 72,
                                feedback: '강점은 잘 설명했으나, 약점에 대한 극복 방안이 부족합니다. 개선 노력을 함께 언급하세요.',
                                keywords: ['자기 인식', '강점', '약점'],
                                videoUrl: null,
                            },
                        ],
                    });
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [sessionId]);

    /* 점수에 따른 등급 */
    const getGrade = score => {
        if (score >= 90) return { label: 'S', color: '#f59e0b' };
        if (score >= 80) return { label: 'A', color: '#10b981' };
        if (score >= 70) return { label: 'B', color: '#4f6ef7' };
        if (score >= 60) return { label: 'C', color: '#9999b3' };
        return { label: 'D', color: '#ef4444' };
    };

    const getScoreColor = score => {
        if (score >= 80) return 'var(--color-accent-success)';
        if (score >= 65) return 'var(--color-accent-primary)';
        if (score >= 50) return 'var(--color-accent-warning)';
        return 'var(--color-accent-danger)';
    };

    if (loading) {
        return (
            <div className="feedback feedback--loading">
                <div className="feedback__spinner" />
                <p>리포트를 분석하고 있습니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="feedback feedback--error">
                <p>오류: {error}</p>
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                    처음으로 돌아가기
                </Button>
            </div>
        );
    }

    const grade = getGrade(feedback.overallScore);

    return (
        <div className="feedback">
            <div className="feedback__bg-glow" />

            <div className="feedback__container">
                {/* 헤더 */}
                <header className="feedback__header">
                    <div className="feedback__header-left">
                        <span className="feedback__logo">◈ InterviewAI</span>
                        <h1 className="feedback__title">면접 결과 리포트</h1>
                    </div>
                    <div className="feedback__header-actions">
                        <Button variant="ghost" size="sm" onClick={() => window.print()}>
                            리포트 인쇄
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
                            다시 면접하기
                        </Button>
                    </div>
                </header>

                {/* 탭 네비게이션 */}
                <div className="feedback__tabs">
                    {[
                        { key: 'overview', label: '종합 결과' },
                        { key: 'answers', label: '답변 분석' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`feedback__tab ${activeTab === tab.key ? 'feedback__tab--active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 종합 결과 탭 */}
                {activeTab === 'overview' && (
                    <div className="feedback__overview">
                        {/* 전체 점수 카드 */}
                        <Card variant="glass" style={{ textAlign: 'center' }}>
                            <div
                                className="feedback__grade-badge"
                                style={{ color: grade.color, borderColor: grade.color }}
                            >
                                {grade.label}
                            </div>

                            <div
                                className="feedback__overall-score"
                                style={{ color: getScoreColor(feedback.overallScore) }}
                            >
                                {feedback.overallScore}
                                <span className="feedback__score-unit">점</span>
                            </div>

                            <p className="feedback__score-desc">
                                총 {feedback.answers.length}개 질문 · 평균 점수
                            </p>

                            {/* 점수 바 */}
                            <div className="feedback__score-bar-wrap">
                                <div className="feedback__score-bar">
                                    <div
                                        className="feedback__score-bar-fill"
                                        style={{
                                            width: `${feedback.overallScore}%`,
                                            background: getScoreColor(feedback.overallScore),
                                        }}
                                    />
                                </div>
                                <span className="feedback__score-bar-label">100점</span>
                            </div>
                        </Card>

                        {/* 질문별 점수 요약 */}
                        <h2 className="feedback__section-title">질문별 점수</h2>

                        <div className="feedback__score-list">
                            {feedback.answers.map((ans, i) => {
                                const scoreColor = getScoreColor(ans.score);
                                return (
                                    <Card
                                        key={ans.questionId}
                                        variant="default"
                                        hoverable
                                        clickable
                                        onClick={() => {
                                            setActiveTab('answers');
                                            setExpandedId(ans.questionId);
                                        }}
                                    >
                                        <div className="feedback__score-row">
                                            <span className="feedback__score-index">Q{i + 1}</span>
                                            <span className="feedback__score-question">{ans.questionText}</span>
                                            <div className="feedback__score-pill" style={{ color: scoreColor, borderColor: scoreColor }}>
                                                {ans.score}점
                                            </div>
                                        </div>

                                        {/* 미니 바 */}
                                        <div className="feedback__mini-bar">
                                            <div
                                                className="feedback__mini-bar-fill"
                                                style={{ width: `${ans.score}%`, background: scoreColor }}
                                            />
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 답변 분석 탭 */}
                {activeTab === 'answers' && (
                    <div className="feedback__answers">
                        {feedback.answers.map((ans, i) => {
                            const isExpanded = expandedId === ans.questionId;
                            const scoreColor = getScoreColor(ans.score);

                            return (
                                <div key={ans.questionId} className="feedback__answer-card">
                                    {/* 질문 헤더 */}
                                    <button
                                        className="feedback__answer-header"
                                        onClick={() => setExpandedId(isExpanded ? null : ans.questionId)}
                                    >
                                        <div className="feedback__answer-header-left">
                                            <span className="feedback__answer-index">Q{i + 1}</span>
                                            <span className="feedback__answer-question">{ans.questionText}</span>
                                        </div>
                                        <div className="feedback__answer-header-right">
                                            <span
                                                className="feedback__answer-score"
                                                style={{ color: scoreColor }}
                                            >
                                                {ans.score}점
                                            </span>
                                            <span className={`feedback__chevron ${isExpanded ? 'feedback__chevron--up' : ''}`}>
                                                ▾
                                            </span>
                                        </div>
                                    </button>

                                    {/* 확장 콘텐츠 */}
                                    {isExpanded && (
                                        <div className="feedback__answer-body">
                                            {/* 비디오 플레이어 */}
                                            {ans.videoUrl && (
                                                <video
                                                    src={ans.videoUrl}
                                                    controls
                                                    className="feedback__video"
                                                />
                                            )}

                                            {/* AI 피드백 */}
                                            <div className="feedback__ai-feedback">
                                                <h4 className="feedback__ai-title">
                                                    <span>◈</span> AI 분석 피드백
                                                </h4>
                                                <p className="feedback__ai-text">{ans.feedback}</p>
                                            </div>

                                            {/* 키워드 태그 */}
                                            {ans.keywords?.length > 0 && (
                                                <div className="feedback__keywords">
                                                    <span className="feedback__keywords-label">평가 키워드</span>
                                                    <div className="feedback__keyword-tags">
                                                        {ans.keywords.map(kw => (
                                                            <span key={kw} className="feedback__keyword-tag">
                                                                {kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 점수 시각화 */}
                                            <div className="feedback__score-visual">
                                                <span className="feedback__score-visual-label">답변 점수</span>
                                                <div className="feedback__score-visual-bar">
                                                    <div
                                                        className="feedback__score-visual-fill"
                                                        style={{ width: `${ans.score}%`, background: scoreColor }}
                                                    />
                                                </div>
                                                <span
                                                    className="feedback__score-visual-value"
                                                    style={{ color: scoreColor }}
                                                >
                                                    {ans.score} / 100
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}