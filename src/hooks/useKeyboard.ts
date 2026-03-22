import { useEffect, useCallback } from 'react';
import type { GameState } from '../types';
import { DEFAULT_KEY_BINDINGS } from '../types';

/**
 * 键盘控制 Hook 参数接口
 */
interface UseKeyboardProps {
  /** 当前游戏状态 */
  gameState: GameState;
  /** 游戏是否暂停 */
  isPaused: boolean;
  /** 向左移动回调 */
  onMoveLeft: () => void;
  /** 向右移动回调 */
  onMoveRight: () => void;
  /** 向下移动回调 */
  onMoveDown: () => void;
  /** 旋转回调 */
  onRotate: () => void;
  /** 硬降回调 */
  onHardDrop: () => void;
  /** 暂停/继续回调 */
  onPause: () => void;
}

/**
 * 键盘控制 Hook
 * 统一管理游戏键盘事件，支持多种按键方案
 * 使用 useCallback 缓存处理函数，避免不必要的重新渲染
 * @param props - 包含游戏状态和回调函数的配置对象
 */
export function useKeyboard({
  gameState,
  isPaused,
  onMoveLeft,
  onMoveRight,
  onMoveDown,
  onRotate,
  onHardDrop,
  onPause,
}: UseKeyboardProps) {
  /**
   * 键盘事件处理函数
   * 根据按键类型调用相应的回调函数
   * 在暂停状态下只响应暂停键，其他状态根据游戏状态响应
   * @param e - 键盘事件对象
   * @todo 考虑添加自定义按键绑定功能
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key;

      // 暂停状态下只响应暂停键
      if (isPaused) {
        if (DEFAULT_KEY_BINDINGS.pause.includes(key)) {
          e.preventDefault();
          onPause();
        }
        return;
      }

      // 游戏未进行时不响应
      if (gameState !== 'playing') return;

      // 移动控制
      if (DEFAULT_KEY_BINDINGS.moveLeft.includes(key)) {
        e.preventDefault();
        onMoveLeft();
      } else if (DEFAULT_KEY_BINDINGS.moveRight.includes(key)) {
        e.preventDefault();
        onMoveRight();
      } else if (DEFAULT_KEY_BINDINGS.moveDown.includes(key)) {
        e.preventDefault();
        onMoveDown();
      } else if (DEFAULT_KEY_BINDINGS.rotate.includes(key)) {
        e.preventDefault();
        onRotate();
      } else if (DEFAULT_KEY_BINDINGS.hardDrop.includes(key)) {
        e.preventDefault();
        onHardDrop();
      } else if (DEFAULT_KEY_BINDINGS.pause.includes(key)) {
        e.preventDefault();
        onPause();
      }
    },
    [
      gameState,
      isPaused,
      onMoveLeft,
      onMoveRight,
      onMoveDown,
      onRotate,
      onHardDrop,
      onPause,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
