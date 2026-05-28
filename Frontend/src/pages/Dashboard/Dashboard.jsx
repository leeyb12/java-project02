import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUserMedia } from "../../hooks/useUserMedia";
import WebcamPreview from "../../components/interview/WebcamPreview";
import AudioVisualizer from "../../components/interview/AudioVisualizer";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import {
  createSessionWithResume,
  uploadResume,
} from "../../services/interviewService";
import "./Dashboard.css";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];
const ACCEPTED_EXT = ".pdf,.docx,.doc,.txt";
const MAX_FILE_MB = 10;

/**
 * Dashboard 페이지
 * [준비] 기기 테스트 + 이력서 업로드 + 면접 설정 대기실
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

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

  /* 면접 설정 */
  const [category, setCategory] = useState("general");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMic, setSelectedMic] = useState("");

  /* 이력서 상태 */
  const [resumeFile, setResumeFile] = useState(null); // File 객체
  const [resumeId, setResumeId] = useState(null); // 서버 업로드 후 ID
  const [resumeParsed, setResumeParsed] = useState(null); // 파싱된 이력서 정보
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("idle"); // 'idle'|'uploading'|'done'|'error'
  const [uploadError, setUploadError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  /* UI 상태 */
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  /* 페이지 진입 시 미디어 시작 */
  useEffect(() => {
    startMedia();
    return () => stopMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 파일 유효성 검사 ── */
  const validateFile = (file) => {
    if (!file) return "파일을 선택해 주세요.";
    if (
      !ACCEPTED_TYPES.includes(file.type) &&
      !file.name.match(/\.(pdf|docx?|txt)$/i)
    ) {
      return "PDF, DOCX, DOC, TXT 파일만 업로드할 수 있습니다.";
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return `파일 크기는 ${MAX_FILE_MB}MB 이하여야 합니다.`;
    }
    return null;
  };

  /* ── 파일 업로드 처리 ── */
  const handleFileUpload = async (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setResumeFile(file);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError(null);
    setResumeParsed(null);
    setResumeId(null);

    try {
      const result = await uploadResume(file, {
        onUploadProgress: setUploadProgress,
      });
      setResumeId(result.resumeId);
      setResumeParsed(result.parsedInfo);
      setUploadStatus("done");
    } catch (err) {
      setUploadStatus("error");
      setUploadError(
        err.response?.data?.message || "이력서 업로드에 실패했습니다.",
      );
    }
  };

  /* ── input change ── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  /* ── drag & drop ── */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  /* ── 이력서 제거 ── */
  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeId(null);
    setResumeParsed(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setUploadError(null);
  };

  /* ── 기기 변경 ── */
  const handleCameraChange = async (e) => {
    setSelectedCamera(e.target.value);
    await switchCamera(e.target.value);
  };
  const handleMicChange = async (e) => {
    setSelectedMic(e.target.value);
    await switchMicrophone(e.target.value);
  };

  /* ── 면접 시작 ── */
  const handleStartInterview = async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      const session = await createSessionWithResume({
        category,
        difficulty,
        questionCount,
        ...(resumeId ? { resumeId } : {}),
      });
      navigate(`/interview/${session.sessionId}`);
    } catch (err) {
      setStartError(
        err.message || "세션 생성에 실패했습니다. 다시 시도해 주세요.",
      );
      setIsStarting(false);
    }
  };

  const isReady = mediaStatus === "active";
  const isDenied = mediaStatus === "denied";
  const hasResume = uploadStatus === "done" && resumeId;

  /* ── 파일 크기 포맷 ── */
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ── 파일 아이콘 ── */
  const getFileIcon = (file) => {
    if (!file) return "📄";
    if (file.name.endsWith(".pdf")) return "📕";
    if (file.name.match(/\.docx?$/i)) return "📘";
    return "📄";
  };

  return (
    <div className="dashboard">
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
          {/* ── 왼쪽: 기기 확인 ── */}
          <section className="dashboard__camera-section">
            <h2 className="dashboard__section-title">
              <span className="dashboard__step-badge">01</span>
              기기 확인
            </h2>

            {isDenied && (
              <div className="dashboard__alert dashboard__alert--danger">
                <span>⚠</span>
                카메라/마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을
                허용해 주세요.
              </div>
            )}
            {mediaError && !isDenied && (
              <div className="dashboard__alert dashboard__alert--warning">
                <span>⚠</span>
                {mediaError.message}
              </div>
            )}

            <WebcamPreview
              stream={stream}
              style={{
                borderRadius: "16px",
                border: "1px solid var(--color-border)",
              }}
              overlay={
                isReady && (
                  <div className="dashboard__cam-badge">
                    <span className="dashboard__rec-dot" />
                    LIVE
                  </div>
                )
              }
            />

            <Card
              variant="outlined"
              padding="var(--space-md)"
              style={{ marginTop: "12px" }}
            >
              <p className="dashboard__label">마이크 입력</p>
              <AudioVisualizer
                stream={stream}
                active={isReady}
                height={48}
                barCount={40}
              />
            </Card>

            {devices.cameras.length > 0 && (
              <div className="dashboard__device-selects">
                <div className="dashboard__select-group">
                  <label className="dashboard__label">카메라</label>
                  <select
                    value={selectedCamera}
                    onChange={handleCameraChange}
                    className="dashboard__select"
                  >
                    {devices.cameras.map((d) => (
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
                    {devices.microphones.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `마이크 ${d.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* ── 오른쪽: 이력서 + 면접 설정 ── */}
          <section className="dashboard__settings-section">
            {/* ── STEP 02: 이력서 업로드 ── */}
            <h2 className="dashboard__section-title">
              <span className="dashboard__step-badge">02</span>
              이력서 업로드
              <span className="dashboard__step-optional">필수사항</span>
            </h2>

            {uploadStatus === "idle" || uploadStatus === "error" ? (
              /* 드래그 앤 드롭 업로드 존 */
              <div
                ref={dropZoneRef}
                className={`dashboard__dropzone ${isDragOver ? "dashboard__dropzone--active" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && fileInputRef.current?.click()
                }
                aria-label="이력서 파일 업로드 영역"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXT}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  aria-hidden="true"
                />
                <div className="dashboard__dropzone-icon">📄</div>
                <p className="dashboard__dropzone-title">
                  {isDragOver
                    ? "여기에 놓으세요!"
                    : "이력서를 드래그하거나 클릭하여 업로드"}
                </p>
                <p className="dashboard__dropzone-desc">
                  PDF, DOCX, DOC, TXT · 최대 {MAX_FILE_MB}MB
                </p>
                {uploadStatus === "error" && uploadError && (
                  <p className="dashboard__dropzone-error">{uploadError}</p>
                )}
              </div>
            ) : uploadStatus === "uploading" ? (
              /* 업로드 진행 중 */
              <div className="dashboard__upload-progress-card">
                <div className="dashboard__upload-file-row">
                  <span className="dashboard__upload-icon">
                    {getFileIcon(resumeFile)}
                  </span>
                  <div className="dashboard__upload-file-info">
                    <span className="dashboard__upload-filename">
                      {resumeFile?.name}
                    </span>
                    <span className="dashboard__upload-filesize">
                      {formatFileSize(resumeFile?.size ?? 0)}
                    </span>
                  </div>
                  <span className="dashboard__upload-pct">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="dashboard__upload-bar">
                  <div
                    className="dashboard__upload-bar-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="dashboard__upload-status-msg">
                  이력서를 분석하고 있습니다...
                </p>
              </div>
            ) : (
              /* 업로드 완료 */
              <div className="dashboard__resume-done">
                <div className="dashboard__resume-done-header">
                  <div className="dashboard__resume-done-left">
                    <span className="dashboard__upload-icon">
                      {getFileIcon(resumeFile)}
                    </span>
                    <div>
                      <p className="dashboard__upload-filename">
                        {resumeFile?.name}
                      </p>
                      <p className="dashboard__upload-filesize">
                        {formatFileSize(resumeFile?.size ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="dashboard__resume-done-badges">
                    <span className="dashboard__badge dashboard__badge--success">
                      ✓ 분석 완료
                    </span>
                    <button
                      className="dashboard__resume-remove"
                      onClick={handleRemoveResume}
                      aria-label="이력서 제거"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* 파싱된 정보 미리보기 */}
                {resumeParsed && (
                  <div className="dashboard__resume-parsed">
                    {resumeParsed.name && (
                      <div className="dashboard__resume-row">
                        <span className="dashboard__resume-row-label">
                          이름
                        </span>
                        <span className="dashboard__resume-row-value">
                          {resumeParsed.name}
                        </span>
                      </div>
                    )}
                    {resumeParsed.skills?.length > 0 && (
                      <div className="dashboard__resume-row">
                        <span className="dashboard__resume-row-label">
                          기술스택
                        </span>
                        <div className="dashboard__resume-tags">
                          {resumeParsed.skills.slice(0, 6).map((s) => (
                            <span key={s} className="dashboard__resume-tag">
                              {s}
                            </span>
                          ))}
                          {resumeParsed.skills.length > 6 && (
                            <span className="dashboard__resume-tag dashboard__resume-tag--more">
                              +{resumeParsed.skills.length - 6}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {resumeParsed.experience?.length > 0 && (
                      <div className="dashboard__resume-row">
                        <span className="dashboard__resume-row-label">
                          경력
                        </span>
                        <span className="dashboard__resume-row-value">
                          {resumeParsed.experience[0]}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="dashboard__resume-ai-notice">
                  <span className="dashboard__resume-ai-icon">◈</span>
                  이력서 내용을 바탕으로 맞춤 질문이 생성됩니다.
                </div>
              </div>
            )}

            {/* ── STEP 03: 면접 설정 ── */}
            <h2
              className="dashboard__section-title"
              style={{ marginTop: "var(--space-lg)" }}
            >
              <span className="dashboard__step-badge">03</span>
              면접 설정
            </h2>

            {/* 카테고리 */}
            <div className="dashboard__category-grid">
              {[
                { value: "general", label: "일반 면접", icon: "💬" },
                { value: "technical", label: "기술 면접", icon: "💻" },
                { value: "behavioral", label: "행동 면접", icon: "🧠" },
                { value: "situational", label: "상황 면접", icon: "🎯" },
              ].map((item) => (
                <button
                  key={item.value}
                  className={`dashboard__category-btn ${category === item.value ? "dashboard__category-btn--active" : ""}`}
                  onClick={() => setCategory(item.value)}
                >
                  <span className="dashboard__category-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* 질문 수 */}
            <div className="dashboard__field">
              <label className="dashboard__label">질문 수</label>
              <div className="dashboard__count-buttons">
                {[3, 5, 7, 10].map((n) => (
                  <button
                    key={n}
                    className={`dashboard__count-btn ${questionCount === n ? "dashboard__count-btn--active" : ""}`}
                    onClick={() => setQuestionCount(n)}
                  >
                    {n}개
                  </button>
                ))}
              </div>
            </div>

            {/* 난이도 */}
            <div className="dashboard__field">
              <label className="dashboard__label">난이도</label>
              <div className="dashboard__count-buttons">
                {[
                  { value: "easy", label: "쉬움" },
                  { value: "medium", label: "보통" },
                  { value: "hard", label: "어려움" },
                ].map((item) => (
                  <button
                    key={item.value}
                    className={`dashboard__count-btn ${difficulty === item.value ? "dashboard__count-btn--active" : ""}`}
                    onClick={() => setDifficulty(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 안내 */}
            <Card variant="glass" padding="var(--space-md)">
              <h3 className="dashboard__notice-title">면접 진행 안내</h3>
              <ul className="dashboard__notice-list">
                {hasResume ? (
                  <li>이력서 기반 맞춤 질문이 자동으로 포함됩니다.</li>
                ) : (
                  <li>이력서 업로드 시 맞춤 질문을 받을 수 있습니다.</li>
                )}
                <li>조용하고 밝은 공간에서 진행하세요.</li>
                <li>답변은 타이머 종료 전 자동 저장됩니다.</li>
                <li>AI가 답변을 분석하여 피드백을 제공합니다.</li>
              </ul>
            </Card>

            {startError && (
              <div className="dashboard__alert dashboard__alert--danger">
                {startError}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              disabled={!isReady || uploadStatus === "uploading"}
              loading={isStarting}
              onClick={handleStartInterview}
              style={{ width: "100%", marginTop: "4px" }}
            >
              {!isReady
                ? "기기 연결 확인 중..."
                : uploadStatus === "uploading"
                  ? "이력서 분석 중..."
                  : hasResume
                    ? "맞춤 면접 시작하기 →"
                    : "면접 시작하기 →"}
            </Button>
          </section>
        </div>
      </div>

      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="상세 설정"
        size="sm"
      >
        <p style={{ color: "var(--color-text-secondary)" }}>
          추가 설정 옵션이 여기에 표시됩니다.
        </p>
      </Modal>
    </div>
  );
}
