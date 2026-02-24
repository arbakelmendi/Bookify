import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function MyProfile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    navigate(`/friend/${user.id}`, {
      replace: true,
      state: { email: user.email, username: user.username },
    });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">Opening your profile...</div>
    </div>
  );
}
