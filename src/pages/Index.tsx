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
        const timeTaken = (existingResult as any).time_taken || 0;
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
  return <div className="min-h-screen brown-gradient flex items-center justify-center p-4">
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            
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
          <Card className="bg-white/90 backdrop-blur-sm border-[#8B6914]/30 interactive-card">
            <CardHeader className="text-center">
              <Trophy className="h-12 w-12 text-[#8B6914] mx-auto mb-2" />
              <CardTitle className="text-[#8B6914] text-lg">15 سؤال</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B6914]/80 text-center text-sm">
                تقييم شامل لقياس مستوى الوعي الأمني
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-[#8B6914]/30 interactive-card">
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 text-[#8B6914] mx-auto mb-2" />
              <CardTitle className="text-[#8B6914] text-lg">مؤقت تفاعلي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B6914]/80 text-center text-sm">
                قياس الوقت المستغرق في الاختبار
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-[#8B6914]/30 interactive-card">
            <CardHeader className="text-center">
              <Target className="h-12 w-12 text-[#8B6914] mx-auto mb-2" />
              <CardTitle className="text-[#8B6914] text-lg">70% للنجاح</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B6914]/80 text-center text-sm">
                يجب الحصول على 70% أو أكثر لاجتياز الاختبار
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-[#8B6914]/30 interactive-card">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-[#8B6914] mx-auto mb-2" />
              <CardTitle className="text-[#8B6914] text-lg">محاولة واحدة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B6914]/80 text-center text-sm">
                لا يمكن إعادة الاختبار بعد المحاولة الأولى
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Start Quiz Form */}
        <Card className="bg-white/90 backdrop-blur-sm border-[#8B6914]/30 max-w-md mx-auto interactive-card">
          <CardHeader className="text-center">
            <CardTitle className="text-[#8B6914] text-2xl">ابدأ الاختبار</CardTitle>
            <CardDescription className="text-[#8B6914]/80">
              يرجى إدخال بياناتك لبدء الاختبار
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[#8B6914] font-medium">الاسم الثلاثي</Label>
              <Input id="name" value={employeeName} onChange={e => setEmployeeName(e.target.value)} placeholder="أدخل اسمك الثلاثي" className="border-[#8B6914]/30 focus:border-[#8B6914] focus:ring-[#8B6914] h-12 text-lg" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="employeeId" className="text-[#8B6914] font-medium">الرقم الوظيفي</Label>
              <Input id="employeeId" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="أدخل رقمك الوظيفي" className="border-[#8B6914]/30 focus:border-[#8B6914] focus:ring-[#8B6914] h-12 text-lg" />
            </div>
            <Button onClick={handleStartQuiz} disabled={isLoading} className="w-full bg-[#8B6914] text-white hover:bg-[#8B6914]/90 interactive-button h-12 text-lg font-medium">
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