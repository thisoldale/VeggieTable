import { ColumnDef, CellContext } from '@tanstack/react-table';
import { Plant } from '../types';
import { NavigateFunction } from 'react-router-dom';

// A helper function to create a more reusable editable cell for text/number inputs.
const EditableCell = ({
  getValue,
  row,
  column,
  handleEditChange,
  originalData,
}: CellContext<Plant, any> & {
  handleEditChange: (id: number, field: keyof Plant, value: any) => void;
  originalData: Plant[];
}) => {
  const originalRow = originalData.find(p => p.id === row.original.id);
  const isEdited = originalRow && originalRow[column.id as keyof Plant] !== getValue();
  const bgClass = isEdited ? 'bg-purple-100' : 'bg-transparent';
  return (
    <input
      value={getValue() ?? ''}
      onChange={e => handleEditChange(row.original.id, column.id as keyof Plant, e.target.value)}
      className={`w-full border border-transparent rounded-sm p-0.5 text-xs focus:outline-none focus:border-green-400 ${bgClass}`}
    />
  );
};

// A helper for boolean (checkbox) cells to keep the main definition clean.
const CheckboxCell = ({
    getValue,
    row,
    column,
    handleEditChange,
    originalData,
  }: CellContext<Plant, any> & {
    handleEditChange: (id: number, field: keyof Plant, value: any) => void;
    originalData: Plant[];
  }) => {
    const originalRow = originalData.find(p => p.id === row.original.id);
    const isEdited = originalRow && originalRow[column.id as keyof Plant] !== getValue();
    const bgClass = isEdited ? 'bg-purple-100' : 'bg-transparent';
    return (
        <div className={`flex justify-center items-center h-full ${bgClass}`}>
            <input
                type="checkbox"
                checked={!!getValue()}
                onChange={e => handleEditChange(row.original.id, column.id as keyof Plant, e.target.checked)}
                className="form-checkbox h-4 w-4 text-green-600 rounded"
            />
        </div>
    );
};

// New cell component for the Weekly Yield column
const YieldCell = ({
    row,
    getValue,
    openYieldModal,
}: CellContext<Plant, any> & {
    openYieldModal: (plantId: number, yieldData: string | null | undefined) => void;
}) => {
    const yieldData = getValue<string | null>();
    return (
        <button
            onClick={() => openYieldModal(row.original.id, yieldData)}
            className="w-full text-left text-blue-600 hover:underline truncate p-0.5"
            title={yieldData || "Click to edit yield"}
        >
            {yieldData || <span className="text-gray-400 italic">No yield data</span>}
        </button>
    );
};


/**
 * Generates the column definitions for the bulk edit table.
 */
export const getColumns = (
    isSelectionMode: boolean,
    navigate: NavigateFunction,
    handleEditChange: (id: number, field: keyof Plant, value: any) => void,
    originalData: Plant[],
    openYieldModal: (plantId: number, yieldData: string | null | undefined) => void
): ColumnDef<Plant>[] => {
    const editableCellProps = { handleEditChange, originalData };

    return [
      // --- Special Columns ---
      {
        id: 'mobile-select',
        header: ({ table }) => isSelectionMode ? (
          <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} className="form-checkbox h-4 w-4 text-green-600 rounded" />
        ) : null,
        cell: ({ row }) => isSelectionMode ? (
          <div className="fast-shake-infinite inline-block">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-green-600 rounded" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} onClick={(e) => e.stopPropagation()} />
          </div>
        ) : null,
        size: 40, minSize: 40, maxSize: 40, enableResizing: false, enableHiding: false,
      },
      {
        accessorKey: 'id', header: 'ID', size: 60, enableHiding: false,
        cell: ({ row, getValue }) => (
          <button onClick={(e) => { e.stopPropagation(); if (row.original.id > 0) navigate(`/plants/${row.original.id}`); }}
            className="text-blue-600 hover:underline text-xs bg-transparent border-none p-0 cursor-pointer disabled:text-gray-400 disabled:no-underline"
            title={`View details for ${row.original.plant_name}`} disabled={row.original.id <= 0}>
            {row.original.id > 0 ? getValue<number>() : 'NEW'}
          </button>
        ),
      },
      // --- Editable Data Columns ---
      { accessorKey: 'plant_name', header: 'Plant Name', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'variety_name', header: 'Variety Name', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'scientific_name', header: 'Scientific Name', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'plant_family', header: 'Plant Family', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'plant_type', header: 'Plant Type', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'growth_habit', header: 'Growth Habit', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'origin_heirloom_status', header: 'Origin/Heirloom Status', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'organic', header: 'Organic', cell: (props) => CheckboxCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'seed_company_source', header: 'Seed Company/Source', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'year_acquired', header: 'Year Acquired', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'seed_size', header: 'Seed Size', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'seed_longevity_storage_life', header: 'Seed Longevity', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'germination_temperature_min', header: 'Germ Temp (Min)', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'germination_temperature_max', header: 'Germ Temp (Max)', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'germination_temperature_ideal', header: 'Germ Temp (Ideal)', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'germination_time_days', header: 'Germ Time (Days)', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'light_requirement_for_germination', header: 'Light Req for Germ', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'stratification_required', header: 'Stratification Req', cell: (props) => CheckboxCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'scarification_required', header: 'Scarification Req', cell: (props) => CheckboxCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'sowing_depth', header: 'Sowing Depth', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'spacing_in_row', header: 'Spacing - In Row', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'spacing_low', header: 'Spacing (Low)', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'spacing_high', header: 'Spacing (High)', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'direct_seedable', header: 'Direct Seedable', cell: (props) => CheckboxCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'transplantable', header: 'Transplantable', cell: (props) => CheckboxCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'days_to_transplant_low', header: 'Days to Transplant (Low)', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'days_to_transplant_high', header: 'Days to Transplant (High)', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'time_to_maturity', header: 'Time to Maturity', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'mature_plant_height', header: 'Mature Plant Height', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'mature_plant_spread_width', header: 'Mature Plant Spread', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'sunlight_requirement', header: 'Sunlight Req', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'water_needs', header: 'Water Needs', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'fertilizer_needs', header: 'Fertilizer Needs', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'pest_resistance', header: 'Pest Resistance', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'disease_resistance', header: 'Disease Resistance', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'cold_hardiness_frost_tolerance', header: 'Cold Hardiness', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'heat_tolerance', header: 'Heat Tolerance', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'drought_tolerance', header: 'Drought Tolerance', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'bolting_tendency', header: 'Bolting Tendency', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'support_required', header: 'Support Required', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'pruning_required', header: 'Pruning Required', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'harvest_window_low', header: 'Harvest Window (Low)', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'harvest_window_high', header: 'Harvest Window (High)', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'typical_yield', header: 'Typical Yield', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'yield_units', header: 'Yield Units', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'storage_life_post_harvest', header: 'Storage Life', cell: (props) => EditableCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'requires_pollinator', header: 'Requires Pollinator', cell: (props) => CheckboxCell({ ...props, ...editableCellProps }) },
      { accessorKey: 'notes_observations', header: 'Notes/Observations', cell: (props) => EditableCell({ ...props, ...editableCellProps }), size: 250 },
      { accessorKey: 'url', header: 'URL', cell: (props) => EditableCell({ ...props, ...editableCellProps }), size: 200 },
      {
        accessorKey: 'weekly_yield',
        header: 'Weekly Yield',
        cell: (props) => YieldCell({ ...props, openYieldModal }),
        size: 200
      },
    ];
};
