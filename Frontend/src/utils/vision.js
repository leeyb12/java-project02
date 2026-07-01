/**
 * vision.js
 * 웹캠 프레임 캡처 및 표정(감정) 라벨 유틸
 */

/** face-api 표정 키 → 한국어 라벨 */
export const EXPRESSION_LABELS = {
  neutral: "무표정",
  happy: "미소",
  sad: "슬픔",
  angry: "화남",
  fearful: "긴장",
  disgusted: "불편",
  surprised: "놀람",
};

/** 표정 이모지 */
export const EXPRESSION_EMOJI = {
  neutral: "😐",
  happy: "🙂",
  sad: "😔",
  angry: "😠",
  fearful: "😰",
  disgusted: "😖",
  surprised: "😮",
};

export function expressionLabel(key) {
  return EXPRESSION_LABELS[key] || key || "-";
}

/**
 * video 엘리먼트에서 현재 프레임을 캡처해 JPEG data URI로 반환합니다.
 * @param {HTMLVideoElement} videoEl
 * @param {number} maxWidth - 다운스케일 기준 가로 폭(px)
 * @param {number} quality - JPEG 품질(0~1)
 * @returns {string|null} data:image/jpeg;base64,... 또는 캡처 불가 시 null
 */
export function captureFrame(videoEl, maxWidth = 480, quality = 0.7) {
  if (!videoEl || videoEl.readyState < 2 || !videoEl.videoWidth) return null;

  const scale = Math.min(1, maxWidth / videoEl.videoWidth);
  const w = Math.round(videoEl.videoWidth * scale);
  const h = Math.round(videoEl.videoHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(videoEl, 0, 0, w, h);

  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return null;
  }
}
