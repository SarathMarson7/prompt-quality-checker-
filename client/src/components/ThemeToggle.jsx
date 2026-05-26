export default function ThemeToggle({ theme, setTheme }) {
  const themes = [
    { key: 'light', icon: '☀️', label: 'Light' },
    { key: 'grey',  icon: '🌥',  label: 'Grey'  },
    { key: 'dark',  icon: '🌙',  label: 'Dark'  },
  ]
  return (
    <div className="theme-toggle">
      {themes.map(({ key, icon, label }) => (
        <button
          key={key}
          className={`theme-btn${theme === key ? ' active' : ''}`}
          onClick={() => setTheme(key)}
          title={label}
          aria-label={`Switch to ${label} theme`}
          aria-pressed={theme === key}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
