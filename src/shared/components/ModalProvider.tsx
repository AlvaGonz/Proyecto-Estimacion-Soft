
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PremiumModal, ModalType } from './PremiumModal';

interface ModalContextProps {
  showModal: (config: ModalConfig) => void;
  hideModal: () => void;
  confirm: (title: string, message: string | ReactNode, options?: { type?: ModalType, confirmText?: string, cancelText?: string }) => Promise<boolean>;
}

interface ModalConfig {
  title: string;
  message: string | ReactNode;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  isLoading?: boolean;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<(ModalConfig & { isOpen: boolean, onCancel?: () => void }) | null>(null);

  const showModal = useCallback((config: ModalConfig & { onCancel?: () => void }) => {
    setModal({ ...config, isOpen: true });
  }, []);

  const hideModal = useCallback(() => {
    if (modal?.onCancel) modal.onCancel();
    setModal(prev => prev ? { ...prev, isOpen: false } : null);
  }, [modal]);

  const confirm = useCallback((title: string, message: string | ReactNode, options?: { type?: ModalType, confirmText?: string, cancelText?: string }) => {
    return new Promise<boolean>((resolve) => {
      showModal({
        title,
        message,
        type: options?.type || 'confirm',
        confirmText: options?.confirmText || 'Confirmar',
        cancelText: options?.cancelText || 'Cancelar',
        onConfirm: () => {
          setModal(null);
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        }
      });
    });
  }, [showModal]);

  return (
    <ModalContext.Provider value={{ showModal, hideModal, confirm }}>
      {children}
      {modal && (
        <PremiumModal
          isOpen={modal.isOpen}
          onClose={hideModal}
          onConfirm={modal.onConfirm}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          isLoading={modal.isLoading}
        />
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};
