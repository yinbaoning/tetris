import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  GameState,
  Board,
  ActivePiece,
  TetrominoType,
  GameStats,
} from '../types';
import {
  GAME_CONFIG,
  TETROMINO_TYPES,
  SCORE_TABLE,
  createEmptyBoard,
  createPiece,
  rotateMatrix,
  checkCollision,
  calculateGhostPosition,
} from '../utils/tetrisUtils';

/**
 * 俄罗斯方块游戏核心 Hook
 * 负责管理游戏状态、方块操作、消行检测、计分系统等核心游戏逻辑
 */
export function useTetris() {
  // 游戏状态
  const [gameState, setGameState] = useState<GameState>('ready');
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<ActivePiece | null>(null);
  const [nextPiece, setNextPiece] = useState<ActivePiece | null>(null);
  const [stats, setStats] = useState<GameStats>({ score: 0, level: 1, lines: 0 });
  const [isPaused, setIsPaused] = useState(false);
  // 当前正在消除的行（用于触发动画效果）
  const [clearingRows, setClearingRows] = useState<number[]>([]);

  // 使用 ref 存储游戏循环相关数据，避免闭包问题
  // 使用 ref 是因为 requestAnimationFrame 的回调函数会形成闭包，
  // 如果直接使用 state 可能导致引用过时的问题
  const gameRef = useRef({
    dropInterval: GAME_CONFIG.BASE_DROP_INTERVAL as number,
    lastDropTime: 0,
    // 7-Bag 随机算法使用的袋子：包含所有7种方块类型，打乱后依次取出
    bag: [] as TetrominoType[],
    animationId: null as number | null,
  });

  /**
   * 从袋子中获取下一个方块类型（7-Bag 随机算法）
   * 7-Bag 算法：每次将所有7种方块放入袋子中，打乱顺序后依次取出
   * 这样可以保证每种方块都会出现，且连续出现同种方块的概率较低
   * @returns 下一个方块类型
   */
  const getNextPieceFromBag = useCallback((): TetrominoType => {
    const { bag } = gameRef.current;
    if (bag.length === 0) {
      // 重新填充并打乱袋子
      const newBag = [...TETROMINO_TYPES];
      for (let i = newBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
      }
      gameRef.current.bag = newBag;
    }
    return gameRef.current.bag.pop()!;
  }, []);

  /**
   * 生成新方块
   * 如果是第一次生成（prev 为 null），则从袋子中获取
   * 同时预生成下一个方块用于预览
   */
  const spawnPiece = useCallback(() => {
    setCurrentPiece((prev) => {
      const newPiece = prev === null ? createPiece(getNextPieceFromBag()) : nextPiece;
      setNextPiece(createPiece(getNextPieceFromBag()));
      return newPiece;
    });
  }, [getNextPieceFromBag, nextPiece]);

  /**
   * 锁定方块到面板并立即检查消除
   * 将当前活动方块的颜色写入面板，并检测是否有满行需要消除
   * @returns 是否有满行被消除
   * @todo 考虑将消行逻辑分离，提高代码可维护性
   * @todo 考虑添加 T-Spin 检测以支持更多得分方式
   */
  const lockPieceAndClearLines = useCallback((): boolean => {
    if (!currentPiece) return false;

    // 先计算锁定后的面板状态
    const lockedBoard = board.map((row) => [...row]);
    const { shape, color, x, y } = currentPiece;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const boardY = y + row;
          const boardX = x + col;
          if (boardY >= 0) {
            lockedBoard[boardY][boardX] = color;
          }
        }
      }
    }

    // 立即检查满行（使用锁定后的面板）
    const fullRows: number[] = [];
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
      if (lockedBoard[row].every((cell) => cell !== 'empty')) {
        fullRows.push(row);
      }
    }

    if (fullRows.length > 0) {
      // 有满行，更新面板（移除满行）
      const newBoard = lockedBoard.filter((_, index) => !fullRows.includes(index));
      const emptyRows = Array(fullRows.length)
        .fill(null)
        .map(() => Array(GAME_CONFIG.COLS).fill('empty') as ('empty')[]);
      
      setBoard([...emptyRows, ...newBoard] as Board);

      // 更新分数和等级
      setStats((prev) => {
        const newLines = prev.lines + fullRows.length;
        const newLevel = Math.floor(newLines / GAME_CONFIG.LINES_PER_LEVEL) + 1;
        const lineScore = SCORE_TABLE[fullRows.length as keyof typeof SCORE_TABLE] || 0;
        const newScore = prev.score + lineScore * prev.level;

        // 更新下落速度
        gameRef.current.dropInterval = Math.max(
          GAME_CONFIG.MIN_DROP_INTERVAL,
          GAME_CONFIG.BASE_DROP_INTERVAL - (newLevel - 1) * GAME_CONFIG.LEVEL_SPEED_INCREMENT
        );

        return { score: newScore, level: newLevel, lines: newLines };
      });

      // 触发动画效果
      setClearingRows(fullRows);
      setTimeout(() => {
        setClearingRows([]);
      }, 200);

      return true;
    } else {
      // 没有满行，只更新面板
      setBoard(lockedBoard);
      return false;
    }
  }, [board, currentPiece]);

  /**
   * 移动方块
   * @param dx - 水平移动距离（负数向左，正数向右）
   * @param dy - 垂直移动距离（负数向上，正数向下）
   * @returns 是否移动成功
   * @todo 考虑添加软降（soft drop）得分
   */
  const movePiece = useCallback(
    (dx: number, dy: number): boolean => {
      if (!currentPiece || gameState !== 'playing' || isPaused) return false;

      const newX = currentPiece.x + dx;
      const newY = currentPiece.y + dy;

      if (!checkCollision(board, newX, newY, currentPiece.shape)) {
        setCurrentPiece({ ...currentPiece, x: newX, y: newY });
        return true;
      }

      // 如果是向下移动且发生碰撞，锁定方块并立即检查消除
      if (dy > 0) {
        lockPieceAndClearLines();
        spawnPiece();
      }

      return false;
    },
    [board, currentPiece, gameState, isPaused, lockPieceAndClearLines, spawnPiece]
  );

  /**
   * 旋转方块
   * 使用 wall kick（踢墙）机制：当旋转后位置发生碰撞时，
   * 尝试左右偏移 0、-1、1、-2、2 格来寻找可行的位置
   * 这是经典俄罗斯方块游戏中常用的旋转偏移系统（SRS 简化版）
   * @todo 考虑实现完整的 SRS 旋转系统，支持更复杂的踢墙偏移
   */
  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameState !== 'playing' || isPaused) return;

    const rotated = rotateMatrix(currentPiece.shape);
    const kicks = [0, -1, 1, -2, 2]; // 踢墙测试偏移量

    for (const kick of kicks) {
      const newX = currentPiece.x + kick;
      if (!checkCollision(board, newX, currentPiece.y, rotated)) {
        setCurrentPiece({ ...currentPiece, shape: rotated, x: newX });
        return;
      }
    }
  }, [board, currentPiece, gameState, isPaused]);

  /**
   * 硬降（直接落到底部）
   * 计算幽灵方块位置，一次性将方块移动到底部
   * 硬降距离会转换为额外分数（每格2分）
   * @todo 考虑添加硬降落地后的动画效果
   */
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameState !== 'playing' || isPaused) return;

    const ghostY = calculateGhostPosition(board, currentPiece);
    const dropDistance = ghostY - currentPiece.y;

    // 如果已经在底部，不执行任何操作
    if (dropDistance === 0) return;

    // 创建新位置的方块
    const droppedPiece = { ...currentPiece, y: ghostY };

    // 先计算锁定后的面板状态
    const lockedBoard = board.map((row) => [...row]);
    const { shape, color, x, y } = droppedPiece;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const boardY = y + row;
          const boardX = x + col;
          if (boardY >= 0) {
            lockedBoard[boardY][boardX] = color;
          }
        }
      }
    }

    // 立即检查满行
    const fullRows: number[] = [];
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
      if (lockedBoard[row].every((cell) => cell !== 'empty')) {
        fullRows.push(row);
      }
    }

    if (fullRows.length > 0) {
      // 有满行，更新面板（移除满行）
      const newBoard = lockedBoard.filter((_, index) => !fullRows.includes(index));
      const emptyRows = Array(fullRows.length)
        .fill(null)
        .map(() => Array(GAME_CONFIG.COLS).fill('empty') as ('empty')[]);
      
      setBoard([...emptyRows, ...newBoard] as Board);

      // 更新分数和等级（包含硬降奖励）
      setStats((prev) => {
        const newLines = prev.lines + fullRows.length;
        const newLevel = Math.floor(newLines / GAME_CONFIG.LINES_PER_LEVEL) + 1;
        const lineScore = SCORE_TABLE[fullRows.length as keyof typeof SCORE_TABLE] || 0;
        const newScore = prev.score + lineScore * prev.level + dropDistance * 2;

        // 更新下落速度
        gameRef.current.dropInterval = Math.max(
          GAME_CONFIG.MIN_DROP_INTERVAL,
          GAME_CONFIG.BASE_DROP_INTERVAL - (newLevel - 1) * GAME_CONFIG.LEVEL_SPEED_INCREMENT
        );

        return { score: newScore, level: newLevel, lines: newLines };
      });

      // 触发动画效果
      setClearingRows(fullRows);
      setTimeout(() => {
        setClearingRows([]);
      }, 200);
    } else {
      // 没有满行，只更新面板
      setBoard(lockedBoard);
      
      // 硬降奖励分数
      setStats((prev) => ({
        ...prev,
        score: prev.score + dropDistance * 2,
      }));
    }

    // 生成新方块
    spawnPiece();
  }, [board, currentPiece, gameState, isPaused, spawnPiece]);

  /**
   * 游戏主循环
   * 使用 requestAnimationFrame 实现流畅的动画循环
   * 根据时间戳自动控制方块下落，支持暂停和恢复
   * @param timestamp - 由 requestAnimationFrame 传入的时间戳
   */
  const gameLoop = useCallback(
    (timestamp: number) => {
      if (gameState !== 'playing') return;

      if (isPaused) {
        gameRef.current.animationId = requestAnimationFrame(gameLoop);
        return;
      }

      // 自动下落
      if (timestamp - gameRef.current.lastDropTime > gameRef.current.dropInterval) {
        movePiece(0, 1);
        gameRef.current.lastDropTime = timestamp;
      }

      gameRef.current.animationId = requestAnimationFrame(gameLoop);
    },
    [gameState, isPaused, movePiece]
  );

  /**
   * 开始游戏
   * 初始化游戏状态，生成初始方块，启动游戏循环
   * 只能在 ready 或 gameover 状态下调用
   */
  const startGame = useCallback(() => {
    if (gameState === 'ready' || gameState === 'gameover') {
      // 重置游戏状态
      setBoard(createEmptyBoard());
      setStats({ score: 0, level: 1, lines: 0 });
      gameRef.current.dropInterval = GAME_CONFIG.BASE_DROP_INTERVAL;
      gameRef.current.bag = [];
      gameRef.current.lastDropTime = performance.now();

      // 生成初始方块
      const firstPiece = createPiece(getNextPieceFromBag());
      const secondPiece = createPiece(getNextPieceFromBag());
      setCurrentPiece(firstPiece);
      setNextPiece(secondPiece);

      setGameState('playing');
      setIsPaused(false);
    }
  }, [gameState, getNextPieceFromBag]);

  /**
   * 暂停/继续游戏
   * 切换游戏暂停状态，暂停时停止方块自动下落
   * 恢复时重置 lastDropTime 以避免时间跳跃
   * 只能在 playing 状态下调用
   */
  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setIsPaused((prev) => !prev);
      if (isPaused) {
        gameRef.current.lastDropTime = performance.now();
      }
    }
  }, [gameState, isPaused]);

  /**
   * 重新开始游戏
   * 先取消当前游戏循环，再重置所有状态，最后调用 startGame
   * 适用于游戏结束后用户希望立即重新开始的情况
   */
  const restartGame = useCallback(() => {
    if (gameRef.current.animationId) {
      cancelAnimationFrame(gameRef.current.animationId);
    }
    setGameState('ready');
    setIsPaused(false);
    setCurrentPiece(null);
    setNextPiece(null);
    setClearingRows([]);
    startGame();
  }, [startGame]);

  /**
   * 游戏结束
   */
  const gameOver = useCallback(() => {
    setGameState('gameover');
    if (gameRef.current.animationId) {
      cancelAnimationFrame(gameRef.current.animationId);
    }
  }, []);

  // 启动游戏循环
  useEffect(() => {
    if (gameState === 'playing' && !isPaused) {
      gameRef.current.animationId = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameRef.current.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
      }
    };
  }, [gameState, isPaused, gameLoop]);

  // 检查游戏结束
  useEffect(() => {
    if (gameState === 'playing' && currentPiece) {
      const isGameOver = checkCollision(board, currentPiece.x, currentPiece.y, currentPiece.shape);
      if (isGameOver && currentPiece.y <= 0) {
        gameOver();
      }
    }
  }, [currentPiece, board, gameState, gameOver]);

  // 计算幽灵方块位置
  const ghostPosition = currentPiece
    ? calculateGhostPosition(board, currentPiece)
    : null;

  return {
    // 状态
    gameState,
    board,
    currentPiece,
    nextPiece,
    stats,
    isPaused,
    clearingRows,
    ghostPosition,
    // 操作
    startGame,
    restartGame,
    togglePause,
    movePiece,
    rotatePiece,
    hardDrop,
    dropInterval: gameRef.current.dropInterval,
  };
}
