import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

export class StudentService {
  static async importStudentsFromCSV(csvContent: string, defaultYear: 'First' | 'Second' | 'Third' = 'Third') {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 1) {
      throw new AppError('CSV file is empty.', 400);
    }

    let importedCount = 0;

    // Check if first line is a header
    const firstLineParts = lines[0].split(',').map((s) => s.trim().toLowerCase());
    const startIndex = firstLineParts.includes('sname') || firstLineParts.includes('username') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((s) => s.trim());
      if (parts.length >= 2) {
        let sname = '';
        let pass = '';
        let year = defaultYear;

        if (parts.length >= 4 && !isNaN(Number(parts[0]))) {
          // Format: id, sname, year, password
          sname = parts[1];
          year = (parts[2] as any) || defaultYear;
          pass = parts[3];
        } else {
          // Format: sname, password
          sname = parts[0];
          pass = parts[1];
        }

        if (sname && pass) {
          const passwordHash = await bcrypt.hash(pass, 10);
          
          await User.findOneAndUpdate(
            { username: { $regex: new RegExp(`^${sname.trim()}$`, 'i') } },
            {
              username: sname.trim(),
              passwordHash,
              role: 'student',
              studentDetails: {
                academicYear: year,
                isImported: true,
              },
            },
            { upsert: true, new: true }
          );
          importedCount++;
        }
      }
    }

    return { importedCount };
  }

  static async getAllStudents() {
    return User.find({ role: 'student' }).select('-passwordHash').sort({ username: 1 });
  }
}
