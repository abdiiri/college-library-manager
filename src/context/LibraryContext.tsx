import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export type UserRole = "admin" | "librarian" | "student";

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  quantity: number;
  available: number;
}

export interface Member {
  id: string;
  member_id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  active: boolean;
  user_id: string | null;
}

export interface Transaction {
  id: string;
  member_id: string;
  member_name: string;
  book_id: string;
  book_title: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  fine: number;
  status: string;
  created_at: string;
}

interface LibraryContextType {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  books: Book[];
  members: Member[];
  transactions: Transaction[];
  refreshBooks: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  issueBook: (memberId: string, bookId: string, dueDate: string) => Promise<boolean>;
  returnBook: (transactionId: string) => Promise<{ fine: number } | null>;
  signOut: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

const FINE_PER_DAY = 1.0;

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
        setBooks([]);
        setMembers([]);
        setTransactions([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", userId)
      .single();

    if (data && !error) {
      setProfile(data as UserProfile);
      // Fetch data after profile is loaded
      await Promise.all([fetchBooks(), fetchMembers(), fetchTransactions()]);
    }
    setLoading(false);
  };

  const fetchBooks = async () => {
    const { data } = await supabase.from("books").select("*").order("title");
    if (data) setBooks(data as Book[]);
  };

  const fetchMembers = async () => {
    const { data } = await supabase.from("members").select("*").order("name");
    if (data) setMembers(data as Member[]);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
    if (data) setTransactions(data as Transaction[]);
  };

  const issueBook = async (memberId: string, bookId: string, dueDate: string): Promise<boolean> => {
    const book = books.find((b) => b.id === bookId);
    const member = members.find((m) => m.id === memberId);
    if (!book || book.available <= 0 || !member) return false;

    const { error: txError } = await supabase.from("transactions").insert({
      member_id: memberId,
      member_name: member.name,
      book_id: bookId,
      book_title: book.title,
      due_date: dueDate,
      status: "borrowed",
    } as any);

    if (txError) return false;

    await supabase.from("books").update({ available: book.available - 1 } as any).eq("id", bookId);
    await Promise.all([fetchBooks(), fetchTransactions()]);
    return true;
  };

  const returnBook = async (transactionId: string): Promise<{ fine: number } | null> => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.return_date) return null;

    const today = new Date();
    const due = new Date(tx.due_date);
    let fine = 0;
    if (today > due) {
      const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      fine = diffDays * FINE_PER_DAY;
    }

    const returnDate = today.toISOString().split("T")[0];

    await supabase.from("transactions").update({
      return_date: returnDate,
      fine,
      status: "returned",
    } as any).eq("id", transactionId);

    const book = books.find((b) => b.id === tx.book_id);
    if (book) {
      await supabase.from("books").update({ available: book.available + 1 } as any).eq("id", tx.book_id);
    }

    await Promise.all([fetchBooks(), fetchTransactions()]);
    return { fine };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <LibraryContext.Provider
      value={{
        session, profile, loading,
        books, members, transactions,
        refreshBooks: fetchBooks,
        refreshMembers: fetchMembers,
        refreshTransactions: fetchTransactions,
        issueBook, returnBook, signOut,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
