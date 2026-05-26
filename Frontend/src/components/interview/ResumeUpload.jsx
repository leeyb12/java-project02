import { useState } from "react";
// 1. 수정: 생짜 axios 대신 타임아웃(180초) 설정을 해둔 커스텀 api 인스턴스를 가져옵니다.
// (프로젝트 구조에 맞게 api.js 파일 경로를 확인해 주세요. 예: ../api/api)
import api from "../api/api";
import Button from "../common/Button";

export default function ResumeUpload({ onStart, onComplete, onError }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("이력서 파일을 선택해주세요.");
      return;
    }

    setIsUploading(true);
    onStart();

    const formData = new FormData();
    // 2. 수정: 백엔드 Controller의 @RequestParam 구조에 맞게 "resume" 대신 "file"로 변경합니다.
    formData.append("file", file);

    try {
      // 3. 수정: axios.post 대신 커스텀 인스턴스인 api.post 사용
      const response = await api.post("/interviews/resume/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // 4. 안전 가드 추가: 백엔드에서 바깥 필드로 펼쳐준 데이터를 안전하게 추출
      const {
        resumeId,
        extractedText,
        name,
        skills,
        experience,
        education,
        parsedInfo,
      } = response.data;

      // 상위 컴포넌트(onComplete)로 파싱된 통합 데이터를 안전하게 넘겨줍니다.
      onComplete({
        resumeId,
        extractedText,
        name,
        skills,
        experience,
        education,
        parsedInfo,
      });
    } catch (error) {
      console.error("이력서 분석 실패:", error);
      const errorMsg =
        error.response?.data?.message ||
        "이력서를 분석하는 중 오류가 발생했습니다.";
      onError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="resume-upload">
      <div className="file-input-group">
        <label htmlFor="resumeFile" className="file-label">
          <span className="file-label__icon">{file ? "📄" : "📂"}</span>
          <span className="file-label__text">
            {file ? file.name : "이력서 파일 선택 (PDF, DOCX)"}
          </span>
          {file && (
            <span className="file-label__size">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          )}
        </label>
        <input
          type="file"
          id="resumeFile"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden-input"
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleUpload}
        disabled={!file}
        loading={isUploading}
        style={{ width: "100%", marginTop: "20px" }}
      >
        AI 맞춤 면접 시작하기
      </Button>

      {file && !isUploading && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFile(null)}
          style={{ width: "100%", marginTop: "8px", fontSize: "12px" }}
        >
          파일 취소
        </Button>
      )}
    </div>
  );
}
