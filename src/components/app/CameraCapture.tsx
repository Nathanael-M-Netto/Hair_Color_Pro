'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Sparkles, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useCamera, type CapturedPixels } from '@/hooks/use-camera';
import { Button } from '@/components/ui/button';
import { ManualEntry } from '@/components/app/ManualEntry';

/**
 * Componente cliente que orquestra:
 *   1. Ativação da câmera (pede permissão na primeira vez)
 *   2. Preview ao vivo dentro do círculo do viewfinder
 *   3. Captura do frame quando o usuário toca "Analisar com IA"
 *   4. POST /api/analyze com pixels base64
 *   5. Persistência do resultado em sessionStorage + navegação pra /result
 *
 * Layout: o componente RENDERIZA SEU PRÓPRIO viewfinder circular + CTA. O
 * Server Component pai (/scanner) ainda controla header (greeting) e chips
 * de dicas — separação Server/Client clean.
 *
 * Estados visuais:
 *   - idle:      ícone de câmera no centro + CTA "Ativar câmera"
 *   - requesting: spinner + "Pedindo permissão…"
 *   - streaming: vídeo ao vivo + CTA "Analisar com IA"
 *   - capturing: preview congelado + "Analisando…" (POST em curso)
 *   - denied/error: ícone de alerta + mensagem + botão "Tentar novamente"
 */

interface CameraCaptureProps {
  /**
   * Conteúdo opcional renderizado entre o viewfinder e os CTAs.
   * Ideal para chips de dicas (luz, distância) — o pai (Server Component)
   * passa o componente client de chips sem acoplar a câmera a ele.
   */
  chipsSlot?: React.ReactNode;
}

export function CameraCapture({ chipsSlot }: CameraCaptureProps = {}) {
  const router = useRouter();
  const camera = useCamera({ facingMode: 'environment' });
  const [analyzing, setAnalyzing] = useState(false);
  /**
   * Snapshot da câmera congelado no momento da captura, como dataURL.
   * Enquanto existe (analyzing=true), substitui o <video> ao vivo por <img>
   * mostrando o frame exato que foi enviado pra análise. Isso evita o
   * efeito "câmera continua mexendo mas tela diz 'analisando'", que confunde
   * o usuário sobre o quê exatamente está sendo analisado.
   */
  const [frozenFrameUrl, setFrozenFrameUrl] = useState<string | null>(null);

  const isActive = camera.status === 'streaming';
  const isLoading = camera.status === 'requesting' || analyzing;
  const isError = camera.status === 'denied' || camera.status === 'error';

  // ── Captura + análise ──────────────────────────────────────────────
  async function handleCapture() {
    const video = camera.videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast.error('Câmera não está pronta. Aguarde um momento.');
      return;
    }

    // 1) PRIMEIRO captura o snapshot visual (dataURL) — congela a UI no exato
    //    instante que o usuário tocou "Analisar". Mesmo crop quadrado central
    //    do `capturePixels` (cover behavior) pra bater pixel-a-pixel.
    const previewCanvas = document.createElement('canvas');
    const previewSize = 512;
    previewCanvas.width = previewSize;
    previewCanvas.height = previewSize;
    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) {
      toast.error('Canvas indisponível no navegador.');
      return;
    }
    const sourceSize = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - sourceSize) / 2;
    const sy = (video.videoHeight - sourceSize) / 2;
    previewCtx.drawImage(video, sx, sy, sourceSize, sourceSize, 0, 0, previewSize, previewSize);

    // dataURL JPEG (qualidade 0.85) — bem mais leve que PNG, suficiente pra preview
    const dataUrl = previewCanvas.toDataURL('image/jpeg', 0.85);
    setFrozenFrameUrl(dataUrl);

    // 2) Extrai os pixels pra mandar pra API (RGBA bruto, sem reencode)
    const pixels = camera.capturePixels(512, 512);
    if (!pixels) {
      setFrozenFrameUrl(null);
      toast.error('Falha ao capturar frame. Tente novamente.');
      return;
    }

    // 3) Para o stream — frame congelado fica visível, LED da câmera apaga
    camera.stop();

    setAnalyzing(true);
    try {
      const pixelsBase64 = encodePixelsToBase64(pixels);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width: pixels.width,
          height: pixels.height,
          pixelsBase64,
          conciso: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Falha desconhecida' }));
        throw new Error(err.error ?? 'Erro ao analisar');
      }

      const result = await res.json();

      // Persiste pro /result ler (sem state global / URL params gigantes)
      sessionStorage.setItem('last-analysis', JSON.stringify(result));
      router.push('/result');
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao analisar. Tente novamente.');
      // Limpa frame congelado e descongela UX — usuário pode tentar de novo
      setFrozenFrameUrl(null);
      setAnalyzing(false);
    }
  }

  return (
    <>
      {/* ─── Viewfinder circular ───────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6">
        {/* Glow ambient atrás do círculo — só quando câmera ativa */}
        <div
          aria-hidden="true"
          className={`absolute h-72 w-72 rounded-full blur-3xl transition-opacity duration-500 ${
            isActive ? 'opacity-100' : 'opacity-50'
          }`}
          style={{
            background:
              'radial-gradient(circle, hsl(24 55% 52% / 0.22) 0%, transparent 70%)',
          }}
        />

        {/* Círculo principal — clicável quando idle pra ativar a câmera */}
        <button
          type="button"
          onClick={isActive || analyzing || isLoading ? undefined : camera.start}
          aria-label={
            isActive ? 'Câmera ativa' : 'Toque para ativar a câmera'
          }
          disabled={isActive || analyzing}
          className={`relative grid h-64 w-64 place-items-center overflow-hidden rounded-full glass transition active:scale-[0.98] ${
            isActive ? 'cursor-default' : 'cursor-pointer'
          }`}
        >
          {/* Anéis decorativos pulsando — só quando idle (chama atenção pra tocar) */}
          {!isActive && !analyzing && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-[ring-pulse_3s_ease-in-out_infinite]" />
              <div
                className="absolute inset-4 rounded-full border border-primary/25 animate-[ring-pulse_3s_ease-in-out_infinite]"
                style={{ animationDelay: '0.4s' }}
              />
              <div
                className="absolute inset-8 rounded-full border border-primary/15 animate-[ring-pulse_3s_ease-in-out_infinite]"
                style={{ animationDelay: '0.8s' }}
              />
            </>
          )}

          {/* Borda fixa quando ativa */}
          {isActive && (
            <div className="absolute inset-0 rounded-full border-2 border-primary/60" />
          )}

          {/*
            <video> sempre renderizado mas só visível quando streaming E não
            há frame congelado. Quando captura, esconde o vídeo (também
            paramos o stream) e mostra o <img> com o snapshot.
          */}
          <video
            ref={camera.videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 h-full w-full rounded-full object-cover transition-opacity duration-300 ${
              isActive && !frozenFrameUrl ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Frame congelado — substitui o vídeo durante análise.
              Mostra exatamente o que foi enviado pra IA (cover quadrado). */}
          {frozenFrameUrl && (
            <img
              src={frozenFrameUrl}
              alt="Frame capturado"
              className="absolute inset-0 h-full w-full rounded-full object-cover"
            />
          )}

          {/* Overlay central — varia conforme estado */}
          <div className="relative z-10 flex flex-col items-center gap-3 text-center pointer-events-none">
            {camera.status === 'idle' && (
              <>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30">
                  <Camera className="h-6 w-6 text-primary" aria-hidden="true" />
                </span>
                <span className="max-w-[150px] text-[11px] font-medium leading-snug text-foreground">
                  Toque para ativar
                  <br />
                  <span className="text-muted-foreground font-normal">a câmera</span>
                </span>
              </>
            )}

            {camera.status === 'requesting' && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-[11px] text-muted-foreground">
                  Pedindo permissão…
                </span>
              </>
            )}

            {analyzing && (
              <>
                {/* Vinheta escura sobre o frame congelado pro badge ler bem */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-black/40"
                />
                <div className="relative rounded-full glass-strong px-3.5 py-2 ring-1 ring-primary/30">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    <span className="text-[11px] font-medium text-foreground">
                      Analisando…
                    </span>
                  </div>
                </div>
              </>
            )}

            {isError && (
              <>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-destructive/15 ring-1 ring-destructive/30">
                  <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
                </span>
                <span className="max-w-[170px] text-[10px] leading-snug text-muted-foreground">
                  {camera.errorMessage}
                </span>
              </>
            )}
          </div>
        </button>

        {/* Slot pras chips de dicas (luz natural, 30 cm) */}
        {chipsSlot}
      </div>

      {/* ─── CTAs no rodapé (acima da AppNav) ─────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-2 px-6 pb-24">
        {isError ? (
          <Button
            size="touch"
            variant="outline"
            className="w-full max-w-sm"
            onClick={() => camera.start()}
          >
            <RotateCcw aria-hidden="true" />
            Tentar novamente
          </Button>
        ) : isActive ? (
          <Button
            size="xl"
            className="w-full max-w-sm rounded-2xl shadow-lg shadow-primary/30"
            onClick={handleCapture}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="animate-spin" />
                Analisando…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analisar com IA
              </>
            )}
          </Button>
        ) : (
          <Button
            size="xl"
            className="w-full max-w-sm rounded-2xl shadow-lg shadow-primary/30"
            onClick={camera.start}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Iniciando…
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Ativar câmera
              </>
            )}
          </Button>
        )}

        {/* Alternativa sempre disponível à câmera — inclusive se a permissão
            for negada. O profissional informa o tom direto da paleta. */}
        {!analyzing && <ManualEntry />}
      </div>
    </>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Converte pixels RGBA pra base64 sem usar `btoa` em chunk gigante (que estora
 * stack em iOS Safari). Usa Blob + FileReader como fast path moderno.
 *
 * Por que não JSON puro? 512×512×4 = 1MB → mandar como array JSON resulta em
 * ~3MB de texto. Base64 dá ~1.4MB. Binário direto via multipart daria 1MB
 * mas exige parsing extra no server. Base64 é o sweet spot.
 */
function encodePixelsToBase64(pixels: CapturedPixels): string {
  const bytes = pixels.data;
  // btoa em chunks de 32k pra evitar stack overflow em buffers grandes
  let binary = '';
  const chunkSize = 32_768;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}
