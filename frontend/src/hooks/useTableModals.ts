import { useState, useRef } from 'react';

/**
 * Custom hook to manage the state of various modals used in the table.
 */
export const useTableModals = () => {
    const [showSavePresetModal, setShowSavePresetModal] = useState(false);
    const [showDeletePresetModal, setShowDeletePresetModal] = useState(false);
    const [showImportChoiceModal, setShowImportChoiceModal] = useState(false);
    const [showDeleteRowsModal, setShowDeleteRowsModal] = useState(false);

    const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    
    const savePresetModalRef = useRef<HTMLDivElement>(null);
    const deletePresetModalRef = useRef<HTMLDivElement>(null);
    const importChoiceModalRef = useRef<HTMLDivElement>(null);
    const deleteRowsModalRef = useRef<HTMLDivElement>(null);

    const openDeletePresetModal = (name: string) => {
        setPresetToDelete(name);
        setShowDeletePresetModal(true);
    };

    const closeDeletePresetModal = () => {
        setShowDeletePresetModal(false);
        setPresetToDelete(null);
    };
    
    const openImportChoiceModal = (file: File) => {
        setFileToImport(file);
        setShowImportChoiceModal(true);
    };

    const closeImportChoiceModal = () => {
        setShowImportChoiceModal(false);
        setFileToImport(null);
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
            importChoice: {
                isOpen: showImportChoiceModal,
                open: openImportChoiceModal,
                close: closeImportChoiceModal,
                ref: importChoiceModalRef,
                data: fileToImport,
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
