package com.pknu26.interview.service.impl;

import com.pknu26.interview.client.OllamaClient;
import com.pknu26.interview.dto.InterviewRequestDto;
import com.pknu26.interview.dto.InterviewResponseDto;
import com.pknu26.interview.service.InterviewService;
import org.springframework.stereotype.Service;

@Service
public class InterviewServiceImpl implements InterviewService {

    // 외부 API 통신 책임을 격리한 OllamaClient를 주입받습니다.
    private final OllamaClient ollamaClient;

    // 스프링이 권장하는 '생성자 주입(Constructor Injection)' 방식을 사용하여 결합도를 낮춥니다.
    public InterviewServiceImpl(OllamaClient ollamaClient) {
        this.ollamaClient = ollamaClient;
    }

    @Override
    public InterviewResponseDto processInterview(InterviewRequestDto requestDto) {
        
        // 1. [방어적 프로그래밍] 무의미한 빈 값이 들어왔을 때 백엔드 입구에서 차단 (예외 처리)
        if (requestDto == null || requestDto.getUserMessage() == null || requestDto.getUserMessage().trim().isEmpty()) {
            throw new IllegalArgumentException("면접자의 답변 내용이 유효하지 않습니다.");
        }

        // 2. [프롬프트 엔지니어링] AI가 면접관처럼 행동하도록 페르소나 부여 및 규칙 한정
        String aiPrompt = String.format(
            "당신은 IT 개발자 채용을 담당하는 전문 면접관입니다. " +
            "지원자의 다음 답변을 듣고, 비판적이면서도 날카로운 심층 꼬리 질문을 '딱 1개만' 존댓말로 제안해 주세요. " +
            "\n\n[지원자 답변]: %s", 
            requestDto.getUserMessage().trim()
        );

        // 3. [책임 분리 호출] 비즈니스 로직에서 직접 HTTP 통신을 파싱하지 않고, 격리된 Client에 위임
        String aiRawResponse = ollamaClient.generateResponse(aiPrompt);

        // 4. [데이터 가공 및 불변 객체 생성] 빌더 패턴을 활용해 ResponseDto 조립
        return InterviewResponseDto.builder()
                .sessionId(requestDto.getSessionId())
                .aiMessage(aiRawResponse)
                .status("PROCESSING") // 현재 면접이 진행 중 상태임을 프론트엔드(React)에 명시
                .build();
    }
}