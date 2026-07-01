import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

/**
 * useFaceExpression
 * face-api.js(@vladmandic/face-api)로 브라우저에서 실시간 표정을 감지합니다.
 * - 모델은 CDN에서 1회 로드 (tinyFaceDetector + faceExpressionNet)
 * - start(videoEl) 호출 시 주기적으로 표정을 샘플링하며 집계
 * - summarize()로 질문별 요약(대표 표정/분포/평균/안정도)을 반환
 */

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
const SAMPLE_INTERVAL_MS = 700;

let modelsPromise = null;
function loadModels() {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
  }
  return modelsPromise;
}

function emptyAgg() {
  return { counts: {}, sums: {}, samples: 0 };
}

export function useFaceExpression() {
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(null); // { dominant, score }

  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const aggRef = useRef(emptyAgg());
  const readyRef = useRef(false);

  /* 모델 로드 */
  useEffect(() => {
    let mounted = true;
    loadModels()
      .then(() => {
        if (mounted) {
          readyRef.current = true;
          setReady(true);
        }
      })
      .catch((err) => {
        console.warn("[useFaceExpression] 모델 로드 실패:", err?.message || err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /* 감지 시작 — 집계 초기화 후 주기적 샘플링 */
  const start = useCallback(
    (videoEl) => {
      videoRef.current = videoEl;
      aggRef.current = emptyAgg();
      setCurrent(null);
      stop();

      intervalRef.current = setInterval(async () => {
        const v = videoRef.current;
        if (!v || !readyRef.current || v.readyState < 2 || !v.videoWidth) return;
        try {
          const det = await faceapi
            .detectSingleFace(v, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
          if (!det || !det.expressions) return;

          const expr = det.expressions;
          let dominant = "neutral";
          let max = -1;
          for (const [k, val] of Object.entries(expr)) {
            aggRef.current.sums[k] = (aggRef.current.sums[k] || 0) + val;
            if (val > max) {
              max = val;
              dominant = k;
            }
          }
          aggRef.current.counts[dominant] =
            (aggRef.current.counts[dominant] || 0) + 1;
          aggRef.current.samples += 1;
          setCurrent({ dominant, score: max });
        } catch {
          /* 프레임 단위 오류는 무시 */
        }
      }, SAMPLE_INTERVAL_MS);
    },
    [stop],
  );

  /* 집계 요약 반환 (감지 중단은 별도 stop 호출) */
  const summarize = useCallback(() => {
    const { counts, sums, samples } = aggRef.current;
    if (!samples) return null;

    let dominant = "neutral";
    let maxCount = -1;
    for (const [k, c] of Object.entries(counts)) {
      if (c > maxCount) {
        maxCount = c;
        dominant = k;
      }
    }

    const averages = {};
    for (const [k, s] of Object.entries(sums)) {
      averages[k] = Number((s / samples).toFixed(3));
    }

    return {
      dominant,
      distribution: counts,
      averages,
      samples,
      stability: Number((maxCount / samples).toFixed(2)), // 대표 표정 비율(집중도)
    };
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { ready, current, start, stop, summarize };
}
