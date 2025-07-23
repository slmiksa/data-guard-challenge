
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginProps {
  setIsAuthenticated: (value: boolean) => void;
}

const AdminLogin = ({ setIsAuthenticated }: AdminLoginProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    
    // Simple password check - in production, use proper authentication
    if (password === "admin123") {
      setIsAuthenticated(true);
      navigate("/admin/dashboard");
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة التحكم",
      });
    } else {
      toast({
        title: "كلمة مرور خاطئة",
        description: "يرجى التحقق من كلمة المرور والمحاولة مرة أخرى",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen purple-gradient flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white/80 hover:text-white mb-4"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            العودة للصفحة الرئيسية
          </Button>
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">دخول الإدارة</CardTitle>
            <CardDescription className="text-white/80">
              يرجى إدخال كلمة مرور الإدارة للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة مرور الإدارة"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={isLoading || !password}
              className="w-full bg-white text-purple-600 hover:bg-white/90"
            >
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
