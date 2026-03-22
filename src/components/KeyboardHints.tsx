/**
 * 键盘提示组件
 * 显示游戏可用的键盘操作说明
 * 帮助新玩家快速了解游戏控制方式
 */
export function KeyboardHints() {
  const hints = [
    { keys: ['←', '→'], action: '移动' },
    { keys: ['↑'], action: '旋转' },
    { keys: ['↓'], action: '软降' },
    { keys: ['空格'], action: '硬降', wide: true },
    { keys: ['P'], action: '暂停', wide: true },
  ];

  return (
    <div style={{ marginTop: '12px' }}>
      {hints.map((hint, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          {hint.keys.map((key, keyIndex) => (
            <span
              key={keyIndex}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: hint.wide ? '80px' : '36px',
                height: '32px',
                padding: '0 8px',
                background: 'var(--bg-secondary, #12121a)',
                border: '1px solid var(--border-color, #2a2a3a)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary, #8888aa)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {key}
            </span>
          ))}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '12px',
              color: 'var(--text-secondary, #8888aa)',
            }}
          >
            {hint.action}
          </span>
        </div>
      ))}
    </div>
  );
}
