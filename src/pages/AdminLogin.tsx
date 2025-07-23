
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginProps {
  setIsAuthenticated: (authenticated: boolean) => void;
}

const AdminLogin = ({ setIsAuthenticated }: AdminLoginProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple password check
    if (password === "admin123") {
      setIsAuthenticated(true);
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة التحكم",
      });
      navigate("/admin/dashboard");
    } else {
      toast({
        title: "كلمة مرور خاطئة",
        description: "يرجى إدخال كلمة المرور الصحيحة",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gold-gradient flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white/20 rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-white text-2xl font-bold">دخول الإدارة</CardTitle>
          <CardDescription className="text-white/80">
            لوحة تحكم نتائج اختبار الوعي الأمني
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="password" className="text-white font-medium">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-white/60" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-12 pr-10"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-primary hover:bg-white/90 interactive-button h-12 text-lg font-medium"
            >
              {isLoading ? "جاري التحقق..." : "دخول"}
            </Button>
          </form>
          <div className="text-center mt-6">
            <Button
              variant="link"
              onClick={() => navigate("/")}
              className="text-white/80 hover:text-white"
            >
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
