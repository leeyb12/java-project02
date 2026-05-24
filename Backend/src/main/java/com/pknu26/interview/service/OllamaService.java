package com.pknu26.interview.service;

import com.pknu26.interview.client.OllamaClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class OllamaService {

    private final OllamaClient ollamaClient;  // HTTP 호출은 OllamaClient에 위임

    /**
     * 단순 프롬프트 전송 — ResumeService에서 이력서 파싱 시 호출
     */
    public String generate(String prompt) {
        return ollamaClient.generate(prompt);
    }

    /**
     * 이력서 기반 면접 질문 생성 — ResumeController에서 호출
     */
    public String generateQuestions(String resumeText, String category, int count) {
        String prompt = """
                다음 이력서를 분석하여 %s 면접 질문 %d개를 생성해줘.
                
                이력서:
                %s
                
                반드시 아래 JSON 배열 형식으로만 출력해. 마크다운 블록이나 다른 텍스트는 절대 포함하지 마.
                [
                  {"id":"q_001","text":"질문내용","category":"%s","timeLimit":180,"resumeBased":true}
                ]
                """.formatted(category, count, resumeText, category);

        return ollamaClient.generate(prompt);
    }
}