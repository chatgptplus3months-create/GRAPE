
-- 🍇 GRAPE HUB - UNIFIED CORE INFRASTRUCTURE V7 (STITCH EDITION) 🍇

-- 1. Profiles (Identity Nodes)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    points INTEGER DEFAULT 0,
    completed_challenges INTEGER DEFAULT 0,
    avatar_url TEXT,
    class_name TEXT,
    skill_level TEXT DEFAULT 'Member Node',
    passkey TEXT DEFAULT '123456',
    badges JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Challenges (Mission Definitions)
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'Intermediate',
    points INTEGER DEFAULT 100,
    duration_days INTEGER DEFAULT 7, -- Default mission length
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RESET WORKFLOW TABLES (Ensures fresh start for the new linkage logic)
DROP TABLE IF EXISTS public.submissions;
DROP TABLE IF EXISTS public.mission_acceptances;

-- 4. Mission Acceptances (The Timer & Status Link)
CREATE TABLE public.mission_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deadline_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'reviewed'))
);

-- 5. Submissions (The Audit Hub - Unified for Missions and Events)
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_acceptance_id UUID REFERENCES public.mission_acceptances(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE, -- For event attendance
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    output_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'rejected', 'event_joined', 'event_pending', 'event_approved')),
    feedback TEXT,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 6. Events (Calendar Node)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    time TEXT,
    type TEXT DEFAULT 'Workshop',
    location TEXT DEFAULT 'Hub Lab',
    color TEXT DEFAULT '#790BFD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Messages (Communication Link)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 9. Global Access Policy (Standard for Development Hubs)
CREATE POLICY "Allow All" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.mission_acceptances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.messages FOR ALL USING (true) WITH CHECK (true);
