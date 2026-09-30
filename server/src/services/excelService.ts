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

export class ExcelService {
  public static async ensureMasterTemplateExists(): Promise<void> {
    if (!fs.existsSync(TEMPLATE_DIR)) {
      fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
    }

    if (!fs.existsSync(DEFAULT_TEMPLATE_PATH)) {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Feedback Summary');

      // Setup default styling and headers matching legacy format
      sheet.getCell('B9').value = 'Name of Staff: ';
      sheet.getCell('C10').value = 0;
      sheet.getCell('B12').value = 'Course: ';
      sheet.getCell('H12').value = 'Class: ';

      // Headers for questions table
      sheet.getCell('B16').value = 'Question Text';
      sheet.getCell('C16').value = 'Excellent';
      sheet.getCell('D16').value = 'Very Good';
      sheet.getCell('E16').value = 'Good';
      sheet.getCell('F16').value = 'Poor';
      sheet.getCell('G16').value = 'Bad';

      await workbook.xlsx.writeFile(DEFAULT_TEMPLATE_PATH);
    }
  }

  public static async generateReport(data: ExcelExportData, uploadedBuffer?: Buffer): Promise<Buffer> {
    await ExcelService.ensureMasterTemplateExists();

    const workbook = new ExcelJS.Workbook();

    if (uploadedBuffer && uploadedBuffer.length > 0) {
      await workbook.xlsx.load(uploadedBuffer as any);
    } else {
      await workbook.xlsx.readFile(DEFAULT_TEMPLATE_PATH);
    }

    const worksheet = workbook.worksheets[0] || workbook.addWorksheet('Feedback Summary');

    worksheet.getCell('B9').value = `Name of Staff: ${data.facultyName}`;
    worksheet.getCell('C10').value = data.submissionCount;
    worksheet.getCell('B12').value = `Course: ${data.subjectCode}`;
    worksheet.getCell('H12').value = `Class: CM ${data.semester}${data.scheme}`;

    // Fill Question Rating Breakdown
    data.questionsData.forEach((q, index) => {
      const rowNum = 17 + index;
      worksheet.getCell(`B${rowNum}`).value = q.questionText;
      worksheet.getCell(`C${rowNum}`).value = q.excellent;
      worksheet.getCell(`D${rowNum}`).value = q.veryGood;
      worksheet.getCell(`E${rowNum}`).value = q.good;
      worksheet.getCell(`F${rowNum}`).value = q.poor;
      worksheet.getCell(`G${rowNum}`).value = q.bad;
    });

    let currentStartRow = 17 + data.questionsData.length + 2;

    // 1. Overall Performance Rating Section
    worksheet.getCell(`B${currentStartRow}`).value = 'OVERALL PERFORMANCE RATING & STATS';
    worksheet.getCell(`B${currentStartRow}`).font = { bold: true, size: 11, color: { argb: 'FF1E293B' } };
    currentStartRow++;

    worksheet.getCell(`B${currentStartRow}`).value = 'Average Weighted Rating';
    worksheet.getCell(`C${currentStartRow}`).value = `${data.avgRating} / 5.0`;
    worksheet.getCell(`C${currentStartRow}`).font = { bold: true };

    worksheet.getCell(`E${currentStartRow}`).value = 'Total Submissions';
    worksheet.getCell(`F${currentStartRow}`).value = data.submissionCount;
    worksheet.getCell(`F${currentStartRow}`).font = { bold: true };
    currentStartRow += 2;

    // 2. Gemini AI Sentiment Analysis Breakdown Section
    worksheet.getCell(`B${currentStartRow}`).value = 'GEMINI AI SENTIMENT ANALYSIS BREAKDOWN';
    worksheet.getCell(`B${currentStartRow}`).font = { bold: true, size: 11, color: { argb: 'FF1E293B' } };
    currentStartRow++;

    worksheet.getCell(`B${currentStartRow}`).value = 'Positive Sentiment %';
    worksheet.getCell(`C${currentStartRow}`).value = `${data.aiSummary.posPct}%`;
    worksheet.getCell(`C${currentStartRow}`).font = { bold: true, color: { argb: 'FF15803D' } };

    worksheet.getCell(`D${currentStartRow}`).value = 'Neutral Sentiment %';
    worksheet.getCell(`E${currentStartRow}`).value = `${data.aiSummary.neuPct}%`;
    worksheet.getCell(`E${currentStartRow}`).font = { bold: true, color: { argb: 'FF475569' } };

    worksheet.getCell(`F${currentStartRow}`).value = 'Constructive / Improvement %';
    worksheet.getCell(`G${currentStartRow}`).value = `${data.aiSummary.conPct}%`;
    worksheet.getCell(`G${currentStartRow}`).font = { bold: true, color: { argb: 'FFB45309' } };
    currentStartRow += 2;

    // 3. AI Extracted Highlights (Strengths & Growth)
    worksheet.getCell(`B${currentStartRow}`).value = 'AI EXTRACTED HIGHLIGHTS';
    worksheet.getCell(`B${currentStartRow}`).font = { bold: true, size: 11, color: { argb: 'FF1E293B' } };
    currentStartRow++;

    data.aiSummary.strengths.forEach((str) => {
      worksheet.getCell(`B${currentStartRow}`).value = `• Key Strength: ${str}`;
      worksheet.getCell(`B${currentStartRow}`).font = { color: { argb: 'FF166534' } };
      currentStartRow++;
    });

    data.aiSummary.growths.forEach((gro) => {
      worksheet.getCell(`B${currentStartRow}`).value = `• Growth Area: ${gro}`;
      worksheet.getCell(`B${currentStartRow}`).font = { color: { argb: 'FF9A3412' } };
      currentStartRow++;
    });
    currentStartRow++;

    // 4. Student Qualitative Feedback Comments List
    worksheet.getCell(`B${currentStartRow}`).value = 'STUDENT QUALITATIVE FEEDBACK COMMENTS & AI SENTIMENT';
    worksheet.getCell(`B${currentStartRow}`).font = { bold: true, size: 11, color: { argb: 'FF1E293B' } };
    currentStartRow++;

    worksheet.getCell(`B${currentStartRow}`).value = '#';
    worksheet.getCell(`C${currentStartRow}`).value = 'Student Feedback Comment';
    worksheet.getCell(`D${currentStartRow}`).value = 'AI Sentiment';
    worksheet.getCell(`E${currentStartRow}`).value = 'Submitted Date';

    ['B', 'C', 'D', 'E'].forEach((col) => {
      worksheet.getCell(`${col}${currentStartRow}`).font = { bold: true };
    });
    currentStartRow++;

    if (data.aiSummary.comments.length === 0) {
      worksheet.getCell(`B${currentStartRow}`).value = 'No qualitative comments submitted yet.';
      currentStartRow++;
    } else {
      data.aiSummary.comments.forEach((c, idx) => {
        worksheet.getCell(`B${currentStartRow}`).value = idx + 1;
        worksheet.getCell(`C${currentStartRow}`).value = c.comment || '';
        worksheet.getCell(`D${currentStartRow}`).value = c.sentiment;
        worksheet.getCell(`E${currentStartRow}`).value = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A';

        // Color coding for sentiment label in Excel
        if (c.sentiment === 'Positive') {
          worksheet.getCell(`D${currentStartRow}`).font = { bold: true, color: { argb: 'FF15803D' } };
        } else if (c.sentiment === 'Constructive') {
          worksheet.getCell(`D${currentStartRow}`).font = { bold: true, color: { argb: 'FFB45309' } };
        } else {
          worksheet.getCell(`D${currentStartRow}`).font = { bold: true, color: { argb: 'FF475569' } };
        }

        currentStartRow++;
      });
    }

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }
}
