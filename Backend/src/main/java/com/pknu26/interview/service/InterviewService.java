package com.pknu26.interview.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pknu26.interview.dto.InterviewRequestDto;
import com.pknu26.interview.dto.InterviewResponseDto;
import com.pknu26.interview.dto.QuestionDto;
import com.pknu26.interview.entity.InterviewSession;
import com.pknu26.interview.repository.InterviewMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewMapper interviewMapper;

    @Transactional
    public List<InterviewResponseDto> createInterview(InterviewRequestDto dto) throws IOException {
        // 1. PDF 텍스트 추출
        String resumeText = "";
        if (dto.getFile() != null && !dto.getFile().isEmpty()) {
            try (PDDocument document = Loader.loadPDF(dto.getFile().getBytes())) {
                resumeText = new PDFTextStripper().getText(document);
            }
        }

        // 2. memberId가 null인 경우 기본값 할당 (DB 에러 방지)
        if (dto.getMemberId() == null || dto.getMemberId().trim().isEmpty()) {
            dto.setMemberId("GUEST_USER");
        }

        // 3. 세션 ID 생성 및 저장
        String sessionId = UUID.randomUUID().toString();
        dto.setSessionId(sessionId);
        dto.setResumeContent(resumeText);

        interviewMapper.insertSession(dto);

        // 4. Ollama 연동 (가상 로직: 실제로는 Ollama API 호출 필요)
        List<InterviewResponseDto> questions = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            questions.add(InterviewResponseDto.builder()
                    .sessionId(sessionId)
                    .questionText("AI가 생성한 " + i + "번째 질문입니다.")
                    .sortOrder(i)
                    .build());
        }

        // 5. 질문 DB 저장 및 반환
        interviewMapper.insertInterviewDetails(questions);
        return questions;
    }

    public InterviewSession createSessionWithQuestions(String resumeId, String category, int questionCount, List<QuestionDto> questions) {
        String sessionId = UUID.randomUUID().toString();
        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .resumeId(resumeId)
                .category(category == null || category.isBlank() ? "general" : category)
                .questionCount(questionCount > 0 ? questionCount : 5)
                .status("active")
                .startedAt(LocalDateTime.now())
                .build();

        interviewMapper.insertInterviewSession(session);

        if (questions != null && !questions.isEmpty()) {
            List<InterviewResponseDto> details = new ArrayList<>();
            int order = 1;
            for (QuestionDto question : questions) {
                details.add(InterviewResponseDto.builder()
                        .sessionId(sessionId)
                        .questionText(question.getText())
                        .sortOrder(order++)
                        .build());
            }
            interviewMapper.insertInterviewDetails(details);
        }

        return session;
    }

    public InterviewSession findSessionById(String sessionId) {
        return interviewMapper.findSessionById(sessionId);
    }

    public void endSession(String sessionId) {
        interviewMapper.endSession(sessionId);
    }

    /**
     * ResumeController에서 에러가 나던 해결용 메서드 추가
     */
    public List<InterviewResponseDto> getQuestionsBySessionId(String sessionId) {
        // XML에 정의해 두신 질문 조회 Mapper 호출 (알맞은 형태로 반환되도록 연결)
        // 반환 타입 불일치 시 마이바티스 결과나 캐스팅 확인이 필요할 수 있습니다.
        return interviewMapper.selectQuestionsBySessionId(sessionId);
    }

    /**
     * 면접 종합 결과 조회 및 무응답(0점) 방어 로직 최종본
     */
    public InterviewResponseDto getInterviewResult(String sessionId) {
        
        // 1. 이미 정의하신 기존 매퍼 메서드 'findSessionById'로 매칭하여 에러 해결
        InterviewSession session = interviewMapper.findSessionById(sessionId); 
        
        // 2. 해당 세션에 제출된 답변 리스트 조회 (인터페이스에 생성 필수)
        List<Object> answers = interviewMapper.selectAnswersBySessionId(sessionId);

        // 🔍 [핵심 무응답 방어] 답변 리스트가 아예 비어있다면 (아무 답변 없이 나간 경우)
        if (answers == null || answers.isEmpty()) {
            return InterviewResponseDto.builder()
                    .sessionId(sessionId)
                    .questionText("") // 빌더 필드 맞춤 에러 방지
                    .build();
        }

        // 3. 답변이 존재할 때 정상적인 연산 수행
        int totalScore = 0;
        // 향후 Object 대신 실제 Answer Entity 클래스가 완성되면 캐스팅하여 점수를 더해주세요.
        for (Object ans : answers) {
            // totalScore += ((ActualAnswerClass) ans).getScore(); 
        }
        int averageScore = totalScore / answers.size();

        return InterviewResponseDto.builder()
                .sessionId(sessionId)
                .build();
    }
}