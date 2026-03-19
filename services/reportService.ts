import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Project, Task, Round } from '../types';

interface ReportOptions {
  includeStats: boolean;
  includeHistory: boolean;
  includeJustifications: boolean;
  includeCharts: boolean;
  includeAudit: boolean;
}

interface TaskWithRounds extends Task {
  rounds: Round[];
}

export const reportService = {
  async generatePDF(project: Project, tasks: TaskWithRounds[], options: ReportOptions): Promise<void> {
    const doc = new jsPDF() as any;
    const timestamp = new Date().toLocaleString();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(43, 186, 165); // delphi-keppel
    doc.text('Reporte de Estimación Delphi', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generado por EstimaPro UCE - ${timestamp}`, 20, 28);

    // Project Info
    doc.setDrawColor(241, 245, 249);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`Proyecto: ${project.name}`, 20, 45);
    doc.setFontSize(10);
    const methodLabel = project.estimationMethod ? (project.estimationMethod === 'planning-poker' ? 'Planning Poker (Agile)' : project.estimationMethod === 'three-point' ? 'Estimación de Tres Puntos (PERT)' : 'Wideband Delphi (Tradicional)') : 'Wideband Delphi';
    doc.text(`Método: ${methodLabel}`, 20, 52);
    doc.text(`Unidad: ${project.unit}`, 20, 58);

    let currentY = 70;

    // Summary Table
    if (options.includeStats) {
      doc.setFontSize(12);
      doc.text('Resumen de Tareas', 20, currentY);
      currentY += 8;

      const tableData = tasks.map(t => [
        t.title,
        t.status,
        t.finalEstimate || 'N/A',
        t.rounds.length.toString()
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Tarea', 'Estado', 'Estimación Final', 'Rondas']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [43, 186, 165] },
        margin: { left: 20, right: 20 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Detailed Rounds History
    if (options.includeHistory) {
      tasks.forEach(task => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.text(`Detalle: ${task.title}`, 20, currentY);
        currentY += 8;

        task.rounds.forEach(round => {
          if (currentY > 250) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(10);
          doc.text(`Ronda ${round.roundNumber} (CV: ${((round.stats?.coefficientOfVariation || 0) * 100).toFixed(1)}%)`, 25, currentY);
          
          // Method specific metrics
          if (round.stats?.metricaResultados) {
            const m = round.stats.metricaResultados;
            let mText = '';
            if (project.estimationMethod === 'planning-poker' && m.moda) {
              mText = `Moda: ${m.moda} | Coherencia: ${m.consensoPct}%`;
            } else if (project.estimationMethod === 'three-point' && m.expectedValue) {
              mText = `Valor PERT (E): ${m.expectedValue} | Desviación (σ): ${m.standardDeviation}`;
            }
            if (mText) {
              currentY += 5;
              doc.setFontSize(8);
              doc.setTextColor(51, 65, 85); // slate-700
              doc.text(mText, 25, currentY);
              doc.setTextColor(100, 116, 139); // reset
            }
          }
          currentY += 5;

          const estimations = round.estimations ? round.estimations.map((est, idx: number) => {
            let valText = est.value.toString();
            if (project.estimationMethod === 'three-point' && est.metodoData) {
              const d = est.metodoData;
              valText = `${est.value} (O:${d.optimistic}, M:${d.mostLikely}, P:${d.pessimistic})`;
            } else if (project.estimationMethod === 'planning-poker' && est.metodoData) {
              valText = `C:( ${est.metodoData.card} )`;
            }
            
            return [
              `Experto ${String.fromCharCode(65 + idx)}`,
              valText,
              options.includeJustifications ? (est.justification || '-') : 'Omitido'
            ];
          }) : [];

          autoTable(doc, {
            startY: currentY,
            head: [['Participante', 'Valor', 'Justificación']],
            body: estimations,
            theme: 'plain',
            headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'bold' },
            margin: { left: 25, right: 20 },
            styles: { fontSize: 8 }
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;
        });
        currentY += 5;
      });
    }

    doc.save(`Reporte_${project.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  },

  generateExcel(project: Project, tasks: TaskWithRounds[]): void {
    const wb = XLSX.utils.book_new();
    
    // Resumen Sheet
    const resumenData = [
      ['Reporte de Estimación EstimaPro UCE'],
      ['Proyecto', project.name],
      ['Fecha Generación', new Date().toLocaleString()],
      [''],
      ['Tarea', 'Estado', 'Rondas', 'Estimación Final']
    ];

    tasks.forEach(t => {
      resumenData.push([t.title, t.status, t.rounds.length.toString(), t.finalEstimate?.toString() || 'N/A']);
    });

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'General');

    // Detalle Estimaciones Sheet
    const detalleData = [
      ['Tarea', 'Ronda', 'Experto', 'Valor', 'Justificación']
    ];

    tasks.forEach(t => {
      t.rounds.forEach(r => {
        if (r.estimations) {
           r.estimations.forEach((e, idx: number) => {
             let valText = e.value.toString();
             if (project.estimationMethod === 'three-point' && e.metodoData) {
               valText = `E:${e.value} (O:${e.metodoData.optimistic}, M:${e.metodoData.mostLikely}, P:${e.metodoData.pessimistic})`;
             } else if (project.estimationMethod === 'planning-poker' && e.metodoData) {
               valText = `Card: ${e.metodoData.card}`;
             }

             detalleData.push([
               t.title,
               r.roundNumber.toString(),
               `Experto ${String.fromCharCode(65 + idx)}`,
               valText,
               e.justification || ''
             ]);
           });
        }
      });
    });

    const wsDetalle = XLSX.utils.aoa_to_sheet(detalleData);
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Historial Detallado');

    XLSX.writeFile(wb, `Reporte_${project.name.replace(/\s+/g, '_')}.xlsx`);
  }
};
