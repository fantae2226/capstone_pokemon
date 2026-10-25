import { createPortal } from "react-dom";
import { useEffect, type ReactNode } from "react";
import './Modal.css';

type ModalProps = {
    onClose: () => void;
    children: ReactNode
};

export default function Modal({ onClose, children }: ModalProps){
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if(e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    );
}