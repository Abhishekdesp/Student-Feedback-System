import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';
import { User } from '../src/models/User.js';
import { Subject } from '../src/models/Subject.js';
import { Question } from '../src/models/Question.js';
import { Response } from '../src/models/Response.js';
import { ExcelService } from '../src/services/excelService.js';

function calcMedian(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
}

function calcAvg(arr: number[]): number {
  const sum = arr.reduce((a, b) => a + b, 0);
  return Number((sum / arr.length).toFixed(2));
}

async function runBenchmarks() {
  console.log('🚀 Starting Resume Empirical Metric Benchmarks...\n');
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // 1. Seed Base Entities
  const teacher = await User.create({
    username: 'rajesh.sharma',
    email: 'rajesh.sharma@college.edu',
    passwordHash: 'hash',
    role: 'teacher',
  });

  const subject = await Subject.create({
    code: 'AJP',
    facultyName: 'Dr. Rajesh Sharma',
    facultyDesignation: 'Professor',
    facultyEmail: 'rajesh.sharma@college.edu',
    facultyMobile: '9876543210',
    scheme: 'K-Scheme',
    semester: '5',
    academicYear: 'Third',
    status: 1,
  });

  const question = await Question.create({
    text: 'Clarity of explanation and domain expertise?',
    order: 1,
    isActive: true,
  });

  const datasetSizes = [500, 5000, 50000];

  for (const size of datasetSizes) {
    console.log(`\n==================================================`);
    console.log(`📊 BENCHMARKING DATASET SIZE: ${size.toLocaleString()} Feedback Documents`);
    console.log(`==================================================`);

    await Response.deleteMany({});

    // Bulk insert synthetic feedback responses
    const batchSize = 5000;
    let inserted = 0;
    while (inserted < size) {
      const currentBatchSize = Math.min(batchSize, size - inserted);
      const docs = [];
      for (let i = 0; i < currentBatchSize; i++) {
        const ratingVal = ([5, 4, 3, 2, 1][(inserted + i) % 5]) as 1 | 2 | 3 | 4 | 5;
        const sentLabel = (['Positive', 'Neutral', 'Constructive'][(inserted + i) % 3]) as 'Positive' | 'Neutral' | 'Constructive';
        docs.push({
          subjectId: subject._id,
          subjectCode: subject.code,
          studentId: new Types.ObjectId(),
          ratings: [{ questionId: question._id, rating: ratingVal }],
          userComment: `Synthetic benchmark comment ${inserted + i} - great course material!`,
          sentiment: { label: sentLabel, score: 0.9, engine: 'Benchmark Engine' },
          submittedAt: new Date(Date.now() - (inserted + i) * 60000),
        });
      }
      await Response.insertMany(docs);
      inserted += currentBatchSize;
    }

    const docCount = await Response.countDocuments();
    console.log(`✅ Database populated with ${docCount.toLocaleString()} response documents.`);

    // --- QUERY PERFORMANCE BENCHMARK ---
    console.log(`\n--- 🔍 QUERY PERFORMANCE EXPLAIN() STATS ---`);

    // A. WITHOUT INDEXES (Drop custom indexes on Response & Subject)
    await Response.collection.dropIndexes();
    await Subject.collection.dropIndexes();

    const collScanFindExplain: any = await Response.find({ subjectId: subject._id })
      .sort({ submittedAt: -1 })
      .explain('executionStats');

    const collScanAggExplain: any = await Response.aggregate([
      { $match: { subjectId: subject._id } },
      { $unwind: '$ratings' },
      { $group: { _id: '$ratings.rating', count: { $sum: 1 } } },
    ]).explain('executionStats');

    // B. WITH INDEXES (Re-sync Mongoose indexes)
    await Response.syncIndexes();
    await Subject.syncIndexes();

    const ixScanFindExplain: any = await Response.find({ subjectId: subject._id })
      .sort({ submittedAt: -1 })
      .explain('executionStats');

    const ixScanAggExplain: any = await Response.aggregate([
      { $match: { subjectId: subject._id } },
      { $unwind: '$ratings' },
      { $group: { _id: '$ratings.rating', count: { $sum: 1 } } },
    ]).explain('executionStats');

    const getStats = (explainObj: any) => {
      const stats = explainObj?.executionStats || explainObj?.stages?.[0]?.$cursor?.executionStats || {};
      const winningPlan = explainObj?.queryPlanner?.winningPlan || explainObj?.stages?.[0]?.$cursor?.queryPlanner?.winningPlan || {};
      const stage = winningPlan.stage || winningPlan.inputStage?.stage || (explainObj?.stages?.[0]?.$cursor ? 'IXSCAN/CURSOR' : 'UNKNOWN');
      return {
        docsExamined: stats.totalDocsExamined !== undefined ? stats.totalDocsExamined : size,
        timeMs: stats.executionTimeMillis !== undefined ? stats.executionTimeMillis : 0,
        stage: stage,
      };
    };

    const collScanFind = getStats(collScanFindExplain);
    const collScanAgg = getStats(collScanAggExplain);
    const ixScanFind = getStats(ixScanFindExplain);
    const ixScanAgg = getStats(ixScanAggExplain);

    console.log(`\nQuery: Response.find({ subjectId }).sort({ submittedAt: -1 })`);
    console.log(`  WITHOUT INDEX: Stage = ${collScanFind.stage} | DocsExamined = ${collScanFind.docsExamined} | Time = ${collScanFind.timeMs}ms`);
    console.log(`  WITH INDEX:    Stage = ${ixScanFind.stage} | DocsExamined = ${ixScanFind.docsExamined} | Time = ${ixScanFind.timeMs}ms`);

    console.log(`\nAggregation Pipeline: Subject Feedback Ratings Breakdown`);
    console.log(`  WITHOUT INDEX: Stage = ${collScanAgg.stage} | DocsExamined = ${collScanAgg.docsExamined} | Time = ${collScanAgg.timeMs}ms`);
    console.log(`  WITH INDEX:    Stage = ${ixScanAgg.stage} | DocsExamined = ${ixScanAgg.docsExamined} | Time = ${ixScanAgg.timeMs}ms`);

    // Measure 10-run average & median for query with indexes
    const queryTimings: number[] = [];
    for (let run = 0; run < 10; run++) {
      const start = performance.now();
      await Response.find({ subjectId: subject._id }).sort({ submittedAt: -1 }).exec();
      const end = performance.now();
      queryTimings.push(Number((end - start).toFixed(2)));
    }

    console.log(`\n10-Run Query Execution Times (WITH Index):`);
    console.log(`  Average: ${calcAvg(queryTimings)} ms | Median: ${calcMedian(queryTimings)} ms | Timings: [${queryTimings.join(', ')}]`);

    // --- EXCEL EXPORT BENCHMARK ---
    console.log(`\n--- 📑 EXCEL EXPORT GENERATION BENCHMARK (10 RUNS) ---`);
    const exportTimings: number[] = [];

    // Sample data for Excel report
    const sampleAnalytics = {
      facultyName: subject.facultyName,
      facultyDesignation: subject.facultyDesignation,
      facultyEmail: subject.facultyEmail,
      subjectCode: subject.code,
      scheme: subject.scheme,
      semester: subject.semester,
      academicYear: subject.academicYear,
      overallRating: 4.5,
      totalResponses: size,
      totalStudents: size,
      responseRate: 100,
      questionWise: [
        {
          questionText: question.text,
          avgRating: 4.5,
          responsesCount: size,
          distribution: { 5: Math.floor(size * 0.5), 4: Math.floor(size * 0.3), 3: Math.floor(size * 0.1), 2: Math.floor(size * 0.05), 1: Math.floor(size * 0.05) },
        },
      ],
      ratingDistribution: [
        { stars: 5, count: Math.floor(size * 0.5), percentage: 50 },
        { stars: 4, count: Math.floor(size * 0.3), percentage: 30 },
        { stars: 3, count: Math.floor(size * 0.1), percentage: 10 },
        { stars: 2, count: Math.floor(size * 0.05), percentage: 5 },
        { stars: 1, count: Math.floor(size * 0.05), percentage: 5 },
      ],
      sentimentSummary: {
        positivePct: 60,
        neutralPct: 30,
        constructivePct: 10,
        positiveCount: Math.floor(size * 0.6),
        neutralCount: Math.floor(size * 0.3),
        constructiveCount: Math.floor(size * 0.1),
      },
      anonymousComments: Array.from({ length: Math.min(100, size) }).map((_, idx) => ({
        comment: `Synthetic feedback comment #${idx + 1}`,
        sentiment: 'Positive',
        submittedAt: new Date(),
      })),
    };

    for (let run = 0; run < 10; run++) {
      const start = performance.now();
      await ExcelService.generateTeacherMultiSheetReport(sampleAnalytics);
      const end = performance.now();
      exportTimings.push(Number((end - start).toFixed(2)));
    }

    console.log(`Excel Export Timing (10 Runs):`);
    console.log(`  Average: ${calcAvg(exportTimings)} ms | Median: ${calcMedian(exportTimings)} ms | Timings: [${exportTimings.join(', ')}]`);
  }

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log(`\n🎉 Resume Empirical Benchmarks Completed Successfully!`);
}

runBenchmarks().catch(console.error);
