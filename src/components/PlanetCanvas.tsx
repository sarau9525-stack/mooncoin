import React, { useRef, useEffect, useCallback } from 'react';
import { UserGameProfile } from '../types/game';
import { PLANET_STAGES } from '../config/gameConfig';
import { soundManager } from '../services/audio';
import { telegramBridge } from '../services/telegram';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  alpha: number;
  vy: number;
  color: string;
  isCrit: boolean;
  scale: number;
}

interface PlanetCanvasProps {
  user: UserGameProfile;
  onTap: (e: React.MouseEvent | React.TouchEvent, count?: number) => void;
  disabled?: boolean;
}

export const PlanetCanvas: React.FC<PlanetCanvasProps> = ({ user, onTap, disabled = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Layout & Dimensions tracking (in CSS logical pixels)
  const dimsRef = useRef<{ width: number; height: number; dpr: number }>({ width: 340, height: 340, dpr: 1 });

  // Touch gesture discriminator: distinguishes clean taps from scroll drags
  const touchStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Animation & Physics Refs
  const rotationRef = useRef<number>(0);
  const squashRef = useRef<{ x: number; y: number; velocity: number }>({ x: 1, y: 1, velocity: 0 });
  const shockwavesRef = useRef<{ radius: number; maxRadius: number; alpha: number; color: string }[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const nextTextIdRef = useRef<number>(1);
  const starsRef = useRef<{ x: number; y: number; size: number; alpha: number; speed: number }[]>([]);

  const stageConfig = PLANET_STAGES[user.planetStage] || PLANET_STAGES[1];

  // Initialize background starfield
  useEffect(() => {
    const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 800,
        size: Math.random() * 1.6 + 0.6,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.008 + 0.002,
      });
    }
    starsRef.current = stars;
  }, []);

  // Responsive Canvas Resize handler with accurate DPR handling
  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(280, Math.floor(rect.width));
    const height = Math.max(280, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;

    dimsRef.current = { width, height, dpr };
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Main 60fps render loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const { width, height, dpr } = dimsRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      const planetRadius = Math.min(width, height) * 0.27;

      ctx.save();
      // Scale by DPR so all coordinates inside render are pure CSS logical pixels
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Starfield
      for (const star of starsRef.current) {
        star.alpha += Math.sin(currentTime * star.speed) * 0.01;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.15, Math.min(0.9, star.alpha))})`;
        ctx.beginPath();
        const sx = (star.x / 800) * width;
        const sy = (star.y / 800) * height;
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Rotate planet slightly
      rotationRef.current += dt * 0.22;

      // 3. Elastic Spring Physics for Squash and Stretch
      const s = squashRef.current;
      const targetSquash = 1;
      const stiffness = 220;
      const damping = 14;
      const force = (targetSquash - s.x) * stiffness;
      s.velocity += force * dt;
      s.velocity -= s.velocity * damping * dt;
      s.x += s.velocity * dt;
      s.y = 1 / Math.max(0.6, s.x); // Area preservation

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(s.x, s.y);
      ctx.translate(-centerX, -centerY);

      // 4. Draw Atmospheric Glow Behind Planet
      const atmGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        planetRadius * 0.85,
        centerX,
        centerY,
        planetRadius * 1.35
      );
      atmGlow.addColorStop(0, stageConfig.atmosphereColor);
      atmGlow.addColorStop(0.6, stageConfig.atmosphereColor.replace(/[\d.]+\)$/, '0.12)'));
      atmGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, planetRadius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 5. Draw Planet Base Sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, planetRadius, 0, Math.PI * 2);
      ctx.clip();

      // Base gradient based on evolution stage
      const baseGrad = ctx.createRadialGradient(
        centerX - planetRadius * 0.35,
        centerY - planetRadius * 0.35,
        planetRadius * 0.1,
        centerX,
        centerY,
        planetRadius
      );

      switch (user.planetStage) {
        case 1:
          baseGrad.addColorStop(0, '#94a3b8');
          baseGrad.addColorStop(0.5, '#475569');
          baseGrad.addColorStop(1, '#0f172a');
          break;
        case 2:
          baseGrad.addColorStop(0, '#38bdf8');
          baseGrad.addColorStop(0.4, '#0284c7');
          baseGrad.addColorStop(0.8, '#0369a1');
          baseGrad.addColorStop(1, '#082f49');
          break;
        case 3:
          baseGrad.addColorStop(0, '#34d399');
          baseGrad.addColorStop(0.35, '#059669');
          baseGrad.addColorStop(0.7, '#047857');
          baseGrad.addColorStop(1, '#064e3b');
          break;
        case 4:
          baseGrad.addColorStop(0, '#c084fc');
          baseGrad.addColorStop(0.4, '#7c3aed');
          baseGrad.addColorStop(0.8, '#4c1d95');
          baseGrad.addColorStop(1, '#1e1b4b');
          break;
        case 5:
          baseGrad.addColorStop(0, '#fbbf24');
          baseGrad.addColorStop(0.35, '#d97706');
          baseGrad.addColorStop(0.75, '#78350f');
          baseGrad.addColorStop(1, '#1c1917');
          break;
        case 6:
          baseGrad.addColorStop(0, '#f472b6');
          baseGrad.addColorStop(0.4, '#db2777');
          baseGrad.addColorStop(0.8, '#831843');
          baseGrad.addColorStop(1, '#3b0764');
          break;
      }

      ctx.fillStyle = baseGrad;
      ctx.fill();

      // Rotating Surface Patterns / Continents / Biomes
      const rot = rotationRef.current;
      ctx.save();
      ctx.translate(centerX, centerY);

      if (user.planetStage >= 3) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
        for (let i = 0; i < 4; i++) {
          const angle = rot + (i * Math.PI) / 2;
          const cx = Math.cos(angle) * (planetRadius * 0.45);
          const cy = Math.sin(angle * 1.5) * (planetRadius * 0.35);
          ctx.beginPath();
          ctx.ellipse(cx, cy, planetRadius * 0.3, planetRadius * 0.18, angle * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Craters & Crystal Geodes
      if (user.planetStage >= 1) {
        ctx.fillStyle = user.planetStage >= 2 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(15, 23, 42, 0.4)';
        for (let i = 0; i < 5; i++) {
          const angle = rot * 0.7 + i * 1.4;
          const dist = planetRadius * 0.5 + Math.sin(i * 99) * (planetRadius * 0.25);
          const cx = Math.cos(angle) * dist;
          const cy = Math.sin(angle) * dist;
          ctx.beginPath();
          ctx.arc(cx, cy, 6 + i * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Glowing City Lights on Night Side (Stage 4+)
      if (user.planetStage >= 4) {
        ctx.fillStyle = '#fef08a';
        for (let i = 0; i < 18; i++) {
          const a = rot * 1.2 + i * 0.35;
          const d = planetRadius * 0.2 + (i % 6) * (planetRadius * 0.12);
          const px = Math.cos(a) * d;
          const py = Math.sin(a) * d;
          if (px > 0) {
            ctx.beginPath();
            ctx.arc(px, py, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();

      // 3D Light Shading
      const lightGrad = ctx.createLinearGradient(
        centerX - planetRadius * 0.8,
        centerY - planetRadius * 0.8,
        centerX + planetRadius * 0.8,
        centerY + planetRadius * 0.8
      );
      lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
      lightGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
      lightGrad.addColorStop(0.7, 'rgba(5, 8, 20, 0.45)');
      lightGrad.addColorStop(1, 'rgba(5, 8, 20, 0.85)');
      ctx.fillStyle = lightGrad;
      ctx.fill();

      ctx.restore(); // End planet clip

      // 6. Draw Built Structures & Mines on Planet Surface Horizon
      const rotH = rotationRef.current;
      const b = user.buildings;

      // Crystal Mines (Stage 1+)
      if (b.crystal_mine > 0) {
        ctx.save();
        ctx.translate(centerX, centerY);
        const mineCount = Math.min(6, Math.max(1, Math.floor(b.crystal_mine / 4) + 1));
        for (let m = 0; m < mineCount; m++) {
          const angle = rotH * 0.5 + (m * Math.PI * 2) / mineCount;
          const hx = Math.cos(angle) * planetRadius;
          const hy = Math.sin(angle) * planetRadius;
          ctx.save();
          ctx.translate(hx, hy);
          ctx.rotate(angle + Math.PI / 2);
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(-4, 0);
          ctx.lineTo(0, -14 - Math.min(10, b.crystal_mine * 0.3));
          ctx.lineTo(4, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // Solar Generators (Stage 1+)
      if (b.solar_generator > 0) {
        ctx.save();
        ctx.translate(centerX, centerY);
        const genAngle = rotH * 0.4 + 1.2;
        const gx = Math.cos(genAngle) * planetRadius;
        const gy = Math.sin(genAngle) * planetRadius;
        ctx.translate(gx, gy);
        ctx.rotate(genAngle + Math.PI / 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-10, -12, 20, 4);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-1.5, -8, 3, 8);
        ctx.restore();
      }

      // Biosphere Alien Habitat Domes (Stage 2+)
      if (b.alien_habitat > 0) {
        ctx.save();
        ctx.translate(centerX, centerY);
        const domeAngle = rotH * 0.4 + 2.8;
        const dx = Math.cos(domeAngle) * planetRadius;
        const dy = Math.sin(domeAngle) * planetRadius;
        ctx.translate(dx, dy);
        ctx.rotate(domeAngle + Math.PI / 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, 9, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Research Lab Antenna (Stage 2+)
      if (b.research_lab > 0) {
        ctx.save();
        ctx.translate(centerX, centerY);
        const labAngle = rotH * 0.4 + 4.2;
        const lx = Math.cos(labAngle) * planetRadius;
        const ly = Math.sin(labAngle) * planetRadius;
        ctx.translate(lx, ly);
        ctx.rotate(labAngle + Math.PI / 2);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-2, -16, 4, 16);
        ctx.beginPath();
        ctx.arc(0, -18, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Spaceport Launch Dock (Stage 3+)
      if (b.spaceport > 0) {
        ctx.save();
        ctx.translate(centerX, centerY);
        const spAngle = rotH * 0.4 + 5.3;
        const sx = Math.cos(spAngle) * planetRadius;
        const sy = Math.sin(spAngle) * planetRadius;
        ctx.translate(sx, sy);
        ctx.rotate(spAngle + Math.PI / 2);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-2, -18);
        ctx.lineTo(2, -18);
        ctx.lineTo(6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Aegis Planet Shield Ring (Stage 4+)
      if (b.planet_shield > 0 || user.planetStage >= 5) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 + Math.sin(currentTime * 0.003) * 0.15})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, planetRadius * 1.16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Stage 6 Dyson Mega-Ring
      if (user.planetStage >= 6) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotH * 0.3);
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, planetRadius * 1.5, planetRadius * 0.45, Math.PI / 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore(); // Restore squash and stretch

      // 7. Shockwave Pulses from Taps
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += dt * 320;
        sw.alpha -= dt * 2.2;
        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwavesRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.strokeStyle = sw.color.replace(')', `, ${sw.alpha})`).replace('rgb', 'rgba');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 8. Stardust Particles Burst
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color.replace(')', `, ${p.alpha})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 9. Floating Text Rewards (+1, CRIT! +15)
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy * dt;
        ft.alpha -= dt * 1.2;

        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.font = ft.isCrit ? '900 24px "Outfit", sans-serif' : '700 18px "Outfit", sans-serif';
        ctx.fillStyle = ft.color.replace(')', `, ${ft.alpha})`).replace('rgb', 'rgba');
        ctx.textAlign = 'center';
        ctx.shadowColor = ft.isCrit ? '#f59e0b' : '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore(); // Restore DPR scaling

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [user.planetStage, user.buildings, stageConfig]);

  // Spawn visual tap effects
  const spawnTapEffects = useCallback(
    (clientX: number, clientY: number, count: number = 1, isCrit: boolean = false, earned: number = 1) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Squash planet impulse
      squashRef.current.x = 0.88;
      squashRef.current.velocity = -2.8;

      // Shockwave
      shockwavesRef.current.push({
        radius: rect.width * 0.28,
        maxRadius: rect.width * 0.65,
        alpha: 0.9,
        color: isCrit ? 'rgb(245, 158, 11)' : 'rgb(56, 189, 248)',
      });

      // Spawn burst particles
      const particleColors = isCrit
        ? ['rgb(245, 158, 11)', 'rgb(251, 191, 36)', 'rgb(255, 255, 255)']
        : ['rgb(56, 189, 248)', 'rgb(14, 165, 233)', 'rgb(255, 255, 255)'];

      for (let i = 0; i < (isCrit ? 16 : 8); i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 140 + 60;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
          size: Math.random() * 3 + 2,
          alpha: 1,
          maxLife: Math.random() * 0.35 + 0.25,
          life: 0,
        });
      }

      // Spawn Floating Text
      floatingTextsRef.current.push({
        id: nextTextIdRef.current++,
        x: x + (Math.random() * 30 - 15),
        y: y - 10,
        text: isCrit ? `CRIT! +${earned}` : `+${earned}`,
        alpha: 1,
        vy: -90 - Math.random() * 30,
        color: isCrit ? 'rgb(251, 191, 36)' : 'rgb(56, 189, 248)',
        isCrit,
        scale: 1,
      });

      // Haptic & Sound
      if (isCrit) {
        telegramBridge.hapticTap('heavy');
        soundManager.playCrit();
      } else {
        telegramBridge.hapticTap('light');
        soundManager.playTap();
      }
    },
    []
  );

  // Distinguish clean tap from scroll drag
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    touchStartPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !touchStartPosRef.current) return;
    const dx = Math.abs(e.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(e.clientY - touchStartPosRef.current.y);
    const dt = Date.now() - touchStartPosRef.current.time;
    touchStartPosRef.current = null;

    // If movement is small (< 14px) and quick (< 600ms), it's a tap, NOT a scroll!
    if (dx < 14 && dy < 14 && dt < 600) {
      spawnTapEffects(e.clientX, e.clientY, 1, false, user.tapPower);
      onTap(e, 1);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] sm:h-[380px] md:h-[440px] flex items-center justify-center select-none overflow-hidden touch-pan-y"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="w-full h-full cursor-pointer active:scale-[0.99] transition-transform outline-none touch-pan-y"
        style={{ touchAction: 'pan-y' }}
      />

      {/* Visual Level & Evolution Stage Badge */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md shadow-lg shadow-black/40">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stageConfig.glowColor }} />
          <span className="text-xs font-bold text-slate-200 tracking-wide font-display">
            {user.planetName} · Lvl {user.planetLevel}
          </span>
        </div>
      </div>

      {/* Tap Guidance Hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none text-center opacity-70">
        <span className="text-[11px] text-slate-400 font-medium tracking-tight">
          Tap planet to harvest · Swipe to scroll
        </span>
      </div>
    </div>
  );
};
