package com.pknu26.interview.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pknu26.interview.dto.InterviewRequestDto;
import com.pknu26.interview.dto.InterviewResponseDto;
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
            try (PDDocument document = PDDocument.load(dto.getFile().getInputStream())) {
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
        
        // 이제 MEMBER_ID가 "GUEST_USER"로 채워져서 에러가 나지 않습니다.
        interviewMapper.insertSession(dto);

        // 3. Ollama 연동 (가상 로직: 실제로는 Ollama API 호출 필요)
        // 여기서는 예시 질문 3개를 생성하는 것으로 대체합니다.
        List<InterviewResponseDto> questions = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            questions.add(InterviewResponseDto.builder()
                    .sessionId(sessionId)
                    .questionText("AI가 생성한 " + i + "번째 질문입니다.")
                    .sortOrder(i)
                    .build());
        }

        // 4. 질문 DB 저장 및 반환
        interviewMapper.insertInterviewDetails(questions);
        return questions;
    }
}
