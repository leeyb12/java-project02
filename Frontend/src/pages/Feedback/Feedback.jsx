import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { fetchFeedback, addWrongNote } from "../../services/interviewService";
import { expressionLabel, EXPRESSION_EMOJI } from "../../utils/vision";
import "./Feedback.css";

export default function Feedback() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'answers' | 'appearance'
  const [savedNotes, setSavedNotes] = useState({}); // { [questionId]: true }

  /* 오답노트에 담기 */
  const handleAddNote = async (ans) => {
    try {
      await addWrongNote({
        sessionId: sessionId || "demo",
        answerId: ans.answerId,
        questionId: ans.questionId,
        questionText: ans.questionText,
        answerText: ans.answerText,
        score: ans.score,
      });
      setSavedNotes((prev) => ({ ...prev, [ans.questionId]: true }));
    } catch {
      alert("오답노트 저장에 실패했습니다.");
    }
  };

  /* 복장·표정 분석 결과 (InterviewRoom이 sessionStorage에 저장) — 첫 렌더 시 1회 로드 */
  const [analysis] = useState(() => {
    try {
      const raw = sessionStorage.getItem(
        `interviewAnalysis_${sessionId || "demo"}`,
      );
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  /* 피드백 데이터 로드 */
  useEffect(() => {
    const load = async () => {
      try {
        if (sessionId) {
          /* 서버가 잘한 점/고쳐야 할 점/점수/영상까지 계산해 반환 */
          const data = await fetchFeedback(sessionId);
          setFeedback(data);
        } else {
          /* 개발용 더미 데이터 */
          setFeedback({
            sessionId: "demo",
            overallScore: 76,
            answers: [
              {
                questionId: "q1",
                questionText: "자기소개를 해주세요.",
                answerText:
                  "저는 3년차 백엔드 개발자로 커머스 서비스를 개발해 왔습니다.",
                score: 85,
                strengths: ["경력을 명확하고 간결하게 전달함"],
                improvements: ["구체적인 프로젝트 성과 수치를 덧붙이면 좋음"],
                pronunciation: "발음이 또렷하고 전달력이 좋습니다.",
                behavior: "미소 표정 위주(집중도 72%)",
                videoUrl: null,
              },
              {
                questionId: "q2",
                questionText: "지원 동기가 무엇인가요?",
                answerText: "회사의 기술 문화에 매력을 느꼈습니다.",
                score: 68,
                strengths: ["회사에 대한 관심을 드러냄"],
                improvements: ["지원 직무와의 연결성을 더 구체적으로 표현 필요"],
                pronunciation: "말끝이 흐려지는 구간이 있었습니다.",
                behavior: "무표정 위주(집중도 60%)",
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
  const getGrade = (score) => {
    if (score >= 90) return { label: "S", color: "#f59e0b" };
    if (score >= 80) return { label: "A", color: "#10b981" };
    if (score >= 70) return { label: "B", color: "#4f6ef7" };
    if (score >= 60) return { label: "C", color: "#9999b3" };
    return { label: "D", color: "#ef4444" }; // 0점 이하 및 누락은 D등급 처리
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "var(--color-accent-success)";
    if (score >= 65) return "var(--color-accent-primary)";
    if (score >= 50) return "var(--color-accent-warning)";
    return "var(--color-accent-danger)"; // 0점은 자동으로 빨간색 처리
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
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/wrong-notes")}
            >
              오답노트
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              리포트 인쇄
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              다시 면접하기
            </Button>
          </div>
        </header>

        {/* 탭 네비게이션 */}
        <div className="feedback__tabs">
          {[
            { key: "overview", label: "종합 결과" },
            { key: "answers", label: "답변 분석" },
            ...(analysis.length > 0
              ? [{ key: "appearance", label: "복장·표정" }]
              : []),
          ].map((tab) => (
            <button
              key={tab.key}
              className={`feedback__tab ${activeTab === tab.key ? "feedback__tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 종합 결과 탭 */}
        {activeTab === "overview" && (
          <div className="feedback__overview">
            {/* 전체 점수 카드 */}
            <Card variant="glass" style={{ textAlign: "center" }}>
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
                      setActiveTab("answers");
                      setExpandedId(ans.questionId);
                    }}
                  >
                    <div className="feedback__score-row">
                      <span className="feedback__score-index">Q{i + 1}</span>
                      <span className="feedback__score-question">
                        {ans.questionText}
                      </span>
                      <div
                        className="feedback__score-pill"
                        style={{ color: scoreColor, borderColor: scoreColor }}
                      >
                        {ans.score}점
                      </div>
                    </div>

                    {/* 미니 바 */}
                    <div className="feedback__mini-bar">
                      <div
                        className="feedback__mini-bar-fill"
                        style={{
                          width: `${ans.score}%`,
                          background: scoreColor,
                        }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* 답변 분석 탭 */}
        {activeTab === "answers" && (
          <div className="feedback__answers">
            {feedback.answers.map((ans, i) => {
              const isExpanded = expandedId === ans.questionId;
              const scoreColor = getScoreColor(ans.score);

              return (
                <div key={ans.questionId} className="feedback__answer-card">
                  {/* 질문 헤더 */}
                  <button
                    className="feedback__answer-header"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : ans.questionId)
                    }
                  >
                    <div className="feedback__answer-header-left">
                      <span className="feedback__answer-index">Q{i + 1}</span>
                      <span className="feedback__answer-question">
                        {ans.questionText}
                      </span>
                    </div>
                    <div className="feedback__answer-header-right">
                      <span
                        className="feedback__answer-score"
                        style={{ color: scoreColor }}
                      >
                        {ans.score}점
                      </span>
                      <span
                        className={`feedback__chevron ${isExpanded ? "feedback__chevron--up" : ""}`}
                      >
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

                      {/* 내 답변 (STT) */}
                      {ans.answerText && (
                        <div className="feedback__answer-text">
                          <h4 className="feedback__ai-title">
                            <span>🗣</span> 내 답변
                          </h4>
                          <p className="feedback__ai-text">{ans.answerText}</p>
                        </div>
                      )}

                      {/* 잘한 점 */}
                      {ans.strengths?.length > 0 && (
                        <div className="feedback__ai-feedback feedback__ai-feedback--good">
                          <h4 className="feedback__ai-title">
                            <span>👍</span> 잘한 점
                          </h4>
                          <ul className="feedback__point-list">
                            {ans.strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 고쳐야 할 점 */}
                      {ans.improvements?.length > 0 && (
                        <div className="feedback__ai-feedback feedback__ai-feedback--bad">
                          <h4 className="feedback__ai-title">
                            <span>🔧</span> 고쳐야 할 점
                          </h4>
                          <ul className="feedback__point-list">
                            {ans.improvements.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 발음 / 행동 */}
                      {(ans.pronunciation || ans.behavior) && (
                        <div className="feedback__meta-row">
                          {ans.pronunciation && (
                            <div className="feedback__meta-item">
                              <span className="feedback__meta-label">
                                🎙 발음/전달력
                              </span>
                              <span>{ans.pronunciation}</span>
                            </div>
                          )}
                          {ans.behavior && (
                            <div className="feedback__meta-item">
                              <span className="feedback__meta-label">
                                🙂 행동/표정
                              </span>
                              <span>{ans.behavior}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 점수 시각화 */}
                      <div className="feedback__score-visual">
                        <span className="feedback__score-visual-label">
                          답변 점수
                        </span>
                        <div className="feedback__score-visual-bar">
                          <div
                            className="feedback__score-visual-fill"
                            style={{
                              width: `${ans.score}%`,
                              background: scoreColor,
                            }}
                          />
                        </div>
                        <span
                          className="feedback__score-visual-value"
                          style={{ color: scoreColor }}
                        >
                          {ans.score} / 100
                        </span>
                      </div>

                      {/* 오답노트에 담기 */}
                      <div className="feedback__note-action">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={savedNotes[ans.questionId]}
                          onClick={() => handleAddNote(ans)}
                        >
                          {savedNotes[ans.questionId]
                            ? "✓ 오답노트에 담김"
                            : "📌 오답노트에 담기"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 복장·표정 분석 탭 */}
        {activeTab === "appearance" && (
          <div className="feedback__appearance">
            {analysis.map((item, i) => {
              const expr = item.expression;
              const clo = item.clothing;
              return (
                <Card
                  key={item.questionId || i}
                  variant="default"
                  style={{ marginBottom: "12px" }}
                >
                  <div className="feedback__appearance-head">
                    <span className="feedback__answer-index">Q{i + 1}</span>
                    <span className="feedback__appearance-question">
                      {item.questionText}
                    </span>
                  </div>

                  <div className="feedback__appearance-grid">
                    {/* 표정 */}
                    <div className="feedback__appearance-block">
                      <h4 className="feedback__appearance-subtitle">표정</h4>
                      {expr ? (
                        <>
                          <p className="feedback__appearance-main">
                            {EXPRESSION_EMOJI[expr.dominant] || "🙂"}{" "}
                            {expressionLabel(expr.dominant)}
                          </p>
                          <p className="feedback__appearance-desc">
                            표정 집중도 {Math.round((expr.stability ?? 0) * 100)}%
                            · {expr.samples ?? 0}회 측정
                          </p>
                        </>
                      ) : (
                        <p className="feedback__appearance-desc">
                          표정 데이터가 없습니다.
                        </p>
                      )}
                    </div>

                    {/* 복장 */}
                    <div className="feedback__appearance-block">
                      <h4 className="feedback__appearance-subtitle">복장</h4>
                      {clo ? (
                        <>
                          <p className="feedback__appearance-main">
                            {clo.attire || "-"}
                            {clo.neatness != null && (
                              <span className="feedback__appearance-tag">
                                단정함 {clo.neatness}/5
                              </span>
                            )}
                          </p>
                          {clo.appropriateness && (
                            <p className="feedback__appearance-desc">
                              적절성: {clo.appropriateness}
                            </p>
                          )}
                          {clo.comment && (
                            <p className="feedback__appearance-comment">
                              {clo.comment}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="feedback__appearance-desc">
                          복장 분석 결과가 없습니다. (비전 모델 미설치 시 생략됨)
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
