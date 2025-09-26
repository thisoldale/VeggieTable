import React, { useState, useRef, useEffect } from 'react';
import { RowSelectionState } from '@tanstack/react-table';

interface ToolbarProps {
    handleSaveChanges: () => void;
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    handleOpenAddToPlan: () => void;
    numSelectedRows: number;
    recentPlan: any;
    handleAddRow: () => void;
    handleCopyRows: () => void;
    handleDeleteSelectedClick: () => void;
    isDeletingPlant: boolean;
    handleAutofitColumns: () => void;
    isSelectionMode: boolean;
    setIsSelectionMode: (isSelectionMode: boolean) => void;
    setRowSelection: (rowSelection: RowSelectionState) => void;
    handleImportClick: () => void;
    handleExportCsv: () => void;
    globalFilter: string;
    setGlobalFilter: (globalFilter: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    handleSaveChanges,
    hasUnsavedChanges,
    isSaving,
    handleOpenAddToPlan,
    numSelectedRows,
    recentPlan,
    handleAddRow,
    handleCopyRows,
    handleDeleteSelectedClick,
    isDeletingPlant,
    handleAutofitColumns,
    isSelectionMode,
    setIsSelectionMode,
    setRowSelection,
    handleImportClick,
    handleExportCsv,
    globalFilter,
    setGlobalFilter,
}) => {
    const [showRowDropdown, setShowRowDropdown] = useState(false);
    const [showCsvDropdown, setShowCsvDropdown] = useState(false);
    const rowDropdownRef = useRef<HTMLDivElement>(null);
    const csvDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (rowDropdownRef.current && !rowDropdownRef.current.contains(event.target as Node)) {
                setShowRowDropdown(false);
            }
            if (csvDropdownRef.current && !csvDropdownRef.current.contains(event.target as Node)) {
                setShowCsvDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddRowClick = () => {
        handleAddRow();
        setShowRowDropdown(false);
    }
    const handleCopyRowsClick = () => {
        handleCopyRows();
        setShowRowDropdown(false);
    }
    const handleDeleteSelectedClickWithClose = () => {
        handleDeleteSelectedClick();
        setShowRowDropdown(false);
    }
    const handleAutofitColumnsClick = () => {
        handleAutofitColumns();
        setShowRowDropdown(false);
    }
    const handleSelectRowsClick = () => {
        setIsSelectionMode(true);
        setShowRowDropdown(false);
    }

    const handleImportClickWithClose = () => {
        handleImportClick();
        setShowCsvDropdown(false);
    }
    const handleExportCsvClick = () => {
        handleExportCsv();
        setShowCsvDropdown(false);
    }

    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-3 md:space-y-0">
            <div className="flex items-center flex-wrap gap-2">
                <button onClick={handleSaveChanges} disabled={!hasUnsavedChanges || isSaving} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>

                <button onClick={handleOpenAddToPlan} disabled={numSelectedRows !== 1 || !recentPlan} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm disabled:opacity-50">
                    Add to Plan
                </button>

                {/* Row Actions Dropdown */}
                <div className="relative">
                    <button onClick={() => setShowRowDropdown(v => !v)} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm">More Actions</button>
                    {showRowDropdown && (
                        <div ref={rowDropdownRef} className="absolute z-20 bg-component-background shadow-lg rounded-md border py-1 mt-2 top-full left-0" style={{minWidth: '160px'}}>
                            <button onClick={handleAddRowClick} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary">Add Row</button>
                            <button onClick={handleCopyRowsClick} disabled={numSelectedRows === 0} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary disabled:opacity-50">Copy Selected ({numSelectedRows})</button>
                            <button onClick={handleDeleteSelectedClickWithClose} disabled={numSelectedRows === 0 || isDeletingPlant} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50">
                                {isDeletingPlant ? 'Deleting...' : `Delete Selected (${numSelectedRows})`}
                            </button>
                            <div className="border-t my-1 border-border"></div>
                            <button onClick={handleAutofitColumnsClick} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary">Autofit Columns</button>
                            <div className="border-t my-1 border-border"></div>
                            <button onClick={handleSelectRowsClick} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary">Select Rows</button>
                        </div>
                    )}
                </div>

                {/* CSV Actions Dropdown */}
                <div className="relative">
                    <button onClick={() => setShowCsvDropdown(v => !v)} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm">CSV</button>
                    {showCsvDropdown && (
                        <div ref={csvDropdownRef} className="absolute z-20 bg-component-background shadow-lg rounded-md border py-1 mt-2 top-full left-0" style={{minWidth: '160px'}}>
                            <button onClick={handleImportClickWithClose} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary">Import from CSV</button>
                            <button onClick={handleExportCsvClick} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary">Export to CSV</button>
                        </div>
                    )}
                </div>
                {isSelectionMode && (
                    <button onClick={() => { setIsSelectionMode(false); setRowSelection({}); }} className="px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm fast-shake-infinite">Done Selecting</button>
                )}
            </div>
            <input type="text" placeholder="Global Search..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="w-full md:w-auto px-2 py-1.5 border border-border rounded-md text-sm bg-component-background text-foreground" />
        </div>
    );
}

export default Toolbar;