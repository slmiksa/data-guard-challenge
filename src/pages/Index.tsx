
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, AlertCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStartQuiz = async () => {
    if (!employeeName.trim() || !employeeId.trim()) {
      toast({
        title: "بيانات مطلوبة",
        description: "يرجى إدخال الاسم الثلاثي والرقم الوظيفي",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if employee has already taken the test
      const { data: existingResult, error } = await supabase
        .from('employee_results')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existingResult) {
        toast({
          title: "تم إجراء الاختبار مسبقاً",
          description: `لقد أجريت الاختبار بالفعل وحصلت على ${existingResult.percentage}%`,
          variant: "destructive",
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
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen purple-gradient flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-white/20 rounded-full">
              <Shield className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">
            اختبار أمن المعلومات وحماية البيانات
          </h1>
          <p className="text-xl text-white/90">
            برنامج توعوي لموظفي شركة تحصيل الديون
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
              <CardTitle className="text-white">تقييم شامل</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-center">
                15 سؤال اختيار من متعدد لقياس مستوى الوعي الأمني
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
              <CardTitle className="text-white">معايير النجاح</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-center">
                يجب الحصول على 70% أو أكثر لاجتياز الاختبار
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-blue-400 mx-auto mb-2" />
              <CardTitle className="text-white">محاولة واحدة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-center">
                لا يمكن إعادة الاختبار بعد المحاولة الأولى
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Start Quiz Form */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-white">ابدأ الاختبار</CardTitle>
            <CardDescription className="text-white/80">
              يرجى إدخال بياناتك لبدء الاختبار
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">الاسم الثلاثي</Label>
              <Input
                id="name"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="أدخل اسمك الثلاثي"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId" className="text-white">الرقم الوظيفي</Label>
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="أدخل رقمك الوظيفي"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
            </div>
            <Button 
              onClick={handleStartQuiz}
              disabled={isLoading}
              className="w-full bg-white text-purple-600 hover:bg-white/90"
            >
              {isLoading ? "جاري التحقق..." : "بدء الاختبار"}
            </Button>
          </CardContent>
        </Card>

        {/* Admin Link */}
        <div className="text-center">
          <Button
            variant="link"
            onClick={() => navigate("/admin")}
            className="text-white/80 hover:text-white"
          >
            دخول الإدارة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
