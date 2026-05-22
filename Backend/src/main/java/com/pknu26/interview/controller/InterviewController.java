package com.pknu26.interview.controller;

import com.pknu26.interview.dto.InterviewRequestDto;
import com.pknu26.interview.dto.InterviewResponseDto;
import com.pknu26.interview.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/setup")
    public ResponseEntity<Map<String, Object>> setupInterview(
            @ModelAttribute InterviewRequestDto requestDto) {
        try {
            // 1. 질문 생성
            List<InterviewResponseDto> questions = interviewService.createInterview(requestDto);
            
            // 2. 임시 세션 ID 생성 (이미 서비스에서 생성 중이라면 해당 값을 가져오세요)
            // 만약 DB에 저장했다면 그 세션의 PK값을 사용하면 됩니다.
            String sessionId = java.util.UUID.randomUUID().toString().substring(0, 8); 

            // 3. sessionId와 questions를 묶어서 반환
            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", sessionId);
            response.put("questions", questions);
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
