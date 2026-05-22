import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumeUpload from '../../components/interview/ResumeUpload';
import Button from '../../components/common/Button';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalysisComplete = (data) => {
        setIsAnalyzing(false);
        navigate(`/interview/${data.sessionId}`, { 
            state: { questions: data.questions, mode: 'ai-custom' } 
        });
    };

    return (
        <div className="dashboard">
            <header className="dashboard__header">
                <h1 className="dashboard__title">AI 면접 시뮬레이터</h1>
                <p className="dashboard__subtitle">이력서를 업로드하여 Ollama 기반 맞춤형 면접을 시작하세요.</p>
            </header>

            <main className="dashboard__content">
                <div className="dashboard__card-grid">
                    <section className="dashboard__card dashboard__card--upload">
                        <div className="dashboard__card-header">
                            <span className="dashboard__card-icon">📄</span>
                            <h2 className="dashboard__card-title">이력서 기반 맞춤 면접</h2>
                        </div>
                        <div className="dashboard__card-body">
                            <ResumeUpload 
                                onStart={() => setIsAnalyzing(true)} 
                                onComplete={handleAnalysisComplete}
                                onError={(msg) => {
                                    alert(msg);
                                    setIsAnalyzing(false);
                                }}
                            />
                        </div>
                    </section>

                    <section className="dashboard__card dashboard__card--standard">
                        <div className="dashboard__card-header">
                            <span className="dashboard__card-icon">💡</span>
                            <h2 className="dashboard__card-title">기본 역량 면접</h2>
                        </div>
                        <div className="dashboard__card-body">
                            <p className="dashboard__card-desc">
                                이력서 없이 일반적인 직군별 핵심 질문으로 연습합니다.
                            </p>
                            <Button 
                                variant="secondary" 
                                size="lg"
                                onClick={() => navigate('/interview/setup')}
                                disabled={isAnalyzing}
                                style={{ width: '100%' }}
                            >
                                바로 시작하기
                            </Button>
                        </div>
                    </section>
                </div>

                {isAnalyzing && (
                    <div className="dashboard__overlay">
                        <div className="dashboard__loader-box">
                            <div className="dashboard__spinner"></div>
                            <p>Ollama가 이력서를 분석하여<br/>맞춤형 질문을 생성하고 있습니다...</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}