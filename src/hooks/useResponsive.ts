import { useState, useEffect, useCallback } from 'react';
import { GAME_CONFIG } from '../types';

/**
 * 设备类型枚举
 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'small';

/**
 * 响应式布局配置接口
 */
export interface ResponsiveConfig {
  /** 主游戏区域单元格大小（像素） */
  cellSize: number;
  /** 预览区域单元格大小（像素） */
  previewCellSize: number;
  /** 设备类型 */
  deviceType: DeviceType;
  /** 是否为桌面设备（宽度 >= 1024px） */
  isDesktop: boolean;
  /** 是否为平板设备（768px <= 宽度 < 1024px） */
  isTablet: boolean;
  /** 是否为移动设备（宽度 < 768px） */
  isMobile: boolean;
  /** 是否为小屏幕设备（宽度 < 600px） */
  isSmall: boolean;
  /** 是否为超小屏幕（宽度 < 400px） */
  isExtraSmall: boolean;
  /** 当前窗口宽度 */
  windowWidth: number;
  /** 当前窗口高度 */
  windowHeight: number;
  /** 是否为横屏模式 */
  isLandscape: boolean;
}

/**
 * 响应式布局 Hook
 * 根据窗口大小动态计算游戏界面尺寸
 * 支持多种屏幕尺寸：从超小手机到桌面显示器
 * 
 * 断点设计：
 * - 桌面端：>= 1024px
 * - 平板端：768px - 1023px
 * - 大手机：600px - 767px
 * - 小手机：400px - 599px
 * - 超小屏幕：< 400px
 * 
 * @returns 响应式配置对象，包含单元格大小和设备类型标识
 */
export function useResponsive(): ResponsiveConfig {
  /**
   * 根据当前窗口尺寸计算响应式配置
   * 计算逻辑：
   * 1. 根据窗口宽度确定设备类型
   * 2. 根据面板实际尺寸和可用空间计算单元格大小
   * 3. 确保游戏区域不会超出屏幕
   * @returns 响应式配置对象
   */
  const calculateSizes = useCallback((): ResponsiveConfig => {
    // 优先使用 window.innerWidth，如果不存在则使用默认值
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isLandscape = width > height;

    // 确定设备类型
    let deviceType: DeviceType = 'desktop';
    let cellSize = 28;
    let previewCellSize = 28;

    if (width < 400) {
      // 超小屏幕
      deviceType = 'small';
      cellSize = 14;
      previewCellSize = 16;
    } else if (width < 600) {
      // 小手机
      deviceType = 'small';
      cellSize = 16;
      previewCellSize = 18;
    } else if (width < 768) {
      // 大手机
      deviceType = 'mobile';
      cellSize = 18;
      previewCellSize = 22;
    } else if (width < 1024) {
      // 平板
      deviceType = 'tablet';
      cellSize = 22;
      previewCellSize = 24;
    } else if (width < 1440) {
      // 标准桌面
      deviceType = 'desktop';
      cellSize = 28;
      previewCellSize = 28;
    } else {
      // 大屏桌面
      deviceType = 'desktop';
      cellSize = 32;
      previewCellSize = 32;
    }

    // 横屏模式优化
    if (isLandscape && height < 600) {
      cellSize = Math.min(cellSize, 20);
      previewCellSize = Math.min(previewCellSize, 20);
    }

    // 计算游戏区域可用空间
    // 考虑边距、侧边栏等因素
    const marginX = width < 768 ? 24 : 48;
    const marginY = width < 768 ? 100 : 150;
    const sidePanelWidth = width >= 1024 ? 320 : 0;
    
    const maxBoardWidth = width - marginX - sidePanelWidth;
    const maxBoardHeight = height - marginY;

    // 计算游戏面板实际尺寸
    const boardWidth = GAME_CONFIG.COLS * cellSize;
    const boardHeight = GAME_CONFIG.ROWS * cellSize;

    // 如果超出可用空间，调整单元格大小
    if (boardWidth > maxBoardWidth && maxBoardWidth > 0) {
      cellSize = Math.floor(maxBoardWidth / GAME_CONFIG.COLS);
    }
    if (boardHeight > maxBoardHeight && maxBoardHeight > 0) {
      cellSize = Math.min(cellSize, Math.floor(maxBoardHeight / GAME_CONFIG.ROWS));
    }

    // 确保单元格大小不低于最小值
    const minCellSize = width < 400 ? 12 : width < 600 ? 14 : 16;
    cellSize = Math.max(cellSize, minCellSize);

    // 预览区域单元格与主区域保持比例
    previewCellSize = Math.max(Math.floor(cellSize * 0.9), minCellSize);

    return {
      cellSize,
      previewCellSize,
      deviceType,
      isDesktop: width >= 1024,
      isTablet: width >= 768 && width < 1024,
      isMobile: width < 768,
      isSmall: width < 600,
      isExtraSmall: width < 400,
      windowWidth: width,
      windowHeight: height,
      isLandscape,
    };
  }, []);

  const [config, setConfig] = useState<ResponsiveConfig>(calculateSizes);

  useEffect(() => {
    /**
     * 处理窗口大小变化
     * 使用 requestAnimationFrame 优化性能
     */
    let rafId: number | null = null;
    
    const handleResize = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        setConfig(calculateSizes());
      });
    };

    // 初始计算
    setConfig(calculateSizes());

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    // 监听方向变化（移动端）
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [calculateSizes]);

  return config;
}

export default useResponsive;
