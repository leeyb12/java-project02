package com.pknu26.interview.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class OllamaService {

    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;
    
    @Value("${ollama.model:llama3.2}")
    private String model;

    public String generateQuestions(String resumeText, String category, int count) {
        String prompt = """
            다음 이력서를 분석하여 %s 면접 질문 %d개를 생성해줘.
            
            이력서:
            %s
            
            반드시 아래 JSON 배열 형식으로만 출력해. 다른 텍스트는 절대 포함하지 마.
            [
              {"id":"q_001","text":"질문내용","category":"%s","timeLimit":180,"resumeBased":true}
            ]
            """.formatted(category, count, resumeText, category);

        Map<String, Object> body = Map.of(
            "model", model,
            "prompt", prompt,
            "stream", false
        );

        Map response = restTemplate.postForObject(
            ollamaBaseUrl + "/api/generate",
            body,
            Map.class
        );

        return (String) response.get("response");
    }
}
