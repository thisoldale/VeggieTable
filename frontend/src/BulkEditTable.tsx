import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  flexRender,
  Row,
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
  ColumnSizingState,
} from '@tanstack/react-table';
import Papa from 'papaparse';
import { useNavigate, useOutletContext } from 'react-router-dom';

import { Plant, AppContextType, GardenPlan } from './types';
import { useGetPlantsQuery, useUpdatePlantMutation, useAddPlantMutation, useDeletePlantMutation, useImportPlantsMutation, useGetMostRecentGardenPlanQuery, useImportMappedPlantsMutation } from './store/plantApi';
import { useColumnPresets } from './hooks/useColumnPresets';
import { useTableModals } from './hooks/useTableModals';

import SavePresetModal from './components/SavePresetModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import YieldGraphModal from './components/YieldGraphModal';
import AddToPlanModal from './components/AddToPlanModal';
import CsvImportModal from './components/CsvImportModal';
import { getColumns } from './components/columns';

console.log('Imported plantApiHooks:', plantApiHooks);

const BulkEditTable: React.FC = () => {
  const { data: serverData, error, isLoading } = useGetPlantsQuery();
  const [updatePlant, { isLoading: isUpdatingPlant }] = useUpdatePlantMutation();
  const [addPlant, { isLoading: isAddingPlant }] = useAddPlantMutation();
  const [deletePlant, { isLoading: isDeletingPlant }] = useDeletePlantMutation();
  const { data: recentPlan } = useGetMostRecentGardenPlanQuery();


  const [data, setData] = useState<Plant[]>([]);
  const [originalData, setOriginalData] = useState<Plant[]>([]);

  useEffect(() => {
    if (serverData) {
      setData(serverData);
      setOriginalData(serverData);
    }
  }, [serverData]);

  const { setIsPageDirty } = useOutletContext<AppContextType>();
  const navigate = useNavigate();

  // --- Modal State ---
  const [isYieldModalOpen, setIsYieldModalOpen] = useState(false);
  const [isAddToPlanModalOpen, setIsAddToPlanModalOpen] = useState(false);
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [currentPlant, setCurrentPlant] = useState<Plant | null>(null);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // --- Table State ---
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [editedRows, setEditedRows] = useState<Record<string, Plant>>({});
  
  // --- UI State ---
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showCsvDropdown, setShowCsvDropdown] = useState(false);
  const [showRowDropdown, setShowRowDropdown] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newRowCounter = useRef(0);
  const lastClickedRowId = useRef<string | null>(null);
  const longPressTimeout = useRef<number | undefined>();
  const longPressTriggered = useRef(false);
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  const csvDropdownRef = useRef<HTMLDivElement>(null);
  const rowDropdownRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // This is a placeholder for the actual import logic
      // In a real implementation, you would parse the CSV and update the table data
      console.log('Selected file:', file.name);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // --- Unsaved Changes Warning ---
  const hasUnsavedChanges = Object.keys(editedRows).length > 0;
  useEffect(() => {
    setIsPageDirty(hasUnsavedChanges);
  }, [hasUnsavedChanges, setIsPageDirty]);

  // --- Cell Editing ---
  const handleEditChange = useCallback((id: number, field: keyof Plant, value: any) => {
    setData(prevData => {
      const newData = prevData.map(plant => {
        if (plant.id === id) {
          const updatedRow = { ...plant, [field]: value };
          setEditedRows(prevEdited => ({ ...prevEdited, [id]: updatedRow }));
          return updatedRow;
        }
        return plant;
      });
      return newData;
    });
  }, []);

  // --- Modal Handlers ---
  const openYieldModal = (plantId: number) => {
    const plantToEdit = data.find(p => p.id === plantId);
    if (plantToEdit) {
      setCurrentPlant(plantToEdit);
      setIsYieldModalOpen(true);
    }
  };

  const handleSaveYield = (newYieldData: string) => {
    if (currentPlant) {
      handleEditChange(currentPlant.id, 'weekly_yield', newYieldData);
    }
    setIsYieldModalOpen(false);
    setCurrentPlant(null);
  };

  const handleOpenAddToPlan = () => {
    const selectedRowIds = Object.keys(rowSelection);
    if (selectedRowIds.length !== 1) {
        alert("Please select exactly one plant to add to a plan.");
        return;
    }
    const plantToAdd = data.find(p => p.id === parseInt(selectedRowIds[0], 10));
    if (plantToAdd) {
        setCurrentPlant(plantToAdd);
        setIsAddToPlanModalOpen(true);
    }
  };

  // --- Column Definitions ---
  const columns = useMemo(
    () => getColumns(isSelectionMode, navigate, handleEditChange, originalData, openYieldModal),
    [isSelectionMode, navigate, handleEditChange, originalData, openYieldModal]
  );

  // --- Table Instance ---
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id.toString(),
    state: { rowSelection, sorting, columnFilters, globalFilter, columnSizing },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  // --- Custom Hooks ---
  const { modals } = useTableModals();
  const { selectedPresetName, setSelectedPresetName, savedPresets, defaultPresets, saveCurrentPreset, deletePreset } = useColumnPresets(table);

  // --- Autofit Columns Logic ---
  const handleAutofitColumns = () => {
    const newColumnSizing: ColumnSizingState = {};
    const PADDING = 25;
    const MIN_WIDTH = 75;
    const MAX_WIDTH = 400;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context || !tableRef.current) {
        return;
    }

    const tableFont = window.getComputedStyle(tableRef.current).font;
    context.font = tableFont;

    table.getAllLeafColumns().forEach(column => {
        if (column.id === 'mobile-select' || !column.getIsVisible()) {
            return;
        }

        const headerText = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
        const headerWidth = context.measureText(headerText).width;

        const cellWidths = table.getRowModel().rows.map(row => {
            const cellValue = row.getValue(column.id);
            return context.measureText(String(cellValue ?? '')).width;
        });

        const maxWidthInCells = Math.max(0, ...cellWidths);
        const finalWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.ceil(Math.max(headerWidth, maxWidthInCells) + PADDING)));
        
        newColumnSizing[column.id] = finalWidth;
    });

    setColumnSizing(newColumnSizing);
    setShowRowDropdown(false);
  };

  // --- Row Actions ---
  const handleAddRow = () => {
    newRowCounter.current -= 1;
    const newPlant: Plant = {
        id: newRowCounter.current, plant_name: '', variety_name: '', scientific_name: '', plant_family: '', plant_type: '',
        growth_habit: '', origin_heirloom_status: '', organic: false, seed_company_source: '', year_acquired: new Date().getFullYear(),
        seed_size: '', seed_longevity_storage_life: '', germination_temperature_min: null, germination_temperature_max: null,
        germination_temperature_ideal: null, germination_time_days: '', light_requirement_for_germination: '',
        stratification_required: false, scarification_required: false, sowing_depth: '', spacing_in_row: '', spacing_low: null,
        spacing_high: null, direct_seedable: false, transplantable: false, days_to_transplant_low: null,
        days_to_transplant_high: null, time_to_maturity: '', mature_plant_height: '', mature_plant_spread_width: '',
        sunlight_requirement: '', water_needs: '', fertilizer_needs: '', pest_resistance: '', disease_resistance: '',
        cold_hardiness_frost_tolerance: '', heat_tolerance: '', drought_tolerance: '', bolting_tendency: '',
        support_required: '', pruning_required: '', harvest_window_low: null, harvest_window_high: null,
        typical_yield: '', yield_units: '', storage_life_post_harvest: '', requires_pollinator: false,
        notes_observations: '', url: '', weekly_yield: '',
    };
    setData([newPlant, ...data]);
    setEditedRows(prev => ({ ...prev, [newPlant.id]: newPlant }));
    setShowRowDropdown(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // You can now process the file, e.g., by passing it to your import handler
      // For now, let's just log it.
      console.log('Selected file:', file);
      // Example: Open the import modal with this file
      // onDrop([file]); // This assumes you have an onDrop function like in CsvImportModal
    }
  };

  const handleCopyRows = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    const newRows: Plant[] = [];
    const newEditedRows: Record<string, Plant> = {};
    selectedRows.forEach(row => {
      newRowCounter.current -= 1;
      const newPlant = { ...row.original, id: newRowCounter.current };
      newRows.push(newPlant);
      newEditedRows[newPlant.id] = newPlant;
    });
    setData([...newRows, ...data]);
    setEditedRows(prev => ({ ...prev, ...newEditedRows }));
    setRowSelection({});
    setShowRowDropdown(false);
  };

  const handleDeleteSelectedClick = () => {
    if (Object.keys(rowSelection).length > 0) {
      modals.deleteRows.open();
    } else {
      alert("Please select at least one row to delete.");
    }
    setShowRowDropdown(false);
  };

  const handleConfirmDeleteRows = async () => {
    const selectedIds = Object.keys(rowSelection).map(id => parseInt(id, 10)).filter(id => id > 0);
    const promise = Promise.all(selectedIds.map(id => deletePlant(id).unwrap()));

    toast.promise(promise, {
        loading: 'Deleting rows...',
        success: () => {
            setRowSelection({});
            return 'Selected rows deleted successfully!';
        },
        error: 'Failed to delete some rows.',
    });

    modals.deleteRows.close();
  };

  const handleRowClick = useCallback((row: Row<Plant>, event: React.MouseEvent) => {
    if (isSelectionMode) {
      row.toggleSelected();
      return;
    }
    const isInputClick = (event.target as HTMLElement).tagName === 'INPUT';
    if (isInputClick && !event.ctrlKey && !event.metaKey && !event.shiftKey) return;
    const clickedRowId = row.id;
    setRowSelection(prev => {
      if (event.shiftKey && lastClickedRowId.current) {
        const visibleRows = table.getRowModel().rows;
        const lastIdx = visibleRows.findIndex(r => r.id === lastClickedRowId.current);
        if (lastIdx === -1) return { [clickedRowId]: true };
        const [start, end] = [Math.min(lastIdx, row.index), Math.max(lastIdx, row.index)];
        const newSelection = event.ctrlKey || event.metaKey ? { ...prev } : {};
        for (let i = start; i <= end; i++) if(visibleRows[i]) newSelection[visibleRows[i].id] = true;
        return newSelection;
      }
      if (event.ctrlKey || event.metaKey) {
        const newSelection = { ...prev };
        if (newSelection[clickedRowId]) delete newSelection[clickedRowId];
        else newSelection[clickedRowId] = true;
        return newSelection;
      }
      return { [clickedRowId]: true };
    });
    if (!event.shiftKey) lastClickedRowId.current = clickedRowId;
  }, [table, isSelectionMode]);

  // --- Import/Export ---
  const handleExportCsv = useCallback(() => {
    setShowCsvDropdown(false);
    const visibleColumns = table.getAllLeafColumns().filter(c => c.getIsVisible() && c.id !== 'mobile-select');
    const exportData = table.getCoreRowModel().rows.map(row => {
      const rowData: Record<string, any> = {};
      visibleColumns.forEach(col => {
        rowData[col.columnDef.header as string] = row.original[col.id as keyof Plant];
      });
      return rowData;
    });
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plants_export.csv');
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        if (document.body.contains(link)) {
            document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
    }, 100);
  }, [table]);

  const handleImportClick = () => {
      setShowCsvDropdown(false);
      setIsCsvImportModalOpen(true);
  }

  const [importMappedPlants, { isLoading: isImportingMapped }] = useImportMappedPlantsMutation();

  const handleImport = async (data: any[], mapping: Record<string, string>) => {
    const promise = importMappedPlants({ data, mapping }).unwrap();
    toast.promise(promise, {
        loading: 'Importing data...',
        success: 'Data imported successfully!',
        error: (err) => err.data?.detail || 'Failed to import data.',
    });
    setIsCsvImportModalOpen(false);
  };
  
  const handleSaveChanges = async () => {
    const editedPlants = Object.values(editedRows);
    if (editedPlants.length === 0) {
        toast.error('No changes to save.');
        return;
    }

    const createPromises = editedPlants
        .filter(p => p.id <= 0)
        .map(p => {
            const { id, ...plantData } = p;
            return addPlant(plantData as Omit<Plant, 'id'>).unwrap();
        });

    const updatePromises = editedPlants
        .filter(p => p.id > 0)
        .map(p => updatePlant(p).unwrap());

    const promise = Promise.all([...createPromises, ...updatePromises]);

    toast.promise(promise, {
        loading: 'Saving changes...',
        success: () => {
            setEditedRows({});
            return 'All changes saved successfully!';
        },
        error: 'Failed to save some changes.',
    });
  }

  // --- Effect for closing dropdowns on outside click ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) setShowColumnSelector(false);
      if (csvDropdownRef.current && !csvDropdownRef.current.contains(event.target as Node)) setShowCsvDropdown(false);
      if (rowDropdownRef.current && !rowDropdownRef.current.contains(event.target as Node)) setShowRowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  if (isLoading) return <div className="text-center py-8">Loading plants...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {'message' in error ? error.message : 'An error occurred'}</div>;

  const numSelectedRows = Object.keys(rowSelection).length;
  const isSaving = isAddingPlant || isUpdatingPlant;

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen font-sans text-sm">
        <h1 className="text-3xl font-bold mb-4 text-center text-primary">Bulk Edit Plants</h1>

        <div className="max-w-screen-xl mx-auto bg-component-background p-4 rounded-lg shadow-md">
            {/* Toolbar */}
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
                                <button onClick={handleAddRow} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary">Add Row</button>
                                <button onClick={handleCopyRows} disabled={numSelectedRows === 0} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary disabled:opacity-50">Copy Selected ({numSelectedRows})</button>
                                <button onClick={handleDeleteSelectedClick} disabled={numSelectedRows === 0 || isDeletingPlant} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50">
                                    {isDeletingPlant ? 'Deleting...' : `Delete Selected (${numSelectedRows})`}
                                </button>
                                <div className="border-t my-1 border-border"></div>
                                <button onClick={handleAutofitColumns} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary">Autofit Columns</button>
                                <div className="border-t my-1 border-border"></div>
                                <button onClick={() => setIsSelectionMode(true)} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary">Select Rows</button>
                            </div>
                        )}
                    </div>

                    {/* CSV Actions Dropdown */}
                    <div className="relative">
                        <button onClick={() => setShowCsvDropdown(v => !v)} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm">CSV</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" style={{ display: 'none' }} />
                        {showCsvDropdown && (
                            <div ref={csvDropdownRef} className="absolute z-20 bg-component-background shadow-lg rounded-md border py-1 mt-2 top-full left-0" style={{minWidth: '160px'}}>
                                <button onClick={handleImportClick} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary">Import from CSV</button>
                                <button onClick={handleExportCsv} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary">Export to CSV</button>
                            </div>
                        )}
                    </div>
                    {isSelectionMode && (
                        <button onClick={() => { setIsSelectionMode(false); setRowSelection({}); }} className="px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm fast-shake-infinite">Done Selecting</button>
                    )}
                </div>
                <input type="text" placeholder="Global Search..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="w-full md:w-auto px-2 py-1.5 border border-border rounded-md text-sm bg-component-background text-foreground" />
            </div>

            {/* Status Message */}
            {statusMessage && <p className={`text-sm my-2 ${statusMessage.type === 'error' ? 'text-destructive' : 'text-primary'}`}>{statusMessage.message}</p>}

            {/* View Controls */}
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 my-4 p-2 bg-secondary rounded-md">
                <div className="flex items-center space-x-2">
                    <label htmlFor="view-select" className="text-sm font-medium text-foreground">View:</label>
                    <select id="view-select" value={selectedPresetName} onChange={(e) => setSelectedPresetName(e.target.value)} className="px-2 py-1 border border-border rounded-md bg-component-background text-sm text-foreground">
                        {defaultPresets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        {savedPresets.map(p => <option key={p.name} value={p.name}>{p.name} (Custom)</option>)}
                    </select>
                </div>
                <button onClick={() => modals.savePreset.open()} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm">Save View</button>
                {savedPresets.length > 0 && (
                    <button onClick={() => modals.deletePreset.open(selectedPresetName)} disabled={defaultPresets.some(p => p.name === selectedPresetName)} className="px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm disabled:opacity-50">Delete View</button>
                )}
                <div className="relative">
                    <button onClick={() => setShowColumnSelector(v => !v)} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm">Select Columns</button>
                    {showColumnSelector && (
                        <div ref={columnSelectorRef} className="absolute z-20 bg-component-background shadow-lg rounded-md border py-2 mt-2 top-full right-0 md:left-0 max-h-80 overflow-y-auto" style={{minWidth: '200px'}}>
                            {table.getAllColumns().filter(c => c.getCanHide()).map(column => (
                                <div key={column.id} className="px-4 py-1 flex items-center hover:bg-secondary">
                                    <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} className="form-checkbox h-3 w-3 text-primary rounded mr-2" id={`toggle-${column.id}`} />
                                    <label htmlFor={`toggle-${column.id}`} className="text-foreground text-sm cursor-pointer select-none">{typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}</label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={() => setShowColumnFilters(v => !v)} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm">
                    {showColumnFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
            </div>


            {/* Table */}
            <div className="overflow-x-auto">
                <table ref={tableRef} className="w-full text-xs text-left text-muted-foreground table-fixed">
                    <thead className="text-xs text-foreground uppercase bg-secondary sticky top-0 z-10">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} scope="col" className="font-medium select-none relative px-2 py-1.5 border-b border-border bg-secondary" style={{ width: header.getSize() }}>
                                        <div onClick={header.column.getToggleSortingHandler()} className={header.column.getCanSort() ? 'cursor-pointer' : ''}>
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                                        </div>
                                        {showColumnFilters && header.column.getCanFilter() && (
                                            <input type="text" value={(header.column.getFilterValue() ?? '') as string} onChange={e => header.column.setFilterValue(e.target.value)} onClick={e => e.stopPropagation()} placeholder="Filter..." className="w-full mt-1 p-0.5 text-xs border border-border rounded-sm bg-component-background text-foreground" />
                                        )}
                                        {header.column.getCanResize() && (
                                            <div 
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                                className={`resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`} 
                                            />
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className={`border-b border-border select-none ${row.getIsSelected() ? 'bg-primary/20' : (row.original.id <= 0 ? 'bg-secondary' : 'bg-component-background')} hover:bg-secondary`}
                                onClick={(e) => handleRowClick(row, e)} onContextMenu={e => e.preventDefault()}>
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="whitespace-nowrap px-2 py-1 text-foreground border-b border-border">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Modals */}
        <SavePresetModal isOpen={modals.savePreset.isOpen} onClose={modals.savePreset.close} onSave={saveCurrentPreset} modalRef={modals.savePreset.ref} />
        <DeleteConfirmModal isOpen={modals.deletePreset.isOpen} onClose={modals.deletePreset.close} onConfirm={() => { if (modals.deletePreset.data) deletePreset(modals.deletePreset.data); modals.deletePreset.close(); }} modalRef={modals.deletePreset.ref} title="Confirm Deletion" message={<p>Are you sure you want to delete the view "<strong>{modals.deletePreset.data}</strong>"?</p>} />
        <CsvImportModal isOpen={isCsvImportModalOpen} onClose={() => setIsCsvImportModalOpen(false)} onImport={handleImport} />
        <DeleteConfirmModal isOpen={modals.deleteRows.isOpen} onClose={modals.deleteRows.close} onConfirm={handleConfirmDeleteRows} modalRef={modals.deleteRows.ref} title="Confirm Deletion" message={<p>Are you sure you want to delete the <strong>{numSelectedRows}</strong> selected plant(s)? This action cannot be undone.</p>} />
        {isYieldModalOpen && currentPlant && (
            <YieldGraphModal
                isOpen={isYieldModalOpen}
                onClose={() => setIsYieldModalOpen(false)}
                plant={currentPlant}
                onSave={handleSaveYield}
            />
        )}
        {isAddToPlanModalOpen && currentPlant && recentPlan && (
            <AddToPlanModal
                isOpen={isAddToPlanModalOpen}
                onClose={() => setIsAddToPlanModalOpen(false)}
                plant={currentPlant}
                gardenPlan={recentPlan}
                onPlantingsAdd={() => {
                    setIsAddToPlanModalOpen(false);
                }}
            />
        )}
    </div>
  );
};

export default BulkEditTable