/* @module: Navbar.types — Navbar component prop types */
export interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenNotifications?: () => void;
  activeSectionTitle?: string;
  onNavigate?: (path: string) => void;
  currentPath?: string;
}
