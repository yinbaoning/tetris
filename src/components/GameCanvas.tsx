import { useEffect, useRef, useCallback } from 'react';
import type { Board, ActivePiece } from '../types';
import { COLOR_MAP, GAME_CONFIG } from '../types';

/**
 * 游戏画布组件 Props 接口
 */
interface GameCanvasProps {
  /** 游戏面板状态 */
  board: Board;
  /** 当前活动的方块 */
  currentPiece: ActivePiece | null;
  /** 幽灵方块位置（用于硬降预览） */
  ghostPosition: number | null;
  /** 当前正在消除的行索引数组 */
  clearingRows: number[];
  /** 单元格大小（像素） */
  cellSize: number;
}

/**
 * 游戏画布组件
 * 使用 Canvas API 渲染游戏面板、方块和视觉效果
 * 包含圆角矩形绘制、渐变效果、幽灵方块等视觉增强
 * @todo 考虑将渲染逻辑抽取为自定义 Hook，提高组件可维护性
 */
export function GameCanvas({
  board,
  currentPiece,
  ghostPosition,
  clearingRows,
  cellSize,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * 绘制圆角矩形
   * 使用 Canvas 二次贝塞尔曲线实现圆角效果
   * @param ctx - Canvas 2D 绘图上下文
   * @param x - 矩形 x 坐标
   * @param y - 矩形 y 坐标
   * @param width - 矩形宽度
   * @param height - 矩形高度
   * @param radius - 圆角半径
   */
  const drawRoundedRect = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    },
    []
  );

  /**
   * 绘制单个单元格
   * 根据单元格状态绘制不同样式：
   * - 普通方块：渐变填充 + 边框 + 高光 + 发光效果
   * - 幽灵方块：半透明边框 + 内部填充
   * - 消除中：闪烁白色效果
   * @param ctx - Canvas 2D 绘图上下文
   * @param x - 单元格 x 坐标
   * @param y - 单元格 y 坐标
   * @param color - 方块颜色
   * @param isGhost - 是否为幽灵方块
   * @param isClearing - 是否处于消除状态
   */
  const drawCell = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      isGhost: boolean = false,
      isClearing: boolean = false
    ) => {
      const padding = 1;
      const cellX = x * cellSize + padding;
      const cellY = y * cellSize + padding;
      const cellWidth = cellSize - padding * 2;
      const cellHeight = cellSize - padding * 2;
      const radius = 3;

      ctx.save();

      if (isClearing) {
        // 清除动画效果
        const alpha = 0.5 + Math.sin(Date.now() / 50) * 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        drawRoundedRect(ctx, cellX, cellY, cellWidth, cellHeight, radius);
        ctx.fill();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffffff';
      } else if (isGhost) {
        // 幽灵方块效果
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        drawRoundedRect(ctx, cellX, cellY, cellWidth, cellHeight, radius);
        ctx.stroke();

        // 内部填充
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        // 普通方块
        const gradient = ctx.createLinearGradient(cellX, cellY, cellX, cellY + cellHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, adjustBrightness(color, -20));

        ctx.fillStyle = gradient;
        drawRoundedRect(ctx, cellX, cellY, cellWidth, cellHeight, radius);
        ctx.fill();

        // 边框
        ctx.strokeStyle = adjustBrightness(color, 30);
        ctx.lineWidth = 1;
        ctx.stroke();

        // 高光效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
          cellX + cellWidth / 2,
          cellY + cellHeight * 0.3,
          cellWidth * 0.3,
          cellHeight * 0.15,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // 发光效果
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.stroke();
      }

      ctx.restore();
    },
    [cellSize, drawRoundedRect]
  );

  /**
   * 调整颜色亮度
   * 通过 RGB 分量运算实现颜色变亮或变暗
   * @param color - 十六进制颜色值（如 #FF0000）
   * @param percent - 亮度调整百分比（正数变亮，负数变暗）
   * @returns 调整后的十六进制颜色值
   */
  const adjustBrightness = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  /**
   * 绘制网格线
   * 绘制面板背景网格，增强视觉参考效果
   * @param ctx - Canvas 2D 绘图上下文
   */
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(42, 42, 58, 0.5)';
      ctx.lineWidth = 1;

      // 垂直线
      for (let col = 0; col <= GAME_CONFIG.COLS; col++) {
        const x = col * cellSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_CONFIG.ROWS * cellSize);
        ctx.stroke();
      }

      // 水平线
      for (let row = 0; row <= GAME_CONFIG.ROWS; row++) {
        const y = row * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_CONFIG.COLS * cellSize, y);
        ctx.stroke();
      }

      ctx.restore();
    },
    [cellSize]
  );

  /**
   * 主绘制函数
   * 完整的游戏渲染流程：
   * 1. 清空画布
   * 2. 绘制背景网格
   * 3. 绘制已锁定的方块（面板状态）
   * 4. 绘制幽灵方块（硬降预览）
   * 5. 绘制当前活动方块
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    drawGrid(ctx);

    // 绘制已锁定的方块
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
      for (let col = 0; col < GAME_CONFIG.COLS; col++) {
        const cell = board[row][col];
        if (cell !== 'empty') {
          const isClearing = clearingRows.includes(row);
          drawCell(ctx, col, row, COLOR_MAP[cell], false, isClearing);
        }
      }
    }

    // 绘制幽灵方块
    if (currentPiece && ghostPosition !== null) {
      const color = COLOR_MAP[currentPiece.color];
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const boardY = ghostPosition + row;
            const boardX = currentPiece.x + col;
            if (boardY >= 0 && boardY < GAME_CONFIG.ROWS) {
              drawCell(ctx, boardX, boardY, color, true);
            }
          }
        }
      }
    }

    // 绘制当前方块
    if (currentPiece) {
      const color = COLOR_MAP[currentPiece.color];
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const boardY = currentPiece.y + row;
            const boardX = currentPiece.x + col;
            if (boardY >= 0 && boardY < GAME_CONFIG.ROWS) {
              drawCell(ctx, boardX, boardY, color);
            }
          }
        }
      }
    }
  }, [board, currentPiece, ghostPosition, clearingRows, drawCell, drawGrid]);

  // 动画循环
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [draw]);

  const canvasWidth = GAME_CONFIG.COLS * cellSize;
  const canvasHeight = GAME_CONFIG.ROWS * cellSize;

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
