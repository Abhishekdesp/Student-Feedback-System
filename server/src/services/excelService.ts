import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.resolve(__dirname, '../../templates');
const DEFAULT_TEMPLATE_PATH = path.join(TEMPLATE_DIR, 'master_template.xlsx');

export interface ExcelExportData {
  facultyName: string;
  subjectCode: string;
  semester: string;
  scheme: string;
  submissionCount: number;
  avgRating: number;
  questionsData: {
    questionText: string;
    excellent: number;
    veryGood: number;
    good: number;
    poor: number;
    bad: number;
  }[];
  aiSummary: {
    totalComments: number;
    posPct: number;
    neuPct: number;
    conPct: number;
    strengths: string[];
    growths: string[];
    comments: {
      comment?: string;
      sentiment: string;
      score: number;
      createdAt: Date;
    }[];
  };
}

// Reusable styling presets for high-end professional Excel reports
const BORDER_COLOR = 'FFCBD5E1'; // Slate 300
const DARK_BORDER = 'FF1E293B';  // Slate 800

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: BORDER_COLOR } },
  left: { style: 'thin', color: { argb: BORDER_COLOR } },
  bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
  right: { style: 'thin', color: { argb: BORDER_COLOR } },
};

const summaryDoubleBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: DARK_BORDER } },
  left: { style: 'thin', color: { argb: BORDER_COLOR } },
  bottom: { style: 'double', color: { argb: DARK_BORDER } },
  right: { style: 'thin', color: { argb: BORDER_COLOR } },
};

export class ExcelService {
  public static async ensureMasterTemplateExists(): Promise<void> {
    if (!fs.existsSync(TEMPLATE_DIR)) {
      fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
    }
  }

  /**
   * Generates a beautifully formatted, executive-ready Excel report for a subject.
   */
  public static async generateReport(data: ExcelExportData, uploadedBuffer?: Buffer): Promise<Buffer> {
    await ExcelService.ensureMasterTemplateExists();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Student Feedback System';
    workbook.created = new Date();

    // If an external template buffer is provided, load it; otherwise create our brand new styled worksheet
    let worksheet: ExcelJS.Worksheet;
    if (uploadedBuffer && uploadedBuffer.length > 0) {
      await workbook.xlsx.load(uploadedBuffer as any);
      worksheet = workbook.worksheets[0] || workbook.addWorksheet('Feedback Report');
    } else {
      worksheet = workbook.addWorksheet('Feedback Report');
    }

    // Ensure grid lines are visible in Excel / Google Sheets
    worksheet.views = [{ showGridLines: true }];

    // Column Widths
    worksheet.getColumn('A').width = 3;  // Left Margin
    worksheet.getColumn('B').width = 8;  // #
    worksheet.getColumn('C').width = 48; // Question text / item
    worksheet.getColumn('D').width = 16; // 5★ Excellent
    worksheet.getColumn('E').width = 16; // 4★ Very Good
    worksheet.getColumn('F').width = 15; // 3★ Good
    worksheet.getColumn('G').width = 15; // 2★ Poor
    worksheet.getColumn('H').width = 15; // 1★ Bad
    worksheet.getColumn('I').width = 18; // Weighted Avg Rating

    let row = 2;

    // ─────────────────────────────────────────────────────────────
    // 1. REPORT HEADER BANNER
    // ─────────────────────────────────────────────────────────────
    worksheet.mergeCells(`B${row}:I${row}`);
    const titleCell = worksheet.getCell(`B${row}`);
    titleCell.value = 'STUDENT FEEDBACK & FACULTY EVALUATION REPORT';
    titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate 900
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(row).height = 36;
    row++;

    worksheet.mergeCells(`B${row}:I${row}`);
    const subtitleCell = worksheet.getCell(`B${row}`);
    subtitleCell.value = 'Comprehensive Academic Quality Assessment & Feedback Analytics';
    subtitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(row).height = 22;
    row += 2;

    // ─────────────────────────────────────────────────────────────
    // 2. FACULTY & COURSE SPECIFICATIONS CARD
    // ─────────────────────────────────────────────────────────────
    worksheet.mergeCells(`B${row}:I${row}`);
    const metaHeader = worksheet.getCell(`B${row}`);
    metaHeader.value = 'FACULTY & COURSE SPECIFICATIONS';
    metaHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
    metaHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Blue 100
    metaHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    metaHeader.border = thinBorder;
    worksheet.getRow(row).height = 24;
    row++;

    // Helper for key-value row
    const addMetaRow = (k1: string, v1: string | number, k2: string, v2: string | number, isRating = false) => {
      worksheet.getCell(`B${row}`).value = k1;
      worksheet.getCell(`B${row}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
      worksheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      worksheet.getCell(`B${row}`).border = thinBorder;
      worksheet.getCell(`B${row}`).alignment = { vertical: 'middle', indent: 1 };

      worksheet.mergeCells(`C${row}:E${row}`);
      const val1 = worksheet.getCell(`C${row}`);
      val1.value = v1;
      val1.font = { name: 'Calibri', size: 10, bold: isRating, color: { argb: isRating ? 'FF1E40AF' : 'FF0F172A' } };
      val1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      ['C', 'D', 'E'].forEach((c) => (worksheet.getCell(`${c}${row}`).border = thinBorder));
      val1.alignment = { vertical: 'middle', indent: 1 };

      worksheet.getCell(`F${row}`).value = k2;
      worksheet.getCell(`F${row}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
      worksheet.getCell(`F${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      worksheet.getCell(`F${row}`).border = thinBorder;
      worksheet.getCell(`F${row}`).alignment = { vertical: 'middle', indent: 1 };

      worksheet.mergeCells(`G${row}:I${row}`);
      const val2 = worksheet.getCell(`G${row}`);
      val2.value = v2;
      val2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      val2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      ['G', 'H', 'I'].forEach((c) => (worksheet.getCell(`${c}${row}`).border = thinBorder));
      val2.alignment = { vertical: 'middle', indent: 1 };

      worksheet.getRow(row).height = 22;
      row++;
    };

    addMetaRow('Faculty Name:', data.facultyName, 'Course Code:', data.subjectCode);
    addMetaRow('Class / Scheme:', `Semester ${data.semester} (${data.scheme} Scheme)`, 'Total Submissions:', `${data.submissionCount} Students`);
    addMetaRow('Overall Rating:', `${data.avgRating} / 5.0 ★`, 'Generated On:', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), true);
    row++;

    // ─────────────────────────────────────────────────────────────
    // 3. EXECUTIVE KPI METRIC BOXES
    // ─────────────────────────────────────────────────────────────
    const kpiRowStart = row;
    const kpiRowVal = row + 1;

    const createKpiCard = (
      startCol: string,
      endCol: string,
      title: string,
      val: string | number,
      bgColor: string,
      textColor: string
    ) => {
      worksheet.mergeCells(`${startCol}${kpiRowStart}:${endCol}${kpiRowStart}`);
      const tCell = worksheet.getCell(`${startCol}${kpiRowStart}`);
      tCell.value = title;
      tCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF64748B' } };
      tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      tCell.alignment = { vertical: 'middle', horizontal: 'center' };
      tCell.border = thinBorder;

      worksheet.mergeCells(`${startCol}${kpiRowVal}:${endCol}${kpiRowVal}`);
      const vCell = worksheet.getCell(`${startCol}${kpiRowVal}`);
      vCell.value = val;
      vCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: textColor } };
      vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      vCell.alignment = { vertical: 'middle', horizontal: 'center' };
      vCell.border = thinBorder;
    };

    createKpiCard('B', 'C', 'OVERALL RATING', `${data.avgRating} / 5.0`, 'FFEFF6FF', 'FF1E40AF'); // Blue
    createKpiCard('D', 'E', 'SUBMISSIONS', data.submissionCount, 'FFF8FAFC', 'FF0F172A'); // Slate
    createKpiCard('F', 'G', 'POSITIVE SENTIMENT', `${data.aiSummary.posPct}%`, 'FFECFDF5', 'FF15803D'); // Green
    createKpiCard('H', 'I', 'CONSTRUCTIVE / GROWTH', `${data.aiSummary.conPct}%`, 'FFFFFBEB', 'FFB45309'); // Amber

    worksheet.getRow(kpiRowStart).height = 18;
    worksheet.getRow(kpiRowVal).height = 28;
    row += 3;

    // ─────────────────────────────────────────────────────────────
    // 4. QUESTION-WISE EVALUATION BREAKDOWN TABLE
    // ─────────────────────────────────────────────────────────────
    worksheet.mergeCells(`B${row}:I${row}`);
    const tableTitle = worksheet.getCell(`B${row}`);
    tableTitle.value = 'DETAILED QUESTION-WISE EVALUATION BREAKDOWN';
    tableTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    tableTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }; // Blue 800
    tableTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    tableTitle.border = thinBorder;
    worksheet.getRow(row).height = 24;
    row++;

    // Table Column Headers
    const headers = [
      { col: 'B', text: '#' },
      { col: 'C', text: 'Evaluation Question / Parameter' },
      { col: 'D', text: '5★ Excellent' },
      { col: 'E', text: '4★ Very Good' },
      { col: 'F', text: '3★ Good' },
      { col: 'G', text: '2★ Poor' },
      { col: 'H', text: '1★ Bad' },
      { col: 'I', text: 'Weighted Avg' },
    ];

    headers.forEach((h) => {
      const c = worksheet.getCell(`${h.col}${row}`);
      c.value = h.text;
      c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // Blue 600
      c.alignment = { vertical: 'middle', horizontal: h.col === 'C' ? 'left' : 'center', indent: h.col === 'C' ? 1 : 0 };
      c.border = thinBorder;
    });
    worksheet.getRow(row).height = 26;
    row++;

    // Table Data Rows
    let totalEx = 0;
    let totalVg = 0;
    let totalG = 0;
    let totalP = 0;
    let totalB = 0;

    data.questionsData.forEach((q, idx) => {
      const isZebra = idx % 2 === 1;
      const rowBg = isZebra ? 'FFF8FAFC' : 'FFFFFFFF';

      totalEx += q.excellent || 0;
      totalVg += q.veryGood || 0;
      totalG += q.good || 0;
      totalP += q.poor || 0;
      totalB += q.bad || 0;

      const qTotal = (q.excellent || 0) + (q.veryGood || 0) + (q.good || 0) + (q.poor || 0) + (q.bad || 0);
      const qScore =
        qTotal > 0
          ? (
              ((q.excellent || 0) * 5 +
                (q.veryGood || 0) * 4 +
                (q.good || 0) * 3 +
                (q.poor || 0) * 2 +
                (q.bad || 0) * 1) /
              qTotal
            ).toFixed(2)
          : '0.00';

      const cells = [
        { col: 'B', val: idx + 1, align: 'center', bold: false },
        { col: 'C', val: q.questionText, align: 'left', bold: false },
        { col: 'D', val: q.excellent || 0, align: 'center', bold: false },
        { col: 'E', val: q.veryGood || 0, align: 'center', bold: false },
        { col: 'F', val: q.good || 0, align: 'center', bold: false },
        { col: 'G', val: q.poor || 0, align: 'center', bold: false },
        { col: 'H', val: q.bad || 0, align: 'center', bold: false },
        { col: 'I', val: `${qScore} / 5.0`, align: 'center', bold: true },
      ];

      cells.forEach((cellData) => {
        const c = worksheet.getCell(`${cellData.col}${row}`);
        c.value = cellData.val;
        c.font = {
          name: 'Calibri',
          size: 10,
          bold: cellData.bold,
          color: { argb: cellData.col === 'I' ? 'FF1E40AF' : 'FF0F172A' },
        };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        c.alignment = { vertical: 'middle', horizontal: cellData.align as any, indent: cellData.align === 'left' ? 1 : 0 };
        c.border = thinBorder;
      });

      worksheet.getRow(row).height = 22;
      row++;
    });

    // Summary Totals Row
    const summaryCells = [
      { col: 'B', val: 'TOTAL', align: 'center' },
      { col: 'C', val: `Cumulative Aggregate Responses (${data.questionsData.length} Criteria)`, align: 'left' },
      { col: 'D', val: totalEx, align: 'center' },
      { col: 'E', val: totalVg, align: 'center' },
      { col: 'F', val: totalG, align: 'center' },
      { col: 'G', val: totalP, align: 'center' },
      { col: 'H', val: totalB, align: 'center' },
      { col: 'I', val: `${data.avgRating} / 5.0`, align: 'center' },
    ];

    summaryCells.forEach((sc) => {
      const c = worksheet.getCell(`${sc.col}${row}`);
      c.value = sc.val;
      c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: sc.col === 'I' ? 'FF1E40AF' : 'FF0F172A' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }; // Slate 200
      c.alignment = { vertical: 'middle', horizontal: sc.align as any, indent: sc.align === 'left' ? 1 : 0 };
      c.border = summaryDoubleBorder;
    });
    worksheet.getRow(row).height = 24;
    row += 2;

    // ─────────────────────────────────────────────────────────────
    // 5. GEMINI AI SENTIMENT ANALYSIS & PEDAGOGICAL INSIGHTS
    // ─────────────────────────────────────────────────────────────
    worksheet.mergeCells(`B${row}:I${row}`);
    const aiTitle = worksheet.getCell(`B${row}`);
    aiTitle.value = 'AI SENTIMENT ANALYSIS & TEACHING INSIGHTS';
    aiTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    aiTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800
    aiTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    aiTitle.border = thinBorder;
    worksheet.getRow(row).height = 24;
    row++;

    // Sentiment breakdown mini-table
    worksheet.mergeCells(`B${row}:C${row}`);
    worksheet.getCell(`B${row}`).value = 'Sentiment Category';
    worksheet.getCell(`B${row}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
    worksheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    worksheet.getCell(`B${row}`).border = thinBorder;
    worksheet.getCell(`C${row}`).border = thinBorder;

    worksheet.mergeCells(`D${row}:F${row}`);
    worksheet.getCell(`D${row}`).value = 'Sentiment Distribution (%)';
    worksheet.getCell(`D${row}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
    worksheet.getCell(`D${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    ['D', 'E', 'F'].forEach((col) => (worksheet.getCell(`${col}${row}`).border = thinBorder));

    worksheet.mergeCells(`G${row}:I${row}`);
    worksheet.getCell(`G${row}`).value = 'Status & Interpretation';
    worksheet.getCell(`G${row}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
    worksheet.getCell(`G${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    ['G', 'H', 'I'].forEach((col) => (worksheet.getCell(`${col}${row}`).border = thinBorder));
    worksheet.getRow(row).height = 20;
    row++;

    const addSentimentRow = (label: string, pct: number, desc: string, fillHex: string, textHex: string) => {
      worksheet.mergeCells(`B${row}:C${row}`);
      worksheet.getCell(`B${row}`).value = label;
      worksheet.getCell(`B${row}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: textHex } };
      worksheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillHex } };
      worksheet.getCell(`B${row}`).border = thinBorder;
      worksheet.getCell(`C${row}`).border = thinBorder;
      worksheet.getCell(`B${row}`).alignment = { vertical: 'middle', indent: 1 };

      worksheet.mergeCells(`D${row}:F${row}`);
      worksheet.getCell(`D${row}`).value = `${pct}%`;
      worksheet.getCell(`D${row}`).font = { name: 'Calibri', size: 11, bold: true, color: { argb: textHex } };
      worksheet.getCell(`D${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillHex } };
      ['D', 'E', 'F'].forEach((col) => (worksheet.getCell(`${col}${row}`).border = thinBorder));
      worksheet.getCell(`D${row}`).alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells(`G${row}:I${row}`);
      worksheet.getCell(`G${row}`).value = desc;
      worksheet.getCell(`G${row}`).font = { name: 'Calibri', size: 9.5, color: { argb: 'FF334155' } };
      worksheet.getCell(`G${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      ['G', 'H', 'I'].forEach((col) => (worksheet.getCell(`${col}${row}`).border = thinBorder));
      worksheet.getCell(`G${row}`).alignment = { vertical: 'middle', indent: 1 };

      worksheet.getRow(row).height = 22;
      row++;
    };

    addSentimentRow('Positive', data.aiSummary.posPct, 'Strong appreciation for pedagogy & clarity', 'FFDCFCE7', 'FF166534');
    addSentimentRow('Neutral', data.aiSummary.neuPct, 'Standard fulfillment of curriculum objectives', 'FFF1F5F9', 'FF475569');
    addSentimentRow('Constructive', data.aiSummary.conPct, 'Actionable areas for teaching enhancement', 'FFFEF3C7', 'FFB45309');
    row++;

    // AI Strengths and Growth Highlights
    if (data.aiSummary.strengths.length > 0 || data.aiSummary.growths.length > 0) {
      worksheet.mergeCells(`B${row}:I${row}`);
      const hTitle = worksheet.getCell(`B${row}`);
      hTitle.value = 'AI EXTRACTED STRENGTHS & GROWTH RECOMMENDATIONS';
      hTitle.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      hTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      hTitle.border = thinBorder;
      worksheet.getRow(row).height = 20;
      row++;

      data.aiSummary.strengths.forEach((str) => {
        worksheet.mergeCells(`B${row}:I${row}`);
        const c = worksheet.getCell(`B${row}`);
        c.value = `✔ Strength: ${str}`;
        c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF166534' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
        ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => (worksheet.getCell(`${col}${row}`).border = thinBorder));
        c.alignment = { vertical: 'middle', indent: 1 };
        worksheet.getRow(row).height = 20;
        row++;
      });

      data.aiSummary.growths.forEach((gro) => {
        worksheet.mergeCells(`B${row}:I${row}`);
        const c = worksheet.getCell(`B${row}`);
        c.value = `▲ Opportunity: ${gro}`;
        c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF9A3412' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
        ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => (worksheet.getCell(`${col}${row}`).border = thinBorder));
        c.alignment = { vertical: 'middle', indent: 1 };
        worksheet.getRow(row).height = 20;
        row++;
      });
      row++;
    }

    // ─────────────────────────────────────────────────────────────
    // 6. STUDENT QUALITATIVE COMMENTS & ANONYMOUS LOG
    // ─────────────────────────────────────────────────────────────
    worksheet.mergeCells(`B${row}:I${row}`);
    const commentsHeader = worksheet.getCell(`B${row}`);
    commentsHeader.value = 'STUDENT QUALITATIVE FEEDBACK COMMENTS & ANONYMOUS LOG';
    commentsHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    commentsHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800
    commentsHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    commentsHeader.border = thinBorder;
    worksheet.getRow(row).height = 24;
    row++;

    // Comments Table Headers
    worksheet.getCell(`B${row}`).value = '#';
    worksheet.getCell(`B${row}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    worksheet.getCell(`B${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell(`B${row}`).border = thinBorder;

    worksheet.mergeCells(`C${row}:F${row}`);
    const cHead = worksheet.getCell(`C${row}`);
    cHead.value = 'Anonymous Student Feedback Comment';
    cHead.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    ['C', 'D', 'E', 'F'].forEach((col) => (worksheet.getCell(`${col}${row}`).border = thinBorder));
    cHead.alignment = { vertical: 'middle', indent: 1 };

    worksheet.mergeCells(`G${row}:H${row}`);
    const sHead = worksheet.getCell(`G${row}`);
    sHead.value = 'AI Sentiment';
    sHead.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    sHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    ['G', 'H'].forEach((col) => (worksheet.getCell(`${col}${row}`).border = thinBorder));
    sHead.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.getCell(`I${row}`).value = 'Submission Date';
    worksheet.getCell(`I${row}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell(`I${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    worksheet.getCell(`I${row}`).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell(`I${row}`).border = thinBorder;
    worksheet.getRow(row).height = 24;
    row++;

    if (!data.aiSummary.comments || data.aiSummary.comments.length === 0) {
      worksheet.mergeCells(`B${row}:I${row}`);
      const emptyCell = worksheet.getCell(`B${row}`);
      emptyCell.value = 'No qualitative written comments submitted for this course evaluation.';
      emptyCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
      emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => (worksheet.getCell(`${col}${row}`).border = thinBorder));
      emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(row).height = 24;
      row++;
    } else {
      data.aiSummary.comments.forEach((c, idx) => {
        const isZebra = idx % 2 === 1;
        const rowBg = isZebra ? 'FFF8FAFC' : 'FFFFFFFF';

        worksheet.getCell(`B${row}`).value = idx + 1;
        worksheet.getCell(`B${row}`).font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };
        worksheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        worksheet.getCell(`B${row}`).border = thinBorder;
        worksheet.getCell(`B${row}`).alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.mergeCells(`C${row}:F${row}`);
        const cCell = worksheet.getCell(`C${row}`);
        cCell.value = c.comment || '';
        cCell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF0F172A' } };
        cCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        ['C', 'D', 'E', 'F'].forEach((col) => (worksheet.getCell(`${col}${row}`).border = thinBorder));
        cCell.alignment = { vertical: 'middle', wrapText: true, indent: 1 };

        let sentColor = 'FF475569';
        let sentBg = 'FFF1F5F9';
        if (c.sentiment === 'Positive') {
          sentColor = 'FF166534';
          sentBg = 'FFDCFCE7';
        } else if (c.sentiment === 'Constructive') {
          sentColor = 'FF9A3412';
          sentBg = 'FFFEF3C7';
        }

        worksheet.mergeCells(`G${row}:H${row}`);
        const sCell = worksheet.getCell(`G${row}`);
        sCell.value = c.sentiment || 'Neutral';
        sCell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: sentColor } };
        sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sentBg } };
        ['G', 'H'].forEach((col) => (worksheet.getCell(`${col}${row}`).border = thinBorder));
        sCell.alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.getCell(`I${row}`).value = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A';
        worksheet.getCell(`I${row}`).font = { name: 'Calibri', size: 9, color: { argb: 'FF64748B' } };
        worksheet.getCell(`I${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        worksheet.getCell(`I${row}`).border = thinBorder;
        worksheet.getCell(`I${row}`).alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.getRow(row).height = Math.max(22, Math.ceil(((c.comment || '').length / 45) * 18));
        row++;
      });
    }

    row += 2;

    // ─────────────────────────────────────────────────────────────
    // 7. FOOTER NOTE
    // ─────────────────────────────────────────────────────────────
    worksheet.mergeCells(`B${row}:I${row}`);
    const footer = worksheet.getCell(`B${row}`);
    footer.value = `Strict Anonymity Enforced • Generated by Student Feedback System • Powered by LangChain & Gemini AI`;
    footer.font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: 'FF94A3B8' } };
    footer.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(row).height = 18;

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  /**
   * Generates a multi-sheet Excel workbook for the teacher portal with proper borders and styling.
   */
  public static async generateTeacherMultiSheetReport(analyticsData: {
    facultyName: string;
    facultyDesignation: string;
    facultyEmail: string;
    subjectCode: string;
    scheme: string;
    semester: string;
    academicYear: string;
    overallRating: number;
    totalResponses: number;
    totalStudents: number;
    responseRate: number;
    questionWise: {
      questionText: string;
      avgRating: number;
      responsesCount: number;
      distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
    }[];
    ratingDistribution: {
      stars: number;
      count: number;
      percentage: number;
    }[];
    sentimentSummary: {
      positivePct: number;
      neutralPct: number;
      constructivePct: number;
      positiveCount: number;
      neutralCount: number;
      constructiveCount: number;
    };
    anonymousComments: {
      comment: string;
      sentiment: string;
      submittedAt: Date | string;
    }[];
  }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Student Feedback System';
    workbook.created = new Date();

    // Sheet 1: Overview & Faculty Info
    const sheet1 = workbook.addWorksheet('Overview');
    sheet1.views = [{ showGridLines: true }];
    sheet1.columns = [
      { header: 'Property', key: 'prop', width: 28 },
      { header: 'Value', key: 'val', width: 45 },
    ];
    sheet1.getRow(1).font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    sheet1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    sheet1.getRow(1).alignment = { vertical: 'middle', indent: 1 };
    sheet1.getRow(1).height = 24;

    const overviewRows = [
      { prop: 'Faculty Name', val: analyticsData.facultyName },
      { prop: 'Designation', val: analyticsData.facultyDesignation },
      { prop: 'Faculty Email', val: analyticsData.facultyEmail },
      { prop: 'Subject Code', val: analyticsData.subjectCode },
      { prop: 'Scheme', val: analyticsData.scheme },
      { prop: 'Semester', val: analyticsData.semester },
      { prop: 'Academic Year', val: analyticsData.academicYear },
      { prop: 'Overall Rating', val: `${analyticsData.overallRating} / 5.0` },
      { prop: 'Total Responses', val: analyticsData.totalResponses },
      { prop: 'Total Students', val: analyticsData.totalStudents },
      { prop: 'Response Rate', val: `${analyticsData.responseRate}%` },
    ];

    overviewRows.forEach((r, idx) => {
      const addedRow = sheet1.addRow(r);
      const isZebra = idx % 2 === 1;
      const bg = isZebra ? 'FFF8FAFC' : 'FFFFFFFF';
      addedRow.getCell(1).font = { name: 'Calibri', bold: true, color: { argb: 'FF475569' } };
      addedRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      addedRow.getCell(1).border = thinBorder;
      addedRow.getCell(2).font = { name: 'Calibri', color: { argb: 'FF0F172A' }, bold: r.prop === 'Overall Rating' };
      addedRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      addedRow.getCell(2).border = thinBorder;
      addedRow.height = 22;
    });

    // Sheet 2: Question-Wise Ratings
    const sheet2 = workbook.addWorksheet('Question Ratings');
    sheet2.views = [{ showGridLines: true }];
    sheet2.columns = [
      { header: '#', key: 'num', width: 6 },
      { header: 'Question Text', key: 'text', width: 50 },
      { header: 'Avg Rating', key: 'avg', width: 14 },
      { header: 'Responses', key: 'count', width: 14 },
      { header: '5 Stars (Excellent)', key: 's5', width: 18 },
      { header: '4 Stars (Very Good)', key: 's4', width: 18 },
      { header: '3 Stars (Good)', key: 's3', width: 15 },
      { header: '2 Stars (Poor)', key: 's2', width: 15 },
      { header: '1 Star (Bad)', key: 's1', width: 15 },
    ];
    sheet2.getRow(1).font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    sheet2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    sheet2.getRow(1).height = 26;
    sheet2.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    analyticsData.questionWise.forEach((q, idx) => {
      const isZebra = idx % 2 === 1;
      const bg = isZebra ? 'FFF8FAFC' : 'FFFFFFFF';
      const added = sheet2.addRow({
        num: idx + 1,
        text: q.questionText,
        avg: q.avgRating,
        count: q.responsesCount,
        s5: q.distribution[5] || 0,
        s4: q.distribution[4] || 0,
        s3: q.distribution[3] || 0,
        s2: q.distribution[2] || 0,
        s1: q.distribution[1] || 0,
      });
      added.height = 22;
      for (let c = 1; c <= 9; c++) {
        const cell = added.getCell(c);
        cell.border = thinBorder;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.font = { name: 'Calibri', size: 10, bold: c === 3, color: { argb: c === 3 ? 'FF1E40AF' : 'FF0F172A' } };
        cell.alignment = { vertical: 'middle', horizontal: c === 2 ? 'left' : 'center', indent: c === 2 ? 1 : 0 };
      }
    });

    // Sheet 3: Rating Distribution
    const sheet3 = workbook.addWorksheet('Rating Distribution');
    sheet3.views = [{ showGridLines: true }];
    sheet3.columns = [
      { header: 'Rating Star', key: 'star', width: 20 },
      { header: 'Response Count', key: 'count', width: 20 },
      { header: 'Percentage (%)', key: 'pct', width: 20 },
    ];
    sheet3.getRow(1).font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
    sheet3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    sheet3.getRow(1).height = 24;
    sheet3.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    analyticsData.ratingDistribution.forEach((rd, idx) => {
      const isZebra = idx % 2 === 1;
      const bg = isZebra ? 'FFF8FAFC' : 'FFFFFFFF';
      const added = sheet3.addRow({
        star: `${rd.stars} Stars`,
        count: rd.count,
        pct: `${rd.percentage}%`,
      });
      added.height = 22;
      for (let c = 1; c <= 3; c++) {
        const cell = added.getCell(c);
        cell.border = thinBorder;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

    // Sheet 4: Sentiment Summary
    const sheet4 = workbook.addWorksheet('Sentiment Summary');
    sheet4.views = [{ showGridLines: true }];
    sheet4.columns = [
      { header: 'Sentiment Category', key: 'cat', width: 25 },
      { header: 'Count', key: 'count', width: 18 },
      { header: 'Percentage (%)', key: 'pct', width: 20 },
    ];
    sheet4.getRow(1).font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
    sheet4.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    sheet4.getRow(1).height = 24;
    sheet4.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    const sentRows = [
      { cat: 'Positive', count: analyticsData.sentimentSummary.positiveCount, pct: `${analyticsData.sentimentSummary.positivePct}%`, color: 'FF166534', bg: 'FFDCFCE7' },
      { cat: 'Neutral', count: analyticsData.sentimentSummary.neutralCount, pct: `${analyticsData.sentimentSummary.neutralPct}%`, color: 'FF475569', bg: 'FFF1F5F9' },
      { cat: 'Constructive / Growth', count: analyticsData.sentimentSummary.constructiveCount, pct: `${analyticsData.sentimentSummary.constructivePct}%`, color: 'FF9A3412', bg: 'FFFEF3C7' },
    ];

    sentRows.forEach((sr) => {
      const added = sheet4.addRow({ cat: sr.cat, count: sr.count, pct: sr.pct });
      added.height = 22;
      for (let c = 1; c <= 3; c++) {
        const cell = added.getCell(c);
        cell.border = thinBorder;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sr.bg } };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: sr.color } };
        cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center', indent: c === 1 ? 1 : 0 };
      }
    });

    // Sheet 5: Anonymous Comments
    const sheet5 = workbook.addWorksheet('Anonymous Comments');
    sheet5.views = [{ showGridLines: true }];
    sheet5.columns = [
      { header: '#', key: 'num', width: 6 },
      { header: 'Anonymous Student Feedback', key: 'comment', width: 60 },
      { header: 'Sentiment', key: 'sentiment', width: 18 },
      { header: 'Submitted Date', key: 'date', width: 18 },
    ];
    sheet5.getRow(1).font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
    sheet5.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    sheet5.getRow(1).height = 24;
    sheet5.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    if (analyticsData.anonymousComments.length === 0) {
      const added = sheet5.addRow({ num: 1, comment: 'No student comments submitted yet.', sentiment: 'N/A', date: 'N/A' });
      for (let c = 1; c <= 4; c++) {
        added.getCell(c).border = thinBorder;
      }
    } else {
      analyticsData.anonymousComments.forEach((c, idx) => {
        const isZebra = idx % 2 === 1;
        const bg = isZebra ? 'FFF8FAFC' : 'FFFFFFFF';
        const added = sheet5.addRow({
          num: idx + 1,
          comment: c.comment,
          sentiment: c.sentiment,
          date: c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : 'N/A',
        });
        added.height = 24;
        for (let col = 1; col <= 4; col++) {
          const cell = added.getCell(col);
          cell.border = thinBorder;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
          cell.alignment = { vertical: 'middle', horizontal: col === 2 ? 'left' : 'center', indent: col === 2 ? 1 : 0, wrapText: col === 2 };
        }
      });
    }

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }
}
