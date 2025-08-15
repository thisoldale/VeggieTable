import { useState, useRef } from 'react';

/**
 * Custom hook to manage the state of various modals used in the table.
 */
export const useTableModals = () => {
    const [showSavePresetModal, setShowSavePresetModal] = useState(false);
    const [showDeletePresetModal, setShowDeletePresetModal] = useState(false);
    const [showDeleteRowsModal, setShowDeleteRowsModal] = useState(false);

    const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
    
    const savePresetModalRef = useRef<HTMLDivElement>(null);
    const deletePresetModalRef = useRef<HTMLDivElement>(null);
    const deleteRowsModalRef = useRef<HTMLDivElement>(null);

    const openDeletePresetModal = (name: string) => {
        setPresetToDelete(name);
        setShowDeletePresetModal(true);
    };

    const closeDeletePresetModal = () => {
        setShowDeletePresetModal(false);
        setPresetToDelete(null);
    };

    return {
        modals: {
            savePreset: {
                isOpen: showSavePresetModal,
                open: () => setShowSavePresetModal(true),
                close: () => setShowSavePresetModal(false),
                ref: savePresetModalRef,
            },
            deletePreset: {
                isOpen: showDeletePresetModal,
                open: openDeletePresetModal,
                close: closeDeletePresetModal,
                ref: deletePresetModalRef,
                data: presetToDelete,
            },
            deleteRows: {
                isOpen: showDeleteRowsModal,
                open: () => setShowDeleteRowsModal(true),
                close: () => setShowDeleteRowsModal(false),
                ref: deleteRowsModalRef,
            },
        },
    };
};
