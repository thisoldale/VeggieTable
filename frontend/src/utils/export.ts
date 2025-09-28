// This file will contain the export functionality for garden plans.
import { Planting } from '../types';
import Papa from 'papaparse';

function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads a CSV file from an array of plantings.
 * @param plantings - The array of plantings to export.
 * @param planName - The name of the garden plan, used for the filename.
 */
export const exportToCsv = (plantings: Planting[], planName: string) => {
  const dataToExport = plantings.map(p => ({
    library_plant_id: p.library_plant_id,
    plant_name: p.plant_name,
    variety_name: p.variety_name || '',
    quantity: p.quantity,
    status: p.status,
    planting_method: p.planting_method || '',
    planned_sow_date: p.planned_sow_date || '',
    planned_transplant_date: p.planned_transplant_date || '',
    planned_harvest_start_date: p.planned_harvest_start_date || '',
    time_to_maturity_override: p.time_to_maturity_override || '',
  }));

  const csv = Papa.unparse(dataToExport);
  downloadFile(csv, `${planName.replace(/ /g, '_')}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * Generates and downloads an HTML file from a garden plan.
 * @param planName - The name of the garden plan.
 * @param plantings - The array of plantings to export.
 */
export const exportToHtml = (planName: string, plantings: Planting[]) => {
  const plantingsHtml = plantings.map(p => `
    <tr>
      <td>${p.plant_name}</td>
      <td>${p.variety_name || 'N/A'}</td>
      <td>${p.quantity}</td>
      <td>${p.status}</td>
      <td>${p.planned_sow_date || 'N/A'}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${planName} - Garden Plan</title>
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        h1 { color: #2E7D32; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${planName}</h1>
        <table>
          <thead>
            <tr>
              <th>Plant Name</th>
              <th>Variety</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Planned Sow Date</th>
            </tr>
          </thead>
          <tbody>
            ${plantingsHtml}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  downloadFile(htmlContent, `${planName.replace(/ /g, '_')}.html`, 'text/html;charset=utf-8;');
};