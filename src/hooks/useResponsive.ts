import { useState, useEffect, useCallback } from 'react';
import { GAME_CONFIG } from '../types';

/**
 * 响应式布局配置接口
 */
interface ResponsiveConfig {
  /** 主游戏区域单元格大小（像素） */
  cellSize: number;
  /** 预览区域单元格大小（像素） */
  previewCellSize: number;
  /** 是否为移动设备（宽度 <= 768px） */
  isMobile: boolean;
  /** 是否为小屏幕设备（宽度 <= 500px） */
  isSmall: boolean;
}

/**
 * 响应式布局 Hook
 * 根据窗口大小动态计算游戏界面尺寸
 * 支持多种屏幕尺寸：从小型手机到桌面显示器
 * @returns 响应式配置对象，包含单元格大小和屏幕类型标识
 * @todo 考虑使用 ResizeObserver 替代 resize 事件，提高性能
 * @todo 考虑添加横屏/竖屏检测
 */
export function useResponsive(): ResponsiveConfig {
  /**
   * 根据当前窗口尺寸计算响应式配置
   * 计算逻辑：
   * 1. 根据窗口宽度确定基础单元格大小
   * 2. 根据面板实际尺寸和可用空间进行调整
   * 3. 返回设备类型标识
   * @returns 响应式配置对象
   */
  const calculateSizes = useCallback((): ResponsiveConfig => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 根据屏幕尺寸计算合适的单元格大小
    let cellSize = 28;
    let previewCellSize = 28;

    if (width <= 500) {
      // 小屏幕手机
      cellSize = 16;
      previewCellSize = 20;
    } else if (width <= 768) {
      // 平板或大屏手机
      cellSize = 20;
      previewCellSize = 24;
    } else if (width <= 1024) {
      // 平板
      cellSize = 24;
      previewCellSize = 26;
    }

    // 确保游戏区域不会超出屏幕
    const maxBoardWidth = width - 32; // 留出边距
    const maxBoardHeight = height - 200; // 留出顶部和底部空间

    const boardWidth = GAME_CONFIG.COLS * cellSize;
    const boardHeight = GAME_CONFIG.ROWS * cellSize;

    if (boardWidth > maxBoardWidth) {
      cellSize = Math.floor(maxBoardWidth / GAME_CONFIG.COLS);
    }
    if (boardHeight > maxBoardHeight) {
      cellSize = Math.min(cellSize, Math.floor(maxBoardHeight / GAME_CONFIG.ROWS));
    }

    return {
      cellSize,
      previewCellSize,
      isMobile: width <= 768,
      isSmall: width <= 500,
    };
  }, []);

  const [config, setConfig] = useState<ResponsiveConfig>(calculateSizes);

  useEffect(() => {
    const handleResize = () => {
      setConfig(calculateSizes());
    };

    // 初始计算
    setConfig(calculateSizes());

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateSizes]);

  return config;
}
