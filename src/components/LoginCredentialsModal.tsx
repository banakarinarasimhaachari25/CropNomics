import React from 'react';
import { LoginSignUpModal, LoginSignUpModalProps } from './LoginSignUpModal';
import { UserRole, LanguageCode } from '../types';

export interface LoginCredentialsModalProps {
  isOpen: boolean;
  targetRole: UserRole | null;
  language: LanguageCode;
  onClose: () => void;
  onLoginSuccess: (
    role: UserRole,
    credentials: { username: string; pinOrPassword: string; name?: string; phone?: string }
  ) => void;
}

export const LoginCredentialsModal: React.FC<LoginCredentialsModalProps> = ({
  isOpen,
  targetRole,
  language,
  onClose,
  onLoginSuccess,
}) => {
  return (
    <LoginSignUpModal
      isOpen={isOpen}
      targetRole={targetRole}
      language={language}
      initialMode="login"
      onClose={onClose}
      onSuccess={(role, userDetails) => {
        onLoginSuccess(role, {
          username: userDetails.username || userDetails.phone,
          pinOrPassword: '••••••••',
          name: userDetails.name,
          phone: userDetails.phone,
        });
      }}
    />
  );
};

