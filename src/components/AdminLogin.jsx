import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

function AdminLogin({ onClose }) {
  const { loginAdmin, adminPassword } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(!adminPassword);

  // adminPassword 변경 시 isFirstTime 업데이트
  useEffect(() => {
    setIsFirstTime(!adminPassword);
  }, [adminPassword]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isFirstTime) {
      // 최초 비밀번호 설정
      if (!password || password.length < 4) {
        setError('비밀번호는 4자 이상이어야 합니다.');
        return;
      }
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
      if (loginAdmin(password)) {
        setPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setError('비밀번호 설정에 실패했습니다.');
      }
    } else {
      // 로그인
      if (loginAdmin(password)) {
        setPassword('');
        onClose();
      } else {
        setError('비밀번호가 올바르지 않습니다.');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isFirstTime ? '관리자 비밀번호 설정' : '관리자 로그인'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          {isFirstTime && (
            <div className="form-group">
              <label>비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                required
              />
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-primary">
            {isFirstTime ? '설정' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;

