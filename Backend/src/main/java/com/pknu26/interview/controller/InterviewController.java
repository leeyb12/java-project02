package com.pknu26.interview.controller;

// 누락되었던 필수 임포트 구문들
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class InterviewController {

    @GetMapping("/")
    public String hello() {
        return "Interview Application Running...";
    }
}