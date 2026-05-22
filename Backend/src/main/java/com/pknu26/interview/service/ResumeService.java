package com.pknu26.interview.service;

import java.io.IOException;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final OllamaService ollamaService;
    private final ResumeRepository resumeRepository;

    // PDF 텍스트 추출 (PDFBox)
    public String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument doc = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    // DOCX 텍스트 추출 (Apache POI)
    public String extractTextFromDocx(MultipartFile file) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(file.getInputStream())) {
            XWPFWordExtractor extractor = new XWPFWordExtractor(doc);
            return extractor.getText();
        }
    }

    // 파일 종류에 따라 분기
    public String extractText(MultipartFile file) throws IOException {
        String name = file.getOriginalFilename().toLowerCase();
        if (name.endsWith(".pdf"))  return extractTextFromPdf(file);
        if (name.endsWith(".docx")) return extractTextFromDocx(file);
        return new String(file.getBytes(), StandardCharsets.UTF_8); // txt
    }

    // Ollama로 이력서 파싱 (이름/스킬/경력 추출)
    public ParsedInfo parseResumeWithOllama(String resumeText) {
        String prompt = """
            다음 이력서에서 정보를 추출해줘. JSON 형식으로만 출력해.
            
            이력서: %s
            
            출력 형식:
            {"name":"이름","skills":["기술1","기술2"],"experience":["경력1"],"education":["학력1"]}
            """.formatted(resumeText);

        String raw = ollamaService.generate(prompt);
        return parseJson(raw, ParsedInfo.class);
    }

    // 업로드 + 파싱 통합
    public ResumeUploadResponse upload(MultipartFile file) throws IOException {
        String text = extractText(file);
        ParsedInfo parsed = parseResumeWithOllama(text);

        Resume resume = Resume.builder()
            .id(UUID.randomUUID().toString())
            .fileName(file.getOriginalFilename())
            .rawText(text)
            .parsedInfo(parsed)
            .build();

        resumeRepository.save(resume);

        return ResumeUploadResponse.builder()
            .resumeId(resume.getId())
            .extractedText(text)
            .parsedInfo(parsed)
            .build();
    }
}
