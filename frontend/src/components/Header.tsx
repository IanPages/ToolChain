import { Sparkles, Menu, ChevronLeft } from 'lucide-react'

interface HeaderProps {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

function Header({ sidebarOpen, toggleSidebar }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <Sparkles className="logo-icon" />
          <h1>ToolChain AI</h1>
        </div>
        <div className="header-actions">
          <button 
            className="mobile-menu-button"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
