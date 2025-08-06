import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, AlertCircle, Users, Clock, Trophy, Target, Info, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
const Index = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [employeeData, setEmployeeData] = useState<{
    first_name: string;
    last_name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const searchEmployee = async (id: string) => {
    if (id.length !== 4) {
      setEmployeeData(null);
      return;
    }
    setIsSearching(true);
    try {
      const {
        data,
        error
      } = await supabase.from('employees').select('first_name, last_name').eq('employee_id', id).single();
      if (error) {
        console.error('Error searching employee:', error);
        setEmployeeData(null);
        return;
      }
      setEmployeeData(data);
    } catch (error) {
      console.error('Error searching employee:', error);
      setEmployeeData(null);
    } finally {
      setIsSearching(false);
    }
  };
  const handleEmployeeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 characters
    if (/^\d{0,4}$/.test(value)) {
      setEmployeeId(value);
    }
  };

  // Search for employee when ID changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (employeeId.length === 4) {
        searchEmployee(employeeId);
      } else {
        setEmployeeData(null);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [employeeId]);
  const handleStartQuiz = async () => {
    if (!employeeId.trim() || employeeId.length !== 4) {
      toast({
        title: "بيانات مطلوبة",
        description: "يرجى إدخال الرقم الوظيفي مكون من 4 أرقام",
        variant: "destructive"
      });
      return;
    }
    if (!employeeData) {
      toast({
        title: "موظف غير موجود",
        description: "الرقم الوظيفي المدخل غير موجود في النظام",
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
          employeeName: `${employeeData.first_name} ${employeeData.last_name}`,
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
            برنامج توعوي متقدم لموظفي شركة الوصل الوطنية لتحصيل ديون جهات التمويل
          </p>
          
          {/* Test Phases Note */}
          <Card className="bg-blue-50/90 backdrop-blur-sm border-blue-200/50 max-w-2xl mx-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 justify-center">
                <Info className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-800 text-lg">ملاحظة هامة</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-blue-700 text-center font-medium">الاختبار مقسم لثلاث مراحل (مبتدئ - متوسط - متقدم) مقسمة على ثلاث أسابيع,


يبدأ الاختبار من يوم (الخميس - الأربعاء )</p>
            </CardContent>
          </Card>

          {/* Current Test Level */}
          <Card className="bg-green-50/90 backdrop-blur-sm border-green-200/50 max-w-md mx-auto animate-pulse-brown">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 justify-center">
                <Target className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-semibold text-lg">مستوى الاختبار الحالي: متقدم</p>
              </div>
            </CardContent>
          </Card>
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
              يرجى إدخال رقمك الوظيفي لبدء الاختبار
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="employeeId" className="text-[#8B6914] font-medium">الرقم الوظيفي (4 أرقام)</Label>
              <Input id="employeeId" value={employeeId} onChange={handleEmployeeIdChange} placeholder="أدخل رقمك الوظيفي" className="border-[#8B6914]/30 focus:border-[#8B6914] focus:ring-[#8B6914] h-12 text-lg text-center" maxLength={4} inputMode="numeric" />
              <p className="text-sm text-[#8B6914]/60 text-center">
                {employeeId.length}/4 أرقام
              </p>
            </div>

            {/* Employee Welcome Message */}
            {employeeId.length === 4 && <div className="space-y-3">
                {isSearching ? <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B6914]"></div>
                    <p className="text-[#8B6914]/70 mt-2">جاري البحث...</p>
                  </div> : employeeData ? <Card className="bg-green-50/90 backdrop-blur-sm border-green-200/50">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <User className="h-5 w-5 text-green-600" />
                        <p className="text-green-800 font-semibold text-lg">
                          مرحباً {employeeData.first_name} {employeeData.last_name}
                        </p>
                      </div>
                    </CardContent>
                  </Card> : <Card className="bg-red-50/90 backdrop-blur-sm border-red-200/50">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-red-800 font-semibold">
                          الرقم الوظيفي غير موجود
                        </p>
                      </div>
                    </CardContent>
                  </Card>}
              </div>}

            <Button onClick={handleStartQuiz} disabled={isLoading || employeeId.length !== 4 || !employeeData} className="w-full bg-[#8B6914] text-white hover:bg-[#8B6914]/90 interactive-button h-12 text-lg font-medium">
              {isLoading ? "جاري التحقق..." : "بدء الاختبار"}
            </Button>
          </CardContent>
        </Card>

        {/* Admin Link */}
        <div className="text-center">
          
        </div>
      </div>
    </div>;
};
export default Index;