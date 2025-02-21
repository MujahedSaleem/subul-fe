import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@material-tailwind/react";
import React from "react";
import IconButton from "./IconButton";
import { faArrowAltCircleRight, faCheck } from "@fortawesome/free-solid-svg-icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void; // Add onConfirm prop
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} handler={onClose}>
      <DialogHeader>{title}</DialogHeader>
      <DialogBody className="overflow-y-auto !px-5 max-h-[80vh]">
        {children}
      </DialogBody>
      <DialogFooter>
      <IconButton icon={faArrowAltCircleRight} variant="danger" onClick={onClose}>
        </IconButton>
        <IconButton icon={faCheck} variant="success" onClick={onConfirm}>
        </IconButton>
      </DialogFooter>
    </Dialog>
  );
};

export default Modal;