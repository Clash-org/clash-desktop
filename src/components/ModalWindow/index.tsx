import React, { useEffect } from 'react';
import styles from "./index.module.css"
import { X } from 'lucide-react';

type ModalWindowProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  hidden?: boolean;
};

const ModalWindow: React.FC<ModalWindowProps> = ({ isOpen, onClose, children, style, hidden }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (isOpen || hidden) ? (
    <>
      <div
        className={[styles.backdrop, isOpen ? "" : styles.hidden].join(" ")}
      />

      {/* Modal */}
      <div
        className={[styles.modalWrapper, isOpen ? "" : styles.hidden].join(" ")}
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className={styles.modal}
          style={style}
          onClick={(e)=>e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close modal"
          >
            <X size={28} color="var(--fg)" />
          </button>

          {/* Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{children}</div>
        </div>
      </div>
    </>
  ) : null;
};

export default ModalWindow;