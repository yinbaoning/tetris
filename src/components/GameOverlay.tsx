import type { GameState, GameStats } from '../types';

/**
 * 游戏遮罩层组件 Props 接口
 */
interface GameOverlayProps {
  /** 当前游戏状态 */
  gameState: GameState;
  /** 游戏统计信息 */
  stats: GameStats;
  /** 开始游戏回调 */
  onStart: () => void;
  /** 继续游戏回调 */
  onResume: () => void;
  /** 重新开始回调 */
  onRestart: () => void;
}

/**
 * 游戏遮罩层组件
 * 在游戏暂停或结束时显示半透明遮罩和操作按钮
 * 包含"继续"、"重新开始"等交互选项
 */
export function GameOverlay({
  gameState,
  stats,
  onStart,
  onResume,
  onRestart,
}: GameOverlayProps) {
  const isPaused = gameState === 'paused';
  const isGameOver = gameState === 'gameover';

  if (!isPaused && !isGameOver) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(10, 10, 15, 0.92)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        borderRadius: '8px',
        zIndex: 10,
        backdropFilter: 'blur(4px)',
      }}
    >


      {isPaused && (
        <h2
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '32px',
            fontWeight: 900,
            color: 'var(--accent-cyan, #00f5d4)',
            textShadow: '0 0 30px var(--accent-cyan, #00f5d4)',
            textTransform: 'uppercase',
            letterSpacing: '4px',
            margin: 0,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          已暂停
        </h2>
      )}

      {isGameOver && (
        <>
          <h2
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '32px',
              fontWeight: 900,
              color: 'var(--accent-pink, #f72585)',
              textShadow: '0 0 30px var(--accent-pink, #f72585)',
              textTransform: 'uppercase',
              letterSpacing: '4px',
              margin: 0,
            }}
          >
            游戏结束
          </h2>
          <div
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary, #8888aa)',
            }}
          >
            最终得分:{' '}
            <span
              style={{
                color: 'var(--accent-cyan, #00f5d4)',
                fontWeight: 700,
                fontSize: '24px',
                fontFamily: 'Orbitron, sans-serif',
              }}
            >
              {stats.score.toLocaleString()}
            </span>
          </div>
        </>
      )}

      <button
        onClick={isGameOver ? onRestart : isPaused ? onResume : onStart}
        style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '14px',
          fontWeight: 700,
          padding: '14px 32px',
          border: '2px solid var(--accent-cyan, #00f5d4)',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--accent-cyan, #00f5d4), var(--accent-purple, #7209b7))',
          color: '#0a0a0f',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 20px rgba(0, 245, 212, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(0, 245, 212, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 245, 212, 0.3)';
        }}
      >
        {isGameOver ? '再来一局' : isPaused ? '继续游戏' : '开始游戏'}
      </button>
    </div>
  );
}
