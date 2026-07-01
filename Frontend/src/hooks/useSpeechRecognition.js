import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useSpeechRecognition
 * 브라우저 Web Speech API(webkitSpeechRecognition)로 답변 음성을 실시간 텍스트로 변환합니다.
 * - Chrome/Edge 등 지원 브라우저에서만 동작 (미지원 시 supported=false)
 * - start()로 시작, stop()으로 종료하며 stop()은 최종 transcript를 반환
 */
export function useSpeechRecognition({ lang = "ko-KR" } = {}) {
  const SpeechRecognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const supported = Boolean(SpeechRecognition);

  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const finalRef = useRef(""); // 확정된 텍스트 누적
  const shouldRunRef = useRef(false); // 자동 재시작 제어

  useEffect(() => {
    if (!supported) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalRef.current += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }
      setTranscript((finalRef.current + interim).trim());
    };

    recognition.onerror = (e) => {
      // no-speech/aborted 등은 무시하고 계속 진행
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        shouldRunRef.current = false;
        setListening(false);
      }
    };

    recognition.onend = () => {
      // continuous 모드도 침묵 시 자동 종료되므로, 의도된 실행 중이면 재시작
      if (shouldRunRef.current) {
        try {
          recognition.start();
        } catch {
          /* 이미 시작된 경우 무시 */
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRunRef.current = false;
      try {
        recognition.stop();
      } catch {
        /* 무시 */
      }
      recognitionRef.current = null;
    };
  }, [supported, lang, SpeechRecognition]);

  const start = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    finalRef.current = "";
    setTranscript("");
    shouldRunRef.current = true;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      /* 이미 실행 중이면 무시 */
    }
  }, [supported]);

  /** 종료 후 최종 transcript 반환 */
  const stop = useCallback(() => {
    shouldRunRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* 무시 */
      }
    }
    setListening(false);
    return finalRef.current.trim();
  }, []);

  return { supported, transcript, listening, start, stop };
}
