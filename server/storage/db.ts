import fs from 'fs';
import path from 'path';
import { DocumentMetadata, QuizAttempt, StudyPlan, UserProfile } from '../types.js';

interface DatabaseSchema {
  users: UserProfile[];
  documents: DocumentMetadata[];
  quizAttempts: QuizAttempt[];
  studyPlans: StudyPlan[];
  studyMaterials: Array<{
    id: string;
    documentId: string;
    type: 'summary' | 'flashcards';
    content: any;
    createdAt: string;
  }>;
}

const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'usr_default_samuel',
    name: 'Samuel Collridge Naik',
    email: 'samuelcollridgenaik@gmail.com',
    studentId: 'MCA-2025-084',
    institution: 'School of Computer Science & Applications',
    program: 'Master of Computer Applications (MCA)',
    semester: 'IV Semester',
    role: 'student',
    password: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_evaluator_raman',
    name: 'Dr. R. Ramanathan',
    email: 'examiner.mca@university.edu',
    studentId: 'FACULTY-VIVA-2026',
    institution: 'Board of MCA Examiners & Academic Review',
    program: 'Postgraduate Computing Evaluation Board',
    semester: 'Academic Year 2025-2026',
    role: 'evaluator',
    password: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_student_priya',
    name: 'Priya Sharma',
    email: 'priya.mca@university.edu',
    studentId: 'MCA-2025-092',
    institution: 'School of Computer Science & Applications',
    program: 'Master of Computer Applications (MCA)',
    semester: 'IV Semester',
    role: 'student',
    password: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
];

export class StorageService {
  private dataDir = path.resolve(process.cwd(), '.data');
  private dbPath = path.resolve(process.cwd(), '.data', 'app_data.json');
  private activeUserId: string = 'usr_default_samuel';
  private data: DatabaseSchema = {
    users: [...DEFAULT_USERS],
    documents: [],
    quizAttempts: [],
    studyPlans: [],
    studyMaterials: [],
  };

  constructor() {
    this.ensureDir();
    this.load();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
      } catch (e) {
        console.warn('Could not create .data directory', e);
      }
    }
  }

  private load(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure default users exist
        if (!parsed.users || parsed.users.length === 0) {
          parsed.users = [...DEFAULT_USERS];
        } else {
          // Merge in any missing default demo users
          for (const def of DEFAULT_USERS) {
            if (!parsed.users.some((u: UserProfile) => u.id === def.id || u.email === def.email)) {
              parsed.users.push(def);
            }
          }
        }
        this.data = parsed;
        console.log(`Loaded DB: ${this.data.users.length} users, ${this.data.documents.length} docs.`);
      }
    } catch (err: any) {
      console.warn('Failed to load JSON database, initializing default users:', err.message);
    }
  }

  private save(): void {
    try {
      this.ensureDir();
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (err: any) {
      console.warn('Failed to write database to disk:', err.message);
    }
  }

  // User & Auth Management
  public getUsers(): UserProfile[] {
    if (!this.data.users || this.data.users.length === 0) {
      this.data.users = [...DEFAULT_USERS];
      this.save();
    }
    return [...this.data.users];
  }

  public getCurrentUser(): UserProfile {
    const user = this.getUserById(this.activeUserId);
    if (user) return user;
    const users = this.getUsers();
    return users[0] || DEFAULT_USERS[0];
  }

  public setCurrentUser(id: string): UserProfile | undefined {
    const user = this.getUserById(id);
    if (user) {
      this.activeUserId = id;
      return user;
    }
    return undefined;
  }

  public getUserById(id: string): UserProfile | undefined {
    const users = this.getUsers();
    return users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public saveUser(user: UserProfile): UserProfile {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.unshift(user);
    }
    this.data.users = users;
    this.save();
    return user;
  }

  public updateUserKeys(userId: string, geminiKey?: string, groqKey?: string): UserProfile | null {
    const user = this.getUserById(userId);
    if (!user) return null;
    if (geminiKey !== undefined) user.geminiApiKey = geminiKey.trim();
    if (groqKey !== undefined) user.groqApiKey = groqKey.trim();
    this.saveUser(user);
    return user;
  }

  // Documents
  public getDocuments(userId?: string): DocumentMetadata[] {
    if (!userId) return [...this.data.documents];
    // Return documents uploaded by this user, or global shared sample notes
    return this.data.documents.filter((d) => !d.userId || d.userId === userId);
  }

  public getDocument(id: string): DocumentMetadata | undefined {
    return this.data.documents.find((d) => d.id === id);
  }

  public addDocument(doc: DocumentMetadata): void {
    this.data.documents.unshift(doc);
    this.save();
  }

  public removeDocument(id: string): void {
    this.data.documents = this.data.documents.filter((d) => d.id !== id);
    this.save();
  }

  // Quiz Attempts
  public getQuizAttempts(userId?: string): QuizAttempt[] {
    if (!userId) return [...this.data.quizAttempts];
    return this.data.quizAttempts.filter((q) => !q.userId || q.userId === userId);
  }

  public addQuizAttempt(attempt: QuizAttempt): void {
    this.data.quizAttempts.unshift(attempt);
    this.save();
  }

  // Study Plans
  public getStudyPlans(userId?: string): StudyPlan[] {
    if (!userId) return [...this.data.studyPlans];
    return this.data.studyPlans.filter((p) => !p.userId || p.userId === userId);
  }

  public saveStudyPlan(plan: StudyPlan): void {
    this.data.studyPlans.unshift(plan);
    this.save();
  }

  // Study Materials
  public saveStudyMaterial(documentId: string, type: 'summary' | 'flashcards', content: any): string {
    const id = `mat_${Date.now()}`;
    this.data.studyMaterials.unshift({
      id,
      documentId,
      type,
      content,
      createdAt: new Date().toISOString(),
    });
    this.save();
    return id;
  }

  public getStudyMaterials(documentId?: string) {
    if (!documentId) return this.data.studyMaterials;
    return this.data.studyMaterials.filter((m) => m.documentId === documentId);
  }

  public clearAll(): void {
    this.data = {
      users: [...DEFAULT_USERS],
      documents: [],
      quizAttempts: [],
      studyPlans: [],
      studyMaterials: [],
    };
    this.save();
  }
}

export const storage = new StorageService();
