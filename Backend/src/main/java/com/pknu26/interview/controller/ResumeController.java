package com.pknu26.interview.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.pknu26.interview.service.OllamaService;
import com.pknu26.interview.service.ResumeService;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final OllamaService ollamaService;

    @PostMapping("/resume/upload")
    public ResponseEntity<ResumeUploadResponse> upload(
            @RequestParam("resume") MultipartFile file) throws IOException {
        return ResponseEntity.ok(resumeService.upload(file));
    }

    @PostMapping("/resume/generate-questions")
    public ResponseEntity<List<QuestionDto>> generateQuestions(
            @RequestBody GenerateQuestionsRequest req) {

        Resume resume = resumeService.findById(req.getResumeId());
        String raw = ollamaService.generateQuestions(
            resume.getRawText(), req.getCategory(), req.getQuestionCount()
        );

        List<QuestionDto> questions = parseQuestionJson(raw);
        return ResponseEntity.ok(questions);
    }
}
