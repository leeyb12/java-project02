package com.pknu26.interview.controller;

import com.pknu26.interview.dto.AppearanceRequestDto;
import com.pknu26.interview.service.AppearanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 웹캠 스냅샷 기반 복장 분석 API
 */
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class AppearanceController {

    private final AppearanceService appearanceService;

    /** 질문당 1회, 웹캠 프레임을 받아 복장을 분석합니다. */
    @PostMapping("/sessions/{sessionId}/appearance")
    public ResponseEntity<Map<String, Object>> analyzeAppearance(
            @PathVariable("sessionId") String sessionId,
            @RequestBody AppearanceRequestDto req) {

        Map<String, Object> clothing = appearanceService.analyzeClothing(req.getImageBase64());

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", sessionId);
        response.put("questionId", req.getQuestionId());
        response.put("clothing", clothing);
        return ResponseEntity.ok(response);
    }
}
