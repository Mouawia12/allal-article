import { useEffect, useRef, useState } from "react";

export default function useSupportAudioRecorder({ onComplete, onError }) {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const [isRecording, setIsRecording] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const stop = ({ discard = false } = {}) => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      if (discard) {
        recorder.ondataavailable = null;
        recorder.onstop = () => {
          chunksRef.current = [];
          recorderRef.current = null;
          stopStream();
          setIsRecording(false);
        };
      }
      recorder.stop();
      return;
    }
    stopStream();
    setIsRecording(false);
  };

  const start = async () => {
    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onError?.("المتصفح لا يدعم تسجيل الصوت");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || chunksRef.current[0]?.type || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const durationSeconds = (Date.now() - startedAtRef.current) / 1000;
        recorderRef.current = null;
        stopStream();
        setIsRecording(false);

        try {
          await onComplete?.(blob, durationSeconds);
        } catch (error) {
          onError?.(error.message || "تعذر إرسال التسجيل الصوتي");
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      recorderRef.current = null;
      stopStream();
      setIsRecording(false);
      onError?.(error.message || "تعذر الوصول للميكروفون");
    }
  };

  const toggle = () => {
    if (isRecording) {
      stop();
      return;
    }
    start();
  };

  useEffect(() => () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = stopStream;
      recorder.stop();
    } else {
      stopStream();
    }
  }, []);

  return { isRecording, start, stop, toggle };
}
