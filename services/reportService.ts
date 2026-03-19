import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export const reportService = {
  generatePDF: async (projectId: string, projectName: string) => {
    // In a fully integrated flow, we would fetch project stats/rounds here 
    // const rounds = await roundService.getRounds(projectId);
    
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Reporte de Estimación Delphi', 20, 20);
    
    doc.setFontSize(14);
    doc.text(`Proyecto: ${projectName}`, 20, 40);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 50);
    
    doc.setFontSize(12);
    doc.text('Resumen de Rondas:', 20, 70);
    doc.text('- Ronda 1: Convergencia Baja (CV: 45%)', 30, 80);
    doc.text('- Ronda 2: Convergencia Media (CV: 25%)', 30, 90);
    doc.text('- Ronda 3: Convergencia Alta (CV: 12%)', 30, 100);
    
    doc.text('Estimación Final Consensuada: 145 Puntos de Historia', 20, 120);
    
    doc.save(`reporte_${projectId}.pdf`);
  },

  generateExcel: async (projectId: string, projectName: string) => {
    const wb = XLSX.utils.book_new();
    
    const resumenData = [
      ['Proyecto', projectName],
      ['Fecha', new Date().toLocaleDateString()],
      ['Estimación Final', '145 Puntos de Historia'],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    
    const historialData = [
      ['Ronda', 'Experto', 'Estimación', 'Justificación'],
      ['1', 'E1', 120, 'Complejidad en BD'],
      ['1', 'E2', 180, 'Riesgo de latencia'],
      ['2', 'E1', 140, 'Ajuste tras debate'],
      ['2', 'E2', 150, 'Acuerdo parcial'],
    ];
    const wsHistorial = XLSX.utils.aoa_to_sheet(historialData);
    XLSX.utils.book_append_sheet(wb, wsHistorial, 'Historial Rondas');
    
    XLSX.writeFile(wb, `reporte_${projectId}.xlsx`);
  }
};
