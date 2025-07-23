import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, AlertCircle, Users, Clock, Trophy, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
const Index = () => {
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const handleStartQuiz = async () => {
    if (!employeeName.trim() || !employeeId.trim()) {
      toast({
        title: "بيانات مطلوبة",
        description: "يرجى إدخال الاسم الثلاثي والرقم الوظيفي",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      // Check if employee has already taken the test
      const {
        data: existingResult,
        error
      } = await supabase.from('employee_results').select('*').eq('employee_id', employeeId).single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (existingResult) {
        // Handle time_taken safely - default to 0 if missing
        const timeTaken = existingResult.time_taken || 0;
        const timeMinutes = Math.floor(timeTaken / 60);
        const timeSeconds = timeTaken % 60;
        toast({
          title: "تم إجراء الاختبار مسبقاً",
          description: `لقد أجريت الاختبار بالفعل وحصلت على ${existingResult.percentage}% في ${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}`,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Navigate to quiz with employee data
      navigate("/quiz", {
        state: {
          employeeName: employeeName.trim(),
          employeeId: employeeId.trim()
        }
      });
    } catch (error) {
      console.error('Error checking employee:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحقق من البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen gold-gradient flex items-center justify-center p-4 bg-yellow-50">
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-6 bg-white/20 backdrop-blur-sm rounded-full animate-pulse-gold">
              <img src="/lovable-uploads/e61a43b1-324b-43cf-9acc-dee57e84a52a.png" alt="شعار الوصل" className="h-20 w-20 object-contain" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">
            اختبار الوعي الأمني
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            برنامج توعوي متقدم لموظفي شركة الوصل الوطنية لتحصيل الديون
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
            <CardHeader className="text-center">
              <Trophy className="h-12 w-12 text-yellow-300 mx-auto mb-2" />
              <CardTitle className="text-white">15 سؤال</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-center text-sm">
                تقييم شامل لقياس مستوى الوعي الأمني
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
            <CardHeader className="text-center">
              <Target className="h-12 w-12 text-green-300 mx-auto mb-2" />
              <CardTitle className="text-white">70% للنجاح</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-center text-sm">
                يجب الحصول على 70% أو أكثر لاجتياز الاختبار
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 text-blue-300 mx-auto mb-2" />
              <CardTitle className="text-white">مؤقت تفاعلي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-center text-sm">
                قياس الوقت المستغرق في الاختبار
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-red-300 mx-auto mb-2" />
              <CardTitle className="text-white">محاولة واحدة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-center text-sm">
                لا يمكن إعادة الاختبار بعد المحاولة الأولى
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Start Quiz Form */}
        <Card className="bg-white/15 backdrop-blur-sm border-white/20 max-w-md mx-auto interactive-card">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">ابدأ الاختبار</CardTitle>
            <CardDescription className="text-white/80">
              يرجى إدخال بياناتك لبدء الاختبار
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-white font-medium">الاسم الثلاثي</Label>
              <Input id="name" value={employeeName} onChange={e => setEmployeeName(e.target.value)} placeholder="أدخل اسمك الثلاثي" className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-12 text-lg" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="employeeId" className="text-white font-medium">الرقم الوظيفي</Label>
              <Input id="employeeId" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="أدخل رقمك الوظيفي" className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-12 text-lg" />
            </div>
            <Button onClick={handleStartQuiz} disabled={isLoading} className="w-full bg-white text-primary hover:bg-white/90 interactive-button h-12 text-lg font-medium">
              {isLoading ? "جاري التحقق..." : "بدء الاختبار"}
            </Button>
          </CardContent>
        </Card>

        {/* Admin Link */}
        <div className="text-center">
          <Button variant="link" onClick={() => navigate("/admin")} className="text-white/80 hover:text-white text-lg">
            دخول الإدارة
          </Button>
        </div>
      </div>
    </div>;
};
export default Index;