import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard/Dashboard';
import InterviewRoom from './pages/InterviewRoom/InterviewRoom';
import Feedback from './pages/Feedback/Feedback';
import WrongNotes from './pages/WrongNotes/WrongNotes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 기본 경로: 대기실 (대시보드) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* [준비] 기기 테스트 및 정보 확인 대기실 */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* [진행] 타이머, 질문, 웹캠 연동 면접실 */}
        <Route path="/interview/:sessionId" element={<InterviewRoom />} />
        <Route path="/interview" element={<InterviewRoom />} />

        {/* [결과] 리포트 확인 및 오답 분석실 */}
        <Route path="/feedback/:sessionId" element={<Feedback />} />
        <Route path="/feedback" element={<Feedback />} />

        {/* [복습] 면접 오답노트 */}
        <Route path="/wrong-notes" element={<WrongNotes />} />

        {/* 404 폴백 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}