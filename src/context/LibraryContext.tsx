import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "librarian" | "member";

export interface User {
  id: string;
  username: string;
  name: string;
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
  memberId: string;
  name: string;
  email: string;
  phone: string;
  type: "student" | "staff";
  active: boolean;
}

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  bookId: string;
  bookTitle: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  fine: number;
  status: "borrowed" | "returned" | "overdue";
}

interface LibraryContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  issueBook: (memberId: string, bookId: string, dueDate: string) => boolean;
  returnBook: (transactionId: string) => { fine: number } | null;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

const USERS: User[] = [
  { id: "1", username: "admin", name: "Administrator", role: "admin" },
  { id: "2", username: "librarian", name: "Jane Librarian", role: "librarian" },
  { id: "3", username: "student", name: "John Student", role: "member" },
];

const PASSWORDS: Record<string, string> = {
  admin: "admin123",
  librarian: "lib123",
  student: "stu123",
};

const initialBooks: Book[] = [
  { id: "1", title: "Introduction to Algorithms", author: "Thomas H. Cormen", category: "Computer Science", isbn: "978-0262033848", quantity: 5, available: 3 },
  { id: "2", title: "Database System Concepts", author: "Abraham Silberschatz", category: "Computer Science", isbn: "978-0078022159", quantity: 3, available: 2 },
  { id: "3", title: "Calculus: Early Transcendentals", author: "James Stewart", category: "Mathematics", isbn: "978-1285741550", quantity: 4, available: 4 },
  { id: "4", title: "Physics for Scientists", author: "Raymond Serway", category: "Physics", isbn: "978-1133947271", quantity: 3, available: 1 },
  { id: "5", title: "Organic Chemistry", author: "Paula Bruice", category: "Chemistry", isbn: "978-0134042282", quantity: 2, available: 2 },
  { id: "6", title: "Engineering Mechanics", author: "J.L. Meriam", category: "Engineering", isbn: "978-1118885833", quantity: 3, available: 3 },
];

const initialMembers: Member[] = [
  { id: "1", memberId: "STU001", name: "John Student", email: "john@college.edu", phone: "555-0101", type: "student", active: true },
  { id: "2", memberId: "STU002", name: "Alice Smith", email: "alice@college.edu", phone: "555-0102", type: "student", active: true },
  { id: "3", memberId: "STF001", name: "Dr. Robert Brown", email: "robert@college.edu", phone: "555-0201", type: "staff", active: true },
  { id: "4", memberId: "STU003", name: "Maria Garcia", email: "maria@college.edu", phone: "555-0103", type: "student", active: false },
];

const initialTransactions: Transaction[] = [
  { id: "1", memberId: "1", memberName: "John Student", bookId: "1", bookTitle: "Introduction to Algorithms", issueDate: "2026-02-20", dueDate: "2026-03-06", returnDate: null, fine: 0, status: "overdue" },
  { id: "2", memberId: "2", memberName: "Alice Smith", bookId: "4", bookTitle: "Physics for Scientists", issueDate: "2026-03-01", dueDate: "2026-03-15", returnDate: null, fine: 0, status: "borrowed" },
  { id: "3", memberId: "3", memberName: "Dr. Robert Brown", bookId: "2", bookTitle: "Database System Concepts", issueDate: "2026-02-15", dueDate: "2026-03-01", returnDate: "2026-02-28", fine: 0, status: "returned" },
];

const FINE_PER_DAY = 1.0;

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const login = (username: string, password: string): boolean => {
    const found = USERS.find((u) => u.username === username);
    if (found && PASSWORDS[username] === password) {
      setUser(found);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const issueBook = (memberId: string, bookId: string, dueDate: string): boolean => {
    const book = books.find((b) => b.id === bookId);
    if (!book || book.available <= 0) return false;

    const member = members.find((m) => m.id === memberId);
    if (!member) return false;

    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, available: b.available - 1 } : b))
    );

    const newTx: Transaction = {
      id: String(Date.now()),
      memberId,
      memberName: member.name,
      bookId,
      bookTitle: book.title,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate,
      returnDate: null,
      fine: 0,
      status: "borrowed",
    };

    setTransactions((prev) => [newTx, ...prev]);
    return true;
  };

  const returnBook = (transactionId: string): { fine: number } | null => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.returnDate) return null;

    const today = new Date();
    const due = new Date(tx.dueDate);
    let fine = 0;
    if (today > due) {
      const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      fine = diffDays * FINE_PER_DAY;
    }

    const returnDate = today.toISOString().split("T")[0];

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId ? { ...t, returnDate, fine, status: "returned" as const } : t
      )
    );

    setBooks((prev) =>
      prev.map((b) => (b.id === tx.bookId ? { ...b, available: b.available + 1 } : b))
    );

    return { fine };
  };

  return (
    <LibraryContext.Provider
      value={{ user, login, logout, books, setBooks, members, setMembers, transactions, setTransactions, issueBook, returnBook }}
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
