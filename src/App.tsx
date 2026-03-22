import { useTetris, useKeyboard, useResponsive } from './hooks';
import { GameCanvas, PreviewCanvas, GameOverlay, KeyboardHints } from './components';
import { GAME_CONFIG } from './types';
import './App.css';

/**
 * 主应用组件
 * 整合游戏逻辑、响应式布局和用户界面
 */
function App() {
  // 获取响应式配置
  const { cellSize, previewCellSize, isMobile, isSmall } = useResponsive();

  // 获取游戏状态和操作
  const {
    gameState,
    board,
    currentPiece,
    nextPiece,
    stats,
    clearingRows,
    isPaused,
    startGame,
    togglePause,
    restartGame,
    movePiece,
    rotatePiece,
    hardDrop,
    ghostPosition,
  } = useTetris();

  // 设置键盘控制
  useKeyboard({
    gameState,
    isPaused,
    onMoveLeft: () => movePiece(-1, 0),
    onMoveRight: () => movePiece(1, 0),
    onMoveDown: () => movePiece(0, 1),
    onRotate: rotatePiece,
    onHardDrop: hardDrop,
    onPause: togglePause,
  });

  // 计算游戏画布尺寸
  const canvasWidth = GAME_CONFIG.COLS * cellSize;
  const canvasHeight = GAME_CONFIG.ROWS * cellSize;

  return (
    <div className="game-wrapper">
      <div className={`game-container ${isMobile ? 'mobile' : ''} ${isSmall ? 'small' : ''}`}>
        {/* 主游戏区域 */}
        <div className="main-area">
          <h1 className="game-title">TETRIS</h1>
          <p className="game-subtitle">俄罗斯方块</p>

          <div className="game-board-wrapper" style={{
            width: canvasWidth + 8,
            height: canvasHeight + 8,
          }}>
            <GameCanvas
              board={board}
              currentPiece={currentPiece}
              ghostPosition={ghostPosition}
              clearingRows={clearingRows}
              cellSize={cellSize}
            />
            <GameOverlay
              gameState={gameState}
              stats={stats}
              onStart={startGame}
              onRestart={restartGame}
              onResume={togglePause}
            />
          </div>
        </div>

        {/* 侧边面板 */}
        <div className="side-panel">
          {/* 分数面板 */}
          <div className="panel score-panel">
            <div className="panel-title">分数</div>
            <div className="score-display">{stats.score.toLocaleString()}</div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">等级</div>
                <div className="stat-value">{stats.level}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">消除</div>
                <div className="stat-value">{stats.lines}</div>
              </div>
            </div>
          </div>

          {/* 下一个方块预览 */}
          <div className="panel preview-panel">
            <div className="panel-title">下一个</div>
            <div className="preview-area" style={{
              width: GAME_CONFIG.PREVIEW_COLS * previewCellSize,
              height: GAME_CONFIG.PREVIEW_ROWS * previewCellSize,
            }}>
              <PreviewCanvas
                piece={nextPiece}
                cellSize={previewCellSize}
              />
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="panel controls-panel">
            <div className="panel-title">控制</div>
            <div className="controls-section">
              {gameState === 'ready' && (
                <button className="btn btn-primary" onClick={startGame}>
                  开始游戏
                </button>
              )}
              {gameState === 'playing' && (
                <button className="btn" onClick={togglePause}>
                  暂停
                </button>
              )}
              {gameState === 'paused' && (
                <button className="btn btn-primary" onClick={togglePause}>
                  继续
                </button>
              )}
              {(gameState === 'playing' || gameState === 'paused' || gameState === 'gameover') && (
                <button className="btn btn-danger" onClick={restartGame}>
                  重新开始
                </button>
              )}
            </div>
          </div>

          {/* 键盘提示 - 桌面端显示 */}
          {!isMobile && (
            <div className="panel hints-panel">
              <div className="panel-title">操作说明</div>
              <KeyboardHints />
            </div>
          )}

          {/* 移动端触摸控制 */}
          {isMobile && (
            <div className="panel touch-controls-panel">
              <div className="panel-title">触摸控制</div>
              <div className="touch-controls">
                <div className="touch-row">
                  <button
                    className="touch-btn"
                    onClick={() => rotatePiece()}
                    aria-label="旋转"
                  >
                    ↻
                  </button>
                </div>
                <div className="touch-row">
                  <button
                    className="touch-btn"
                    onClick={() => movePiece(-1, 0)}
                    aria-label="左移"
                  >
                    ←
                  </button>
                  <button
                    className="touch-btn touch-btn-primary"
                    onClick={() => hardDrop()}
                    aria-label="硬降"
                  >
                    ⬇
                  </button>
                  <button
                    className="touch-btn"
                    onClick={() => movePiece(1, 0)}
                    aria-label="右移"
                  >
                    →
                  </button>
                </div>
                <div className="touch-row">
                  <button
                    className="touch-btn touch-btn-soft"
                    onClick={() => movePiece(0, 1)}
                    aria-label="软降"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
