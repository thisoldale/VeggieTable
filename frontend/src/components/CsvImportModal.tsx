import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

const plantFields: Record<string, string> = {
    plant_name: 'Plant Name',
    variety_name: 'Variety Name',
    scientific_name: 'Scientific Name',
    plant_family: 'Plant Family',
    plant_type: 'Plant Type',
    growth_habit: 'Growth Habit',
    origin_heirloom_status: 'Origin/Heirloom Status',
    organic: 'Organic',
    seed_company_source: 'Seed Company/Source',
    year_acquired: 'Year Acquired',
    seed_size: 'Seed Size',
    seed_longevity_storage_life: 'Seed Longevity',
    germination_temperature_min: 'Germ Temp (Min)',
    germination_temperature_max: 'Germ Temp (Max)',
    germination_temperature_ideal: 'Germ Temp (Ideal)',
    germination_time_days: 'Germ Time (Days)',
    light_requirement_for_germination: 'Light Req for Germ',
    stratification_required: 'Stratification Req',
    scarification_required: 'Scarification Req',
    sowing_depth: 'Sowing Depth',
    spacing_in_row: 'Spacing - In Row',
    spacing_low: 'Spacing (Low)',
    spacing_high: 'Spacing (High)',
    direct_seedable: 'Direct Seedable',
    transplantable: 'Transplantable',
    days_to_transplant_low: 'Days to Transplant (Low)',
    days_to_transplant_high: 'Days to Transplant (High)',
    time_to_maturity: 'Time to Maturity',
    mature_plant_height: 'Mature Plant Height',
    mature_plant_spread_width: 'Mature Plant Spread',
    sunlight_requirement: 'Sunlight Req',
    water_needs: 'Water Needs',
    fertilizer_needs: 'Fertilizer Needs',
    pest_resistance: 'Pest Resistance',
    disease_resistance: 'Disease Resistance',
    cold_hardiness_frost_tolerance: 'Cold Hardiness',
    heat_tolerance: 'Heat Tolerance',
    drought_tolerance: 'Drought Tolerance',
    bolting_tendency: 'Bolting Tendency',
    support_required: 'Support Required',
    pruning_required: 'Pruning Required',
    harvest_window_low: 'Harvest Window (Low)',
    harvest_window_high: 'Harvest Window (High)',
    typical_yield: 'Typical Yield',
    yield_units: 'Yield Units',
    storage_life_post_harvest: 'Storage Life',
    requires_pollinator: 'Requires Pollinator',
    notes_observations: 'Notes/Observations',
    url: 'URL',
    weekly_yield: 'Weekly Yield',
};

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[], mapping: Record<string, string>) => void;
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      setError(null);
      setMapping({});

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const csvHeaders = (results.meta.fields || []).filter(h => h !== 'ID');
          setHeaders(csvHeaders);
          setData(results.data);

          const expectedHeaderValues = Object.values(plantFields);
          const extraHeaders = csvHeaders.filter(h => !expectedHeaderValues.includes(h));

          if (extraHeaders.length > 0) {
            let errorMsg = `Unexpected columns: ${extraHeaders.join(', ')}.`;
            setError(errorMsg);
            return;
          }

          const newMapping: Record<string, string> = {};
          const plantFieldEntries = Object.entries(plantFields);
          csvHeaders.forEach(header => {
            const foundEntry = plantFieldEntries.find(([_, value]) => value === header);
            if (foundEntry) {
              newMapping[header] = foundEntry[0];
            }
          });
          setMapping(newMapping);
        },
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full">
        <h2 className="text-2xl font-bold mb-4">Import CSV</h2>
        <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
          <input {...getInputProps()} />
          {
            isDragActive ?
              <p>Drop the files here ...</p> :
              <p>Drag 'n' drop a CSV file here, or click to select a file</p>
          }
          {file && <p className="mt-4 text-sm text-gray-500">{file.name}</p>}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            <p className="font-bold">Invalid CSV Headers</p>
            <p>{error}</p>
          </div>
        )}

        {data.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-2">Data Preview</h3>
            <div className="overflow-auto max-h-64">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((header) => (
                      <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {headers.map((header) => (
                        <td key={header} className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mapping UI removed */}
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400">Cancel</button>
          <button onClick={() => onImport(data, mapping)} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50" disabled={!file || !!error}>Import</button>
        </div>
      </div>
    </div>
  );
};

export default CsvImportModal;
