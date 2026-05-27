'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Truck,
  FileText,
  PlusCircle,
  List,
  Diamond,
  ShoppingCart,
  Store,
  Package,
  Settings,
  Menu,
  X,
  Coins,
  History,
  LogOut
} from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'

const sellItems = [
  { name: 'Manage Parties', href: '/parties', icon: Users },
  { name: 'Manage Consignees', href: '/consignees', icon: Truck },
  { name: 'Declarations', href: '/declarations', icon: FileText },
  { name: 'Create Invoice', href: '/invoices/create', icon: PlusCircle },
  { name: 'Invoice List', href: '/invoices', icon: List },
]

const purchaseItems = [
  { name: 'Manage Suppliers', href: '/purchase-suppliers', icon: Store },
  { name: 'Create Purchase Invoice', href: '/purchase-invoices/create', icon: ShoppingCart },
  { name: 'Purchase Invoice List', href: '/purchase-invoices', icon: List },
]

interface SidebarProps {
  user?: {
    username: string;
    role: string;
  } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/invoices') {
      return pathname === '/invoices' || pathname.startsWith('/invoices/view') || pathname.startsWith('/invoices/edit')
    }
    if (href === '/purchase-invoices') {
      return pathname === '/purchase-invoices' || pathname.startsWith('/purchase-invoices/view') || pathname.startsWith('/purchase-invoices/edit')
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const showReconciliation = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT'
  const showAuditLogs = user?.role === 'ADMIN'

  return (
    <>
      <header className="mobile-header">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsOpen(true)}
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <Image 
            src="/logo-full.png" 
            alt="Shakti Exports" 
            width={150} 
            height={40}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      </header>

      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={clsx("sidebar", isOpen && "sidebar-open")}>
        <div className="sidebar-header">
          <div className="logo" style={{ padding: '0.5rem 0' }}>
            <Image 
              src="/logo-full.png" 
              alt="Shakti Exports" 
              width={200} 
              height={60}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setIsOpen(false)}
            aria-label="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link href="/" className={clsx('nav-link', pathname === '/' && 'active')}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/stock" className={clsx('nav-link', pathname.startsWith('/stock') && 'active')}>
            <Package size={20} />
            <span>Stock & Inventory</span>
          </Link>
          <Link href="/profile" className={clsx('nav-link', pathname.startsWith('/profile') && 'active')}>
            <Settings size={20} />
            <span>Company Profile</span>
          </Link>

          {showReconciliation && (
            <Link href="/reconciliation" className={clsx('nav-link', pathname.startsWith('/reconciliation') && 'active')}>
              <Coins size={20} />
              <span>Reconciliation</span>
            </Link>
          )}

          {showAuditLogs && (
            <Link href="/audit-logs" className={clsx('nav-link', pathname.startsWith('/audit-logs') && 'active')}>
              <History size={20} />
              <span>Audit Logs</span>
            </Link>
          )}

          <div className="nav-section-title">Sell Invoices</div>
          {sellItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={clsx('nav-link', isActive(item.href) && 'active')}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}

          <div className="nav-section-title">Purchase Invoices</div>
          {purchaseItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={clsx('nav-link', isActive(item.href) && 'active')}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-info">
              <div className="sidebar-user-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-details">
                <span className="sidebar-username">{user.username}</span>
                <span className="sidebar-role-badge">{user.role}</span>
              </div>
            </div>
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

