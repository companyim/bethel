import React from 'react';
import { useApp } from '../context/AppContext';
import AdminLogin from './AdminLogin';

function Header() {
  const { isAdminMode, logoutAdmin } = useApp();
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  return (
    <header className="header">
      <div className="header-content">
        <h1>베텔 주일학교 출석부</h1>
        <div className="header-actions">
          {isAdminMode ? (
            <>
              <span className="admin-badge">관리자 모드</span>
              <button onClick={logoutAdmin} className="btn-logout">
                로그아웃
              </button>
            </>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="btn-login">
              관리자 로그인
            </button>
          )}
        </div>
      </div>
      {showLoginModal && (
        <AdminLogin onClose={() => setShowLoginModal(false)} />
      )}
    </header>
  );
}

export default Header;

