'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook que gerencia o ciclo de vida da câmera do dispositivo.
 *
 * Responsabilidades:
 *   - Pede permissão de câmera (getUserMedia)
 *   - Mantém referência ao MediaStream ativo
 *   - Anexa o stream a um <video> via ref
 *   - Para o stream ao desmontar (libera a luz da câmera no celular)
 *   - Captura um frame como pixels RGBA via Canvas API
 *
 * Erros tratados:
 *   - NotAllowedError: usuário negou permissão
 *   - NotFoundError: dispositivo não tem câmera
 *   - NotReadableError: outro app está usando a câmera
 *   - OverconstrainedError: facingMode 'environment' indisponível (desktop)
 *
 * @example
 *   const camera = useCamera({ facingMode: 'environment' });
 *   <video ref={camera.videoRef} autoPlay playsInline muted />
 *   <button onClick={camera.start}>Ativar câmera</button>
 *   <button onClick={() => {
 *     const pixels = camera.capturePixels(512, 512);
 *     // pixels = { width, height, data: Uint8ClampedArray }
 *   }}>Capturar</button>
 */

export type CameraStatus = 'idle' | 'requesting' | 'streaming' | 'denied' | 'error';

export interface UseCameraOptions {
  /**
   * Câmera preferida. 'environment' = traseira (padrão pra analisar cabelo
   * do cliente); 'user' = frontal (selfie).
   * Em desktop sem câmera traseira, faz fallback automático pra 'user'.
   */
  facingMode?: 'environment' | 'user';
  /** Resolução ideal (o browser pode dar resolução próxima). */
  width?: number;
  height?: number;
}

export interface CapturedPixels {
  width: number;
  height: number;
  /** RGBA contínuo (4 bytes por pixel). */
  data: Uint8ClampedArray;
}

export interface UseCameraReturn {
  /** Ref pra anexar ao elemento <video>. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Estado atual da câmera. */
  status: CameraStatus;
  /** Mensagem de erro humana (PT-BR) quando status === 'error' ou 'denied'. */
  errorMessage: string | null;
  /** Inicia o stream (pede permissão se necessário). */
  start: () => Promise<void>;
  /** Para o stream e libera a câmera. */
  stop: () => void;
  /**
   * Captura um frame do vídeo atual como pixels RGBA, redimensionando
   * para `width × height` (default 512×512 — bom equilíbrio precisão/payload).
   * Retorna null se o vídeo ainda não estiver pronto.
   */
  capturePixels: (width?: number, height?: number) => CapturedPixels | null;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { facingMode = 'environment', width = 1280, height = 720 } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cleanup ao desmontar — libera a câmera (importante: senão LED fica acesa)
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    // Se já está streaming, no-op
    if (streamRef.current) return;

    setStatus('requesting');
    setErrorMessage(null);

    try {
      // Tenta câmera traseira; se falhar (desktop), tenta qualquer câmera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: width },
            height: { ideal: height },
          },
          audio: false,
        });
      } catch (err) {
        if ((err as Error).name === 'OverconstrainedError') {
          // Sem câmera traseira (desktop) — tenta qualquer uma
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw err;
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Espera o vídeo ter dimensões válidas antes de marcar como "streaming"
        await videoRef.current.play().catch(() => {
          /* play() pode rejeitar por autoplay policy mas o stream ainda fica visível */
        });
      }

      setStatus('streaming');
    } catch (err) {
      const name = (err as Error).name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setStatus('denied');
        setErrorMessage(
          'Permissão de câmera negada. Permita o acesso nas configurações do navegador e tente novamente.',
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setStatus('error');
        setErrorMessage('Nenhuma câmera encontrada neste dispositivo.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setStatus('error');
        setErrorMessage('Câmera em uso por outro aplicativo. Feche e tente novamente.');
      } else {
        setStatus('error');
        setErrorMessage(`Erro ao acessar câmera: ${(err as Error).message}`);
      }
    }
  }, [facingMode, width, height]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  const capturePixels = useCallback(
    (w = 512, h = 512): CapturedPixels | null => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) return null;

      // Cria canvas offscreen do tamanho alvo
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Calcula crop central da câmera pra ficar quadrado (cabeça/cabelo costuma ficar no meio)
      const sourceSize = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - sourceSize) / 2;
      const sy = (video.videoHeight - sourceSize) / 2;

      // Desenha o crop quadrado redimensionado pra w×h (cover behavior)
      ctx.drawImage(video, sx, sy, sourceSize, sourceSize, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      return {
        width: imageData.width,
        height: imageData.height,
        data: imageData.data,
      };
    },
    [],
  );

  return { videoRef, status, errorMessage, start, stop, capturePixels };
}
