-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- Create exam_progress table
CREATE TABLE IF NOT EXISTS public.exam_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  marks NUMERIC NOT NULL,
  total_marks NUMERIC NOT NULL,
  remarks TEXT
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes NUMERIC NOT NULL,
  questions JSONB NOT NULL,
  status TEXT NOT NULL
);

-- Create quiz_submissions table
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score NUMERIC NOT NULL,
  total_marks NUMERIC NOT NULL,
  submitted_at TEXT NOT NULL,
  marked BOOLEAN NOT NULL,
  teacher_remarks TEXT
);

-- Create homeworks table
CREATE TABLE IF NOT EXISTS public.homeworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "dueDate" TEXT NOT NULL,
  questions JSONB,
  "timeLimit" NUMERIC,
  status TEXT NOT NULL
);

-- Create homework_submissions table
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  homework_id UUID REFERENCES public.homeworks(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  content TEXT,
  answers JSONB,
  score NUMERIC,
  total_score NUMERIC,
  submitted_at TEXT NOT NULL,
  marked BOOLEAN NOT NULL,
  teacher_remarks TEXT,
  attachment_url TEXT
);

-- Create messages (announcements) table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_id UUID,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for the new tables
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for authenticated users (for simplicity in this app)
-- Note: In a production app, you would want more granular policies based on roles.
CREATE POLICY "Allow all operations for authenticated users on subjects" ON public.subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users on exam_progress" ON public.exam_progress FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users on quizzes" ON public.quizzes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users on quiz_submissions" ON public.quiz_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users on homeworks" ON public.homeworks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users on homework_submissions" ON public.homework_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users on messages" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow anonymous access if the app uses anonymous logins or public views
CREATE POLICY "Allow all operations for anon users on subjects" ON public.subjects FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon users on exam_progress" ON public.exam_progress FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon users on quizzes" ON public.quizzes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon users on quiz_submissions" ON public.quiz_submissions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon users on homeworks" ON public.homeworks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon users on homework_submissions" ON public.homework_submissions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon users on messages" ON public.messages FOR ALL TO anon USING (true) WITH CHECK (true);
