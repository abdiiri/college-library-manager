
-- Create book_requests table
CREATE TABLE public.book_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  review_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;

-- Students can insert their own requests
CREATE POLICY "Students can create requests"
ON public.book_requests FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

-- Students can view their own requests
CREATE POLICY "Students can view own requests"
ON public.book_requests FOR SELECT TO authenticated
USING (student_id = auth.uid());

-- Librarians can view all requests
CREATE POLICY "Librarians can view all requests"
ON public.book_requests FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'librarian'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Librarians can update requests (approve/decline)
CREATE POLICY "Librarians can update requests"
ON public.book_requests FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'librarian'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all requests
CREATE POLICY "Admins can manage requests"
ON public.book_requests FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
