package com.pknu26.interview.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
            // PDFBox 3.x: PDDocument.load(InputStream) 삭제됨
            //              → Loader.loadPDF(byte[]) 로 교체
            try (PDDocument document = Loader.loadPDF(dto.getFile().getBytes())) {
                resumeText = new PDFTextStripper().getText(document);
            }
        }

        // [중요] 2. memberId가 null인 경우 기본값 할당 (DB 에러 방지)
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

    public List<QuestionDto> getQuestionsBySessionId(String sessionId) {
        InterviewSession session = findSessionById(sessionId);
        String category = session != null && session.getCategory() != null ? session.getCategory() : "general";

        return interviewMapper.getQuestionsBySessionId(sessionId).stream()
                .map(item -> QuestionDto.builder()
                        .id("q_" + item.getDetailId())
                        .text(item.getQuestionText())
                        .category(category)
                        .timeLimit(180)
                        .resumeBased(session != null && session.getResumeId() != null)
                        .build())
                .collect(Collectors.toList());
    }
}
