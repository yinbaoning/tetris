/**
 * 俄罗斯方块类型定义模块
 * 定义游戏中使用的所有类型别名、接口和常量
 */

/** 方块类型：对应七种经典俄罗斯方块 */
export type TetrominoType = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z';

/** 游戏状态：ready（准备）、playing（进行中）、paused（暂停）、gameover（结束） */
export type GameState = 'ready' | 'playing' | 'paused' | 'gameover';

/** 方块颜色类名：用于 CSS 样式映射 */
export type BlockColor = 'block-i' | 'block-o' | 'block-t' | 'block-l' | 'block-j' | 'block-s' | 'block-z';

/** 单元格状态：empty（空）或具体的方块颜色 */
export type CellState = 'empty' | BlockColor;

/** 游戏面板类型：二维数组，行数为 ROWS，列数为 COLS */
export type Board = CellState[][];

/** 方块形状矩阵：使用 0/1 表示方块形状，1 表示有方块，0 表示空白 */
export type ShapeMatrix = number[][];

/** 方块定义：包含形状矩阵和对应的颜色类名 */
export interface TetrominoDefinition {
  shape: ShapeMatrix;
  color: BlockColor;
}

/** 当前活动的方块：包含类型、形状、颜色和位置坐标 */
export interface ActivePiece {
  type: TetrominoType;
  shape: ShapeMatrix;
  color: BlockColor;
  x: number;
  y: number;
}

/** 游戏配置常量：使用 as const 确保字面量类型 */
export const GAME_CONFIG = {
  COLS: 10,   // 面板列数
  ROWS: 20,   // 面板行数
  PREVIEW_COLS: 4,   // 预览区域列数
  PREVIEW_ROWS: 4,   // 预览区域行数
  BASE_DROP_INTERVAL: 1000,   // 基础下落间隔（毫秒）
  MIN_DROP_INTERVAL: 100,     // 最小下落间隔（毫秒）
  LEVEL_SPEED_INCREMENT: 100, // 每级速度增量（毫秒）
  LINES_PER_LEVEL: 10,        // 升级所需消除的行数
} as const;

/**
 * 计分表：根据单次消除的行数计算基础分
 * 消除 1-4 行分别获得 100、300、500、800 分
 * 最终得分 = 基础分 × 当前等级
 */
export const SCORE_TABLE = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
} as const;

/**
 * 方块定义映射：每种方块类型的形状矩阵和颜色
 * I: 长条形（青色）、O: 方形（黄色）、T: T形（紫色）
 * L: L形（橙色）、J: 反L形（蓝色）、S: S形（绿色）、Z: Z形（红色）
 */
export const TETROMINOES: Record<TetrominoType, TetrominoDefinition> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 'block-i',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'block-o',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'block-t',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'block-l',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'block-j',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: 'block-s',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: 'block-z',
  },
};

/** 所有方块类型数组：用于 7-Bag 随机算法 */
export const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];

/**
 * 颜色映射：将 CSS 类名映射为实际颜色值（十六进制）
 * 用于 Canvas 绘制时的颜色填充
 */
export const COLOR_MAP: Record<BlockColor, string> = {
  'block-i': '#00f5d4',
  'block-o': '#ffd60a',
  'block-t': '#7209b7',
  'block-l': '#ff6d00',
  'block-j': '#3a86ff',
  'block-s': '#38b000',
  'block-z': '#e63946',
};

/** 游戏统计信息：当前得分、等级和已消除总行数 */
export interface GameStats {
  score: number;
  level: number;
  lines: number;
}

/** 键盘控制键：每种操作支持的按键列表 */
export interface KeyBindings {
  moveLeft: string[];
  moveRight: string[];
  moveDown: string[];
  rotate: string[];
  hardDrop: string[];
  pause: string[];
}

/**
 * 默认键盘绑定：开箱即用的按键方案
 * - 方向键 + WASD：移动和旋转
 * - 空格键：硬降
 * - P 键或 Escape：暂停
 * @todo 考虑添加更多按键方案供选择
 */
export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveLeft: ['ArrowLeft', 'a', 'A'],
  moveRight: ['ArrowRight', 'd', 'D'],
  moveDown: ['ArrowDown', 's', 'S'],
  rotate: ['ArrowUp', 'w', 'W'],
  hardDrop: [' '],
  pause: ['p', 'P', 'Escape'],
};
