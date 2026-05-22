package com.pknu26.interview.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 모든 주소(/**)에 대해 CORS 설정을 적용하겠다는 의미입니다.
        registry.addMapping("/**")
                // 프론트엔드 React 서버 주소(3000포트)로부터 오는 요청을 허용합니다.
                .allowedOrigins("http://localhost:3000") 
                // 데이터를 가져오고(GET), 보내고(POST), 수정하고(PUT), 삭제하는(DELETE) 메서드를 허용합니다.
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                // 모든 HTTP 헤더 요청을 허용합니다.
                .allowedHeaders("*")
                // 쿠키나 인증 정보를 포함한 요청도 허용합니다.
                .allowCredentials(true);
    }
}