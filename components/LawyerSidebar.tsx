'use client';
import React from 'react';
import {
  Home,
  FileText,
  MessageSquare,
  Folder,
  CreditCard,
  User,
  Settings,
  CircleHelp,
  ShieldCheck,
} from 'lucide-react';
import { Brand } from './Landing';

export type LawyerNavOption =
  | 'inicio'
  | 'casos'
  | 'propuestas'
  | 'mis-casos'
  | 'pagos'
  | 'perfil'
  | 'configuracion'
  | 'admin'
  | 'help';

export interface LawyerSidebarProps {
  activeMenu: string;
  onNavigate: (route: LawyerNavOption) => void;
  isAdmin?: boolean;
  onHelp?: () => void;
}

export default function LawyerSidebar({
  activeMenu,
  onNavigate,
  isAdmin = false,
  onHelp,
}: LawyerSidebarProps) {
  return (
    <aside className="lawyer-dash-sidebar">
      <div className="lawyer-sidebar-top">
        <div className="lawyer-sidebar-logo">
          <a href="/" className="sidebar-brand" aria-label="Inicio" style={{ textDecoration: 'none' }}>
            <Brand />
          </a>
        </div>

        <nav className="lawyer-sidebar-nav" aria-label="Menú principal de abogado">
          <button
            type="button"
            className={`lawyer-nav-item ${activeMenu === 'inicio' ? 'active' : ''}`}
            onClick={() => onNavigate('inicio')}
          >
            <Home size={19} strokeWidth={activeMenu === 'inicio' ? 2 : 1.8} />
            <span>Inicio</span>
          </button>

          <button
            type="button"
            className={`lawyer-nav-item ${activeMenu === 'casos' ? 'active' : ''}`}
            onClick={() => onNavigate('casos')}
          >
            <FileText size={19} strokeWidth={1.8} />
            <span>Casos disponibles</span>
          </button>

          <button
            type="button"
            className={`lawyer-nav-item ${activeMenu === 'propuestas' ? 'active' : ''}`}
            onClick={() => onNavigate('propuestas')}
          >
            <MessageSquare size={19} strokeWidth={1.8} />
            <span>Mis propuestas</span>
          </button>

          <button
            type="button"
            className={`lawyer-nav-item ${activeMenu === 'mis-casos' ? 'active' : ''}`}
            onClick={() => onNavigate('mis-casos')}
          >
            <Folder size={19} strokeWidth={1.8} />
            <span>Mis casos</span>
          </button>

          <button
            type="button"
            className={`lawyer-nav-item ${activeMenu === 'pagos' ? 'active' : ''}`}
            onClick={() => onNavigate('pagos')}
          >
            <CreditCard size={19} strokeWidth={1.8} />
            <span>Pagos</span>
          </button>

          <button
            type="button"
            className={`lawyer-nav-item ${activeMenu === 'perfil' ? 'active' : ''}`}
            onClick={() => onNavigate('perfil')}
          >
            <User size={19} strokeWidth={1.8} />
            <span>Perfil profesional</span>
          </button>

          <button
            type="button"
            className={`lawyer-nav-item ${activeMenu === 'configuracion' ? 'active' : ''}`}
            onClick={() => onNavigate('configuracion')}
          >
            <Settings size={19} strokeWidth={1.8} />
            <span>Configuración</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`lawyer-nav-item ${activeMenu === 'admin' ? 'active' : ''}`}
              onClick={() => onNavigate('admin')}
            >
              <ShieldCheck size={19} strokeWidth={1.8} />
              <span>Administración</span>
            </button>
          )}
        </nav>
      </div>

      <div className="lawyer-sidebar-bottom">
        <button
          type="button"
          className="lawyer-nav-item help-link"
          onClick={() => {
            if (onHelp) onHelp();
            else onNavigate('help');
          }}
        >
          <CircleHelp size={19} strokeWidth={1.8} />
          <span>Centro de ayuda</span>
        </button>
      </div>
    </aside>
  );
}
