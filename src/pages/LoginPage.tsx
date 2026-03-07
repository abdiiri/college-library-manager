import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "@/context/LibraryContext";
import { Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useLibrary();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (login(username, password)) {
      navigate("/dashboard");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary/5">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Library className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">LibraTrack</h1>
          <p className="text-muted-foreground mt-1">College Library Management System</p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-8">
          <h2 className="font-heading text-xl font-bold mb-6 text-center">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mt-1"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-md bg-muted">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Demo Credentials:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium">Admin:</span> admin / admin123</p>
              <p><span className="font-medium">Librarian:</span> librarian / lib123</p>
              <p><span className="font-medium">Student:</span> student / stu123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
