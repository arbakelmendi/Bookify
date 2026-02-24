import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Github, Twitter, Instagram, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { subscribeNewsletter } from "@/api/newsletter";

export const Footer = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubscribe = async () => {
    const value = email.trim();
    if (!value) return;

    try {
      setSaving(true);
      await subscribeNewsletter(value);
      setEmail("");
      toast({ title: "Subscribed", description: "Email u ruajt me sukses." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to subscribe.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-xl font-display font-bold text-foreground">Bookify</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your personal library in the cloud. Discover, read, and share your favorite books.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Github className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Discover
                </Link>
              </li>
              <li>
                <Link to="/library" className="text-muted-foreground hover:text-foreground transition-colors">
                  My Library
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/friends" className="text-muted-foreground hover:text-foreground transition-colors">
                  Friends
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/?category=Programming" className="text-muted-foreground hover:text-foreground transition-colors">
                  Programming
                </Link>
              </li>
              <li>
                <Link to="/?category=Thriller" className="text-muted-foreground hover:text-foreground transition-colors">
                  Thriller
                </Link>
              </li>
              <li>
                <Link to="/?category=Self-Help" className="text-muted-foreground hover:text-foreground transition-colors">
                  Self-Help
                </Link>
              </li>
              <li>
                <Link to="/?category=Mystery" className="text-muted-foreground hover:text-foreground transition-colors">
                  Mystery
                </Link>
              </li>
              <li>
                <Link to="/?category=Horror" className="text-muted-foreground hover:text-foreground transition-colors">
                  Horror
                </Link>
              </li>
              <li>
                <Link to="/?category=Classic" className="text-muted-foreground hover:text-foreground transition-colors">
                  Classic
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1 space-y-4">
            <h4 className="font-semibold text-foreground">Stay Updated</h4>
            <p className="text-sm text-muted-foreground">
              Get notified about new releases and reading recommendations.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSubscribe();
                  }
                }}
              />
              <Button size="icon" onClick={() => void handleSubscribe()} disabled={saving}>
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Bookify. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
