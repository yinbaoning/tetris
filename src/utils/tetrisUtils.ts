import type {
  Board,
  ActivePiece,
  TetrominoType,
  ShapeMatrix,
} from '../types';
import { GAME_CONFIG, TETROMINOES } from '../types';

/**
 * 俄罗斯方块工具函数模块
 * 包含方块创建、矩阵旋转、碰撞检测等核心算法
 */

/**
 * 创建空的游戏面板
 * @returns 二维数组，每行 GAME_CONFIG.ROWS 行，每列 GAME_CONFIG.COLS 列
 * @todo 考虑使用 TypedArray 优化内存使用
 */
export function createEmptyBoard(): Board {
  return Array(GAME_CONFIG.ROWS)
    .fill(null)
    .map(() => Array(GAME_CONFIG.COLS).fill('empty') as ('empty')[]);
}

/**
 * 创建新方块
 * @param type - 方块类型（I、O、T、L、J、S、Z）
 * @returns 包含方块类型、形状、颜色和初始位置的 ActivePiece 对象
 * @todo 考虑添加方块旋转状态（用于 SRS 系统）
 */
export function createPiece(type: TetrominoType): ActivePiece {
  const pieceData = TETROMINOES[type];
  const shape = pieceData.shape.map((row) => [...row]);
  return {
    type,
    shape,
    color: pieceData.color,
    x: Math.floor((GAME_CONFIG.COLS - shape[0].length) / 2),
    y: 0,
  };
}

/**
 * 旋转矩阵（顺时针90度）
 * 使用数学方法将原始矩阵的行列互换实现旋转
 * 核心原理：旋转后的 matrix[col][rows - 1 - row] = 原始 matrix[row][col]
 * @param matrix - 要旋转的二维矩阵
 * @returns 旋转后的新矩阵
 * @todo 考虑添加逆时针旋转支持
 */
export function rotateMatrix(matrix: ShapeMatrix): ShapeMatrix {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: ShapeMatrix = [];

  for (let col = 0; col < cols; col++) {
    rotated[col] = [];
    for (let row = rows - 1; row >= 0; row--) {
      rotated[col][rows - 1 - row] = matrix[row][col];
    }
  }

  return rotated;
}

/**
 * 检查碰撞
 * 检测给定位置和形状是否与边界或已锁定方块发生碰撞
 * @param board - 当前游戏面板
 * @param x - 方块左上角 x 坐标
 * @param y - 方块左上角 y 坐标
 * @param shape - 方块形状矩阵
 * @returns 是否发生碰撞
 * @todo 考虑优化检测算法，减少遍历次数
 */
export function checkCollision(
  board: Board,
  x: number,
  y: number,
  shape: ShapeMatrix
): boolean {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col;
        const newY = y + row;

        // 检查边界
        if (newX < 0 || newX >= GAME_CONFIG.COLS || newY >= GAME_CONFIG.ROWS) {
          return true;
        }

        // 检查与已锁定方块的碰撞
        if (newY >= 0 && board[newY][newX] !== 'empty') {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * 计算幽灵方块位置（硬降目标位置）
 * 向下模拟移动方块，找到不会发生碰撞的最底层位置
 * 幽灵方块用于显示硬降时方块会落到的位置，帮助玩家预判
 * @param board - 当前游戏面板
 * @param piece - 当前活动方块
 * @returns 幽灵方块的 y 坐标
 */
export function calculateGhostPosition(
  board: Board,
  piece: ActivePiece
): number {
  let ghostY = piece.y;
  while (!checkCollision(board, piece.x, ghostY + 1, piece.shape)) {
    ghostY++;
  }
  return ghostY;
}

/**
 * 重新导出类型和常量
 */
export { GAME_CONFIG, TETROMINOES, TETROMINO_TYPES, SCORE_TABLE, DEFAULT_KEY_BINDINGS } from '../types';
