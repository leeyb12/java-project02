import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import {
  fetchWrongNotes,
  deleteWrongNote,
} from "../../services/interviewService";
import "./WrongNotes.css";

/**
 * WrongNotes 페이지
 * [복습] 면접 오답노트 — 담아둔 질문/답변/개선점을 다시 봅니다.
 */
export default function WrongNotes() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWrongNotes();
        setNotes(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "오답노트를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (noteId) => {
    try {
      await deleteWrongNote(noteId);
      setNotes((prev) => prev.filter((n) => n.noteId !== noteId));
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="wrong-notes">
      <div className="wrong-notes__container">
        <header className="wrong-notes__header">
          <div>
            <span className="wrong-notes__logo">◈ InterviewAI</span>
            <h1 className="wrong-notes__title">면접 오답노트</h1>
            <p className="wrong-notes__subtitle">
              담아둔 질문과 개선점을 다시 복습하세요.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            대기실로
          </Button>
        </header>

        {loading && (
          <div className="wrong-notes__empty">
            <div className="wrong-notes__spinner" />
            <p>불러오는 중...</p>
          </div>
        )}

        {!loading && error && (
          <div className="wrong-notes__empty">
            <p>⚠️ {error}</p>
          </div>
        )}

        {!loading && !error && notes.length === 0 && (
          <div className="wrong-notes__empty">
            <p className="wrong-notes__empty-icon">📭</p>
            <p>아직 담아둔 오답노트가 없습니다.</p>
            <p className="wrong-notes__empty-desc">
              피드백 화면에서 “오답노트에 담기”를 눌러 추가하세요.
            </p>
          </div>
        )}

        {!loading && !error && notes.length > 0 && (
          <div className="wrong-notes__list">
            {notes.map((note, i) => (
              <Card
                key={note.noteId}
                variant="default"
                style={{ marginBottom: "14px" }}
              >
                <div className="wrong-notes__card-head">
                  <span className="wrong-notes__index">#{i + 1}</span>
                  <span className="wrong-notes__question">
                    {note.questionText}
                  </span>
                  {note.score != null && (
                    <span className="wrong-notes__score">{note.score}점</span>
                  )}
                  <button
                    className="wrong-notes__delete"
                    onClick={() => handleDelete(note.noteId)}
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                </div>

                {note.answerText && (
                  <div className="wrong-notes__block">
                    <span className="wrong-notes__block-label">🗣 내 답변</span>
                    <p className="wrong-notes__block-text">{note.answerText}</p>
                  </div>
                )}

                {note.improvements?.length > 0 && (
                  <div className="wrong-notes__block">
                    <span className="wrong-notes__block-label">
                      🔧 고쳐야 할 점
                    </span>
                    <ul className="wrong-notes__improvements">
                      {note.improvements.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
