import { useState } from 'react';
import axios from 'axios';
import Button from '../common/Button'; // 공통 버튼 컴포넌트 임포트

/**
 * 이력서 업로드 및 AI 분석 요청 컴포넌트
 */
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
        formData.append("resume", file);

        try {
            // 백엔드 API 호출 (Tika 텍스트 추출 및 Ollama 분석 수행)
            const response = await axios.post('http://localhost:8080/api/v1/interviews/resume/upload', formData);

            const { resumeId, extractedText, parsedInfo } = response.data;
            onComplete({ resumeId, extractedText, parsedInfo });
        } catch (error) {
            console.error("이력서 분석 실패:", error);
            const errorMsg = error.response?.data?.message || "이력서를 분석하는 중 오류가 발생했습니다.";
            onError(errorMsg);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="resume-upload">
            <div className="file-input-group">
                <label htmlFor="resumeFile" className="file-label">
                    <span className="file-label__icon">{file ? '📄' : '📂'}</span>
                    <span className="file-label__text">
                        {file ? file.name : "이력서 파일 선택 (PDF, DOCX)"}
                    </span>
                    {file && <span className="file-label__size">{(file.size / 1024).toFixed(1)} KB</span>}
                </label>
                <input 
                    type="file" 
                    id="resumeFile"
                    accept=".pdf,.doc,.docx" 
                    onChange={handleFileChange} 
                    className="hidden-input"
                />
            </div>
            
            {/* 수정: 일반 button 태그를 공통 Button 컴포넌트로 교체 */}
            <Button 
                variant="primary" 
                size="lg"
                onClick={handleUpload} 
                disabled={!file}
                loading={isUploading}
                style={{ width: '100%', marginTop: '20px' }}
            >
                AI 맞춤 면접 시작하기
            </Button>
            
            {file && !isUploading && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFile(null)}
                    style={{ width: '100%', marginTop: '8px', fontSize: '12px' }}
                >
                    파일 취소
                </Button>
            )}
        </div>
    );
}