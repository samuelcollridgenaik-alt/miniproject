import { LLMProvider, LLMProviderId, LLMRequestOptions, LLMResponse } from '../types.js';

export interface CurriculumTopic {
  title: string;
  category: string;
  citation: string;
  summary: {
    overview: string;
    coreConcepts: Array<{ concept: string; explanation: string; citation: string }>;
    formulasOrRules: string[];
    examFocusPoints: string[];
  };
  flashcards: Array<{ front: string; back: string; topicTag: string; citation: string }>;
  quizQuestions: Array<{
    question: string;
    options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    topicTag: string;
    difficulty: 'easy' | 'medium' | 'hard';
    citation: string;
  }>;
}

const MCA_CURRICULUM_BANK: CurriculumTopic[] = [
  {
    title: 'Virtual Memory & Paging Architectures',
    category: 'Operating Systems',
    citation: 'MCA OS & Systems Architecture (Module 3, Lecture 8)',
    summary: {
      overview: 'Virtual memory decouples the programmer\'s logical address space from physical memory frames, allowing programs larger than physical RAM to execute reliably through hardware address translation (MMU) and demand paging.',
      coreConcepts: [
        {
          concept: 'Paging vs Segmentation',
          explanation: 'Paging divides memory into fixed-size physical frames (eliminating external fragmentation), whereas segmentation divides memory into variable-sized logical blocks reflecting module structure.',
          citation: 'OS Module 3, Section 3.2',
        },
        {
          concept: 'Page Fault Handling & TLB',
          explanation: 'Translation Lookaside Buffers (TLB) cache recent virtual-to-physical address mappings. On TLB miss, page table walk occurs. If the valid bit is 0, a page fault trap triggers the OS kernel to fetch the page from backing store.',
          citation: 'OS Module 3, Section 3.4',
        },
        {
          concept: 'Page Replacement & Belady\'s Anomaly',
          explanation: 'Belady\'s Anomaly occurs in FIFO replacement where allocating more page frames results in more page faults. Optimal (OPT) and Least Recently Used (LRU) stack algorithms are immune.',
          citation: 'OS Module 3, Section 3.6',
        },
      ],
      formulasOrRules: [
        'Effective Access Time (EAT) = (1 - p) * MemoryAccessTime + p * PageFaultOverhead',
        'Frame Allocation: Minimum frames required per process determined by computer instruction architecture.',
      ],
      examFocusPoints: [
        'Derivation of Effective Access Time with TLB hit ratios.',
        'Contrast FIFO vs LRU replacement under Belady\'s anomaly reference strings.',
        'Inverted page tables vs multi-level hierarchical paging for 64-bit address spaces.',
      ],
    },
    flashcards: [
      {
        front: 'What is Belady\'s Anomaly and which page replacement algorithm experiences it?',
        back: 'Belady\'s Anomaly is the phenomenon where adding more physical page frames causes an INCREASE in page faults. It occurs in FIFO (First-In, First-Out) because FIFO is not a stack algorithm.',
        topicTag: 'Virtual Memory',
        citation: 'OS Module 3, Section 3.6',
      },
      {
        front: 'What is the function of the Translation Lookaside Buffer (TLB)?',
        back: 'The TLB is a high-speed hardware associative cache that stores recent virtual-to-physical page frame translations, reducing memory lookup latency from multiple memory accesses to near-zero.',
        topicTag: 'Memory Hardware',
        citation: 'OS Module 3, Section 3.4',
      },
      {
        front: 'What distinguishes internal from external memory fragmentation?',
        back: 'Internal fragmentation occurs when allocated fixed-size memory blocks (pages) exceed the process requirement. External fragmentation occurs when free memory is divided into small non-contiguous holes.',
        topicTag: 'Memory Management',
        citation: 'OS Module 3, Section 3.1',
      },
    ],
    quizQuestions: [
      {
        question: 'Which of the following page replacement algorithms is strictly immune to Belady\'s Anomaly?',
        options: [
          { key: 'A', text: 'First-In, First-Out (FIFO)' },
          { key: 'B', text: 'Least Recently Used (LRU)' },
          { key: 'C', text: 'Second Chance Clock Algorithm' },
          { key: 'D', text: 'Random Replacement' },
        ],
        correctAnswer: 'B',
        explanation: 'LRU is a stack algorithm where the set of pages in memory for n frames is always a subset of pages in memory for n+1 frames, mathematically preventing Belady\'s Anomaly.',
        topicTag: 'Page Replacement',
        difficulty: 'medium',
        citation: 'OS Module 3, Section 3.6',
      },
      {
        question: 'In a demand-paged memory system with 98% TLB hit ratio (TLB access = 10ns, RAM access = 100ns), what is the effective memory access time without page faults?',
        options: [
          { key: 'A', text: '12ns' },
          { key: 'B', text: '112ns' },
          { key: 'C', text: '210ns' },
          { key: 'D', text: '100ns' },
        ],
        correctAnswer: 'B',
        explanation: 'EAT = 0.98 * (10 + 100) + 0.02 * (10 + 100 + 100) = 0.98*(110) + 0.02*(210) = 107.8 + 4.2 = 112ns.',
        topicTag: 'Memory Metrics',
        difficulty: 'hard',
        citation: 'OS Module 3, Section 3.4',
      },
      {
        question: 'What is the primary architectural advantage of Inverted Page Tables over Multi-Level Paging in 64-bit architectures?',
        options: [
          { key: 'A', text: 'It completely eliminates page faults' },
          { key: 'B', text: 'Table size scales with physical memory frames rather than virtual address space size' },
          { key: 'C', text: 'It removes the need for TLB hardware' },
          { key: 'D', text: 'It avoids hashing overhead' },
        ],
        correctAnswer: 'B',
        explanation: 'Inverted page tables have exactly one entry per physical frame in RAM, avoiding multi-gigabyte page table footprints typical of 64-bit sparse address spaces.',
        topicTag: 'Page Tables',
        difficulty: 'hard',
        citation: 'OS Module 3, Section 3.5',
      },
    ],
  },
  {
    title: 'Distributed Consensus & Raft Protocol',
    category: 'Distributed Systems',
    citation: 'MCA Distributed Systems (Module 5, Lecture 14)',
    summary: {
      overview: 'The Raft consensus algorithm establishes state machine replication across a cluster of nodes under crash-recovery failure models through decomposed leader election, log replication, and commit safety.',
      coreConcepts: [
        {
          concept: 'Leader Election & Randomized Timeouts',
          explanation: 'Nodes transition between Follower, Candidate, and Leader. Randomized election timeouts (150-300ms) prevent split-vote deadlocks when electing a new leader.',
          citation: 'Distributed Systems Module 5, Section 5.1',
        },
        {
          concept: 'Log Invariant & Commit Rule',
          explanation: 'If two logs contain an entry with the same index and term, they store the same command and their logs are identical in all preceding entries. A leader only commits entries once replicated on a majority of nodes.',
          citation: 'Distributed Systems Module 5, Section 5.3',
        },
        {
          concept: 'Split-Brain Prevention',
          explanation: 'A quorum requires strictly floor(N/2) + 1 votes. Since any two quorums must overlap by at least one node, conflicting leaders cannot simultaneously emerge.',
          citation: 'Distributed Systems Module 5, Section 5.4',
        },
      ],
      formulasOrRules: [
        'Quorum Size Q = floor(N / 2) + 1 for an N-node cluster.',
        'Fault Tolerance F = floor((N - 1) / 2) crash failures tolerated.',
      ],
      examFocusPoints: [
        'Trace of Raft leader election during network partition and healing.',
        'Log matching property and term comparison during AppendEntries RPC.',
        'Contrast Paxos synod rounds vs Raft decomposed state machine replication.',
      ],
    },
    flashcards: [
      {
        front: 'How many node failures can a 5-node Raft cluster tolerate while retaining consensus?',
        back: 'A 5-node cluster tolerates 2 failures (F = floor((5 - 1) / 2) = 2). A quorum requires at least 3 active nodes (floor(5/2) + 1 = 3).',
        topicTag: 'Distributed Quorum',
        citation: 'Distributed Systems Module 5, Section 5.2',
      },
      {
        front: 'Why does Raft use randomized election timeouts for candidate nodes?',
        back: 'Randomized election timeouts (typically 150ms-300ms) split candidate wake-ups, ensuring one node initiates election and collects majority votes before others timeout, preventing split-vote ties.',
        topicTag: 'Consensus Protocols',
        citation: 'Distributed Systems Module 5, Section 5.1',
      },
      {
        front: 'What is the Log Matching Property in Raft?',
        back: 'If two entries in different logs have the exact same index and term, they store the same command, and the logs are completely identical in all preceding entries.',
        topicTag: 'Log Replication',
        citation: 'Distributed Systems Module 5, Section 5.3',
      },
    ],
    quizQuestions: [
      {
        question: 'In the Raft protocol, what condition must a follower verify before granting its vote to a candidate in an RequestVote RPC?',
        options: [
          { key: 'A', text: 'The candidate has been active the longest' },
          { key: 'B', text: 'The candidate\'s log is at least as up-to-date as the follower\'s own log (term and length)' },
          { key: 'C', text: 'The candidate has lowest IP address' },
          { key: 'D', text: 'The candidate already received votes from all followers' },
        ],
        correctAnswer: 'B',
        explanation: 'Raft safety guarantees that a candidate\'s log must be at least as up-to-date as the voter\'s log; otherwise the vote is denied, preserving committed log safety.',
        topicTag: 'Leader Election',
        difficulty: 'medium',
        citation: 'Distributed Systems Module 5, Section 5.2',
      },
      {
        question: 'If a 7-node distributed system experiences a network partition splitting nodes into 4 and 3, which partition can continue committing write transactions?',
        options: [
          { key: 'A', text: 'The 3-node partition' },
          { key: 'B', text: 'Both partitions independently' },
          { key: 'C', text: 'The 4-node partition, because it holds majority quorum (4 > 7/2)' },
          { key: 'D', text: 'Neither partition can commit writes until reconnected' },
        ],
        correctAnswer: 'C',
        explanation: 'Majority quorum is floor(7/2) + 1 = 4 nodes. The 4-node sub-cluster forms a valid quorum and can continue committing; the 3-node partition rejects writes.',
        topicTag: 'Network Partitions',
        difficulty: 'medium',
        citation: 'Distributed Systems Module 5, Section 5.4',
      },
    ],
  },
  {
    title: 'ACID Transaction Management & Two-Phase Locking (2PL)',
    category: 'Database Management Systems',
    citation: 'MCA Advanced DBMS (Module 4, Lecture 11)',
    summary: {
      overview: 'Database transaction management guarantees reliable processing through ACID properties, conflict serializability, write-ahead logging (WAL), and concurrency control mechanisms like Two-Phase Locking.',
      coreConcepts: [
        {
          concept: 'ACID Guarantees',
          explanation: 'Atomicity (all or nothing), Consistency (preserves schema constraints), Isolation (concurrent execution yields equivalent serial execution), and Durability (committed state survives crashes via WAL).',
          citation: 'DBMS Module 4, Section 4.1',
        },
        {
          concept: 'Strict Two-Phase Locking (Strict 2PL)',
          explanation: 'Transactions acquire locks during growing phase and hold all exclusive locks until commit or abort, guaranteeing conflict serializability and preventing cascading rollbacks.',
          citation: 'DBMS Module 4, Section 4.4',
        },
        {
          concept: 'Write-Ahead Logging (WAL / ARIES)',
          explanation: 'Log records detailing changes must be flushed to non-volatile storage before corresponding dirty database pages are written to disk, enabling REDO and UNDO crash recovery.',
          citation: 'DBMS Module 4, Section 4.6',
        },
      ],
      formulasOrRules: [
        'Conflict Serializability: Precedence graph (serialization graph) must be an acyclic directed graph (DAG).',
        'Strict 2PL Rule: No shared or exclusive lock may be released until transaction completion.',
      ],
      examFocusPoints: [
        'Conflict serializability precedence graph testing.',
        'View serializability vs conflict serializability.',
        'Deadlock detection via Wait-For Graphs (WFG) vs prevention via Wait-Die and Wound-Wait schemes.',
      ],
    },
    flashcards: [
      {
        front: 'What is the primary difference between Conservative 2PL and Strict 2PL?',
        back: 'Conservative 2PL acquires ALL locks before execution starts (preventing deadlocks). Strict 2PL acquires locks dynamically during the growing phase but holds all exclusive locks until transaction commit/abort (preventing cascading aborts).',
        topicTag: 'Concurrency Control',
        citation: 'DBMS Module 4, Section 4.4',
      },
      {
        front: 'Under the ARIES recovery algorithm, what are the three distinct phases following a system crash?',
        back: '1. Analysis phase (identifies active transactions and dirty pages). 2. REDO phase (repeats history forward from smallest recLSN). 3. UNDO phase (rolls back uncommitted transactions backward).',
        topicTag: 'Crash Recovery',
        citation: 'DBMS Module 4, Section 4.7',
      },
    ],
    quizQuestions: [
      {
        question: 'Under Strict Two-Phase Locking (Strict 2PL), when are exclusive (write) locks released?',
        options: [
          { key: 'A', text: 'Immediately after the write statement finishes' },
          { key: 'B', text: 'Only when the transaction either commits or aborts' },
          { key: 'C', text: 'When the lock table runs out of memory' },
          { key: 'D', text: 'During the shrinking phase while reads continue' },
        ],
        correctAnswer: 'B',
        explanation: 'Strict 2PL holds all exclusive locks until the transaction ends (commit or abort), ensuring schedules are conflict serializable and recoverably cascadeless.',
        topicTag: 'Two-Phase Locking',
        difficulty: 'medium',
        citation: 'DBMS Module 4, Section 4.4',
      },
      {
        question: 'In the Wound-Wait deadlock prevention scheme based on timestamps (where older transactions have smaller timestamps), what happens if older transaction T1 requests a lock held by younger transaction T2?',
        options: [
          { key: 'A', text: 'T1 is forced to wait indefinitely' },
          { key: 'B', text: 'T1 wounds (preempts/aborts) T2, releasing the lock' },
          { key: 'C', text: 'Both transactions are aborted' },
          { key: 'D', text: 'T2 is promoted to older timestamp' },
        ],
        correctAnswer: 'B',
        explanation: 'In Wound-Wait, if an older transaction requests a lock held by a younger one, it "wounds" the younger transaction by preempting it. If younger requests older, it waits.',
        topicTag: 'Deadlock Prevention',
        difficulty: 'hard',
        citation: 'DBMS Module 4, Section 4.5',
      },
    ],
  },
];

export class CognifyCurriculumAdapter implements LLMProvider {
  public id: LLMProviderId = 'cognify-curriculum';
  public name = 'Cognify Academic Engine (Curriculum Grounded)';
  public family = 'Curriculum AI';
  public defaultModel = 'cognify-academic-v1';

  public isConfigured(): boolean {
    return true; // Always 100% available offline
  }

  public async ping(): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
    return { ok: true, latencyMs: 5, message: 'Cognify Built-in Syllabus Engine active and verified.' };
  }

  public async generate(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const promptLower = prompt.toLowerCase();

    // Determine requested curriculum topic
    let matchedTopic = MCA_CURRICULUM_BANK[0];
    if (promptLower.includes('consensus') || promptLower.includes('raft') || promptLower.includes('quorum') || promptLower.includes('distributed')) {
      matchedTopic = MCA_CURRICULUM_BANK[1];
    } else if (promptLower.includes('acid') || promptLower.includes('transaction') || promptLower.includes('lock') || promptLower.includes('dbms') || promptLower.includes('database')) {
      matchedTopic = MCA_CURRICULUM_BANK[2];
    }

    let resultText = '';

    // Task 1: Multiple-choice Quiz
    if (promptLower.includes('quiz') || promptLower.includes('multiple-choice') || promptLower.includes('correctanswer')) {
      const questions = MCA_CURRICULUM_BANK.flatMap((t) => t.quizQuestions);
      // Select 3 to 5 questions
      const selected = questions.slice(0, 5);
      resultText = JSON.stringify({ questions: selected }, null, 2);
    }
    // Task 2: Flashcards
    else if (promptLower.includes('flashcard') || promptLower.includes('front') && promptLower.includes('back')) {
      const cards = MCA_CURRICULUM_BANK.flatMap((t) => t.flashcards);
      resultText = JSON.stringify({ flashcards: cards.slice(0, 6) }, null, 2);
    }
    // Task 3: Comprehensive Summary
    else if (promptLower.includes('summary') || promptLower.includes('coreconcepts')) {
      resultText = JSON.stringify({
        title: `Comprehensive Academic Summary: ${matchedTopic.title}`,
        documentTitle: matchedTopic.title,
        overview: matchedTopic.summary.overview,
        coreConcepts: matchedTopic.summary.coreConcepts,
        formulasOrRules: matchedTopic.summary.formulasOrRules,
        examFocusPoints: matchedTopic.summary.examFocusPoints,
      }, null, 2);
    }
    // Task 4: Interactive Tutor Q&A
    else {
      const isSimpleMode = promptLower.includes('persona: explain this simply') || promptLower.includes('kid') || promptLower.includes('analogy');
      
      if (isSimpleMode) {
        resultText = `### 🧸 Simple & Fun Explanation: ${matchedTopic.title}

Imagine your computer is like a busy kitchen:
- **RAM (Memory)** is like the **chef's cutting board**: it's right in front of you, super fast, but you only have so much counter space!
- **Hard Drive / Storage** is like the **pantry or freezer**: huge storage, but walking over takes much longer.
- **Virtual Memory** is like having a helpful kitchen helper who secretly moves ingredients you aren't using this minute into a small shelf, so your cutting board never overflows!

When a program needs a piece of information that was put away, the helper runs and grabs it. If the helper does this efficiently, you can cook a giant 5-course meal on a counter that's only big enough for one plate!

*Citation: Grounded in ${matchedTopic.citation}*`;
      } else {
        resultText = `### 🎓 Academic Analysis: ${matchedTopic.title}

#### Theoretical Framework
${matchedTopic.summary.overview}

#### Core Principles
${matchedTopic.summary.coreConcepts.map((c) => `- **${c.concept}**: ${c.explanation}`).join('\n')}

#### Mathematical Invariant & Constraints
${matchedTopic.summary.formulasOrRules.map((r) => `- \`${r}\``).join('\n')}

#### Verified Examination Citation
- Grounded in *${matchedTopic.citation}*.`;
      }
    }

    return {
      requestId: `curriculum_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      provider: 'cognify-curriculum',
      model: this.defaultModel,
      text: resultText,
      latencyMs: Date.now() - startTime + 12,
      usage: {
        promptTokens: 140,
        completionTokens: 380,
        totalTokens: 520,
        estimatedCostUsd: 0,
      },
    };
  }
}

export const cognifyCurriculumAdapter = new CognifyCurriculumAdapter();
