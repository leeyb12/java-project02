package com.pknu26.interview.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Ollama WebClient 빈 설정
 * OllamaClient가 주입받는 WebClient를 여기서 등록합니다.
 */
@Configuration // 💡 불필요한 implements WebMvcConfigurer 제거
public class OllamaConfig {

    @Value("${ollama.api.url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Bean
    public WebClient ollamaWebClient() {
        return WebClient.builder()
                .baseUrl(ollamaBaseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .codecs(configurer ->
                        // 이력서 텍스트가 길 수 있으므로 버퍼 크기 16MB로 확장
                        configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024)
                )
                .build();
    }
}