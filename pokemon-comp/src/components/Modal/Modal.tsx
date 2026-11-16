import { createPortal } from "react-dom";
import { useEffect, useRef ,type ReactNode } from "react";
import './Modal.css';

type ModalProps = {
    onClose: () => void;
    children: ReactNode
};

export default function Modal({ onClose, children }: ModalProps){
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            //only close top most modal
            const overlays = document.querySelectorAll('.modal-overlay');
            const isTopModal = overlays[overlays.length - 1] === overlayRef.current;
            if(e.key === "Escape" && isTopModal) onClose();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return createPortal(
        <div ref={overlayRef} className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    );
}