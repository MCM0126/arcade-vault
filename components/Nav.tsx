'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface User {
  name: string
}

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('av_user')
      setUser(stored ? JSON.parse(stored) : null)
    } catch {
      setUser(null)
    }
  }, [pathname])

  const handleSignOut = () => {
    localStorage.removeItem('av_user')
    setUser(null)
    router.push('/')
  }

  const isActive = (section: string) => {
    if (section === 'biblioteca') return pathname === '/' || pathname.startsWith('/games')
    if (section === 'salon') return pathname === '/hall-of-fame'
    return false
  }

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <nav className="av-nav">
        <div className="logo" onClick={() => go('/')}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </div>

        <div className="links">
          <Link href="/" className={isActive('biblioteca') ? 'active' : ''}>
            Biblioteca
          </Link>
          <Link href="/hall-of-fame" className={isActive('salon') ? 'active' : ''}>
            Salón de la Fama
          </Link>
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        {user ? (
          <button className="btn ghost auth-btn" onClick={handleSignOut}>
            {user.name} ▾
          </button>
        ) : (
          <button className="btn auth-btn" onClick={() => go('/auth')}>
            Iniciar Sesión
          </button>
        )}

        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={'av-mobile-backdrop' + (open ? ' open' : '')}
        onClick={() => setOpen(false)}
      />
      <aside className={'av-mobile-panel' + (open ? ' open' : '')}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <a
          className={isActive('biblioteca') ? 'active' : ''}
          style={{ cursor: 'pointer' }}
          onClick={() => go('/')}
        >
          Biblioteca
        </a>
        <a
          className={isActive('salon') ? 'active' : ''}
          style={{ cursor: 'pointer' }}
          onClick={() => go('/hall-of-fame')}
        >
          Salón de la Fama
        </a>
        <a style={{ cursor: 'pointer' }} onClick={() => go('/auth')}>
          {user ? 'Cuenta' : 'Iniciar Sesión'}
        </a>
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.16em' }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  )
}
