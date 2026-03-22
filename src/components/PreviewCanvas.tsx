import { useEffect, useRef, useCallback } from 'react';
import type { ActivePiece } from '../types';
import { COLOR_MAP, GAME_CONFIG } from '../types';

/**
 * 预览画布组件 Props 接口
 */
interface PreviewCanvasProps {
  /** 要预览的方块（下一个方块） */
  piece: ActivePiece | null;
  /** 单元格大小（像素） */
  cellSize: number;
}

/**
 * 预览画布组件
 * 显示下一个即将出现的方块，帮助玩家提前规划
 * 使用 Canvas API 渲染，样式与主游戏区域保持一致
 */
export function PreviewCanvas({ piece, cellSize }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * 绘制预览方块
   * 将方块居中绘制在预览区域中
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!piece) return;

    const color = COLOR_MAP[piece.color];
    const shape = piece.shape;

    // 计算居中偏移
    const offsetX = Math.floor((GAME_CONFIG.PREVIEW_COLS - shape[0].length) / 2);
    const offsetY = Math.floor((GAME_CONFIG.PREVIEW_ROWS - shape.length) / 2);

    // 绘制方块
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const x = (offsetX + col) * cellSize;
          const y = (offsetY + row) * cellSize;

          // 绘制圆角矩形
          const padding = 2;
          const radius = 4;
          const width = cellSize - padding * 2;
          const height = cellSize - padding * 2;

          ctx.save();

          // 渐变填充
          const gradient = ctx.createLinearGradient(x, y, x, y + height);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, adjustBrightness(color, -20));

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x + padding, y + padding, width, height, radius);
          ctx.fill();

          // 边框
          ctx.strokeStyle = adjustBrightness(color, 30);
          ctx.lineWidth = 1;
          ctx.stroke();

          // 高光
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.ellipse(
            x + cellSize / 2,
            y + cellSize * 0.35,
            cellSize * 0.25,
            cellSize * 0.12,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();

          ctx.restore();
        }
      }
    }
  }, [piece, cellSize]);

  /**
   * 调整颜色亮度
   * @param color - 十六进制颜色值
   * @param percent - 亮度调整百分比
   * @returns 调整后的颜色值
   */
  const adjustBrightness = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  useEffect(() => {
    draw();
  }, [draw]);

  const canvasWidth = GAME_CONFIG.PREVIEW_COLS * cellSize;
  const canvasHeight = GAME_CONFIG.PREVIEW_ROWS * cellSize;

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        display: 'block',
        borderRadius: '8px',
        background: 'var(--bg-primary, #0a0a0f)',
      }}
    />
  );
}
