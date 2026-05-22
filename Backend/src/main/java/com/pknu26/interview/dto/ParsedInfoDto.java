package com.pknu26.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedInfoDto {

    /** 이름 */
    private String name;

    /** 기술 스택 목록 */
    private List<String> skills;

    /** 경력 목록 */
    private List<String> experience;

    /** 학력 목록 */
    private List<String> education;
}