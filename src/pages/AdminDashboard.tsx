import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Users, Trophy, Clock, TrendingUp, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  isAuthenticated: boolean;
}

interface EmployeeResult {
  id: string;
  employee_name: string;
  employee_id: string;
  score: number;
  percentage: number;
  passed: boolean;
  time_taken: number;
  created_at: string;
}

const AdminDashboard = ({ isAuthenticated }: AdminDashboardProps) => {
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<EmployeeResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    averageScore: 0,
    averageTime: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin");
      return;
    }
    fetchResults();
  }, [isAuthenticated, navigate]);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the data to ensure time_taken exists (default to 0 if missing)
      const mappedData = (data || []).map(item => ({
        ...item,
        time_taken: item.time_taken || 0
      }));

      setResults(mappedData);
      setFilteredResults(mappedData);
      calculateStats(mappedData);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل نتائج الاختبارات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: EmployeeResult[]) => {
    const total = data.length;
    const passed = data.filter(r => r.passed).length;
    const failed = total - passed;
    const averageScore = total > 0 ? data.reduce((sum, r) => sum + r.percentage, 0) / total : 0;
    const averageTime = total > 0 ? data.reduce((sum, r) => sum + r.time_taken, 0) / total : 0;

    setStats({
      total,
      passed,
      failed,
      averageScore,
      averageTime
    });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim() === "") {
      setFilteredResults(results);
    } else {
      const filtered = results.filter(result =>
        result.employee_name.toLowerCase().includes(value.toLowerCase()) ||
        result.employee_id.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  };

  const exportToExcel = () => {
    const exportData = filteredResults.map(result => ({
      'اسم الموظف': result.employee_name,
      'الرقم الوظيفي': result.employee_id,
      'الدرجة': result.score,
      'النسبة المئوية': `${result.percentage.toFixed(1)}%`,
      'النتيجة': result.passed ? 'نجح' : 'لم ينجح',
      'الوقت المستغرق': `${Math.floor(result.time_taken / 60)}:${(result.time_taken % 60).toString().padStart(2, '0')}`,
      'تاريخ الاختبار': new Date(result.created_at).toLocaleDateString('ar-SA'),
      'وقت الاختبار': new Date(result.created_at).toLocaleTimeString('ar-SA')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'نتائج الاختبار');
    XLSX.writeFile(workbook, `نتائج_اختبار_الوعي_الأمني_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير النتائج إلى ملف Excel",
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    navigate("/admin");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen gold-gradient p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4 space-x-reverse">
            <img 
              src="/lovable-uploads/e61a43b1-324b-43cf-9acc-dee57e84a52a.png" 
              alt="شعار الوصل" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                لوحة تحكم الإدارة
              </h1>
              <p className="text-white/90">
                إدارة نتائج اختبار الوعي الأمني
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-white/10 text-white border-white/30 hover:bg-white/20"
          >
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">إجمالي المتقدمين</CardTitle>
              <Users className="h-4 w-4 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">الناجحون</CardTitle>
              <Trophy className="h-4 w-4 text-green-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-300">{stats.passed}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">غير الناجحين</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-300">{stats.failed}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">متوسط الدرجات</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-300">{stats.averageScore.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">متوسط الوقت</CardTitle>
              <Clock className="h-4 w-4 text-blue-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-300">{formatTime(Math.round(stats.averageTime))}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Export */}
        <Card className="bg-white/15 backdrop-blur-sm border-white/20">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-white text-xl">نتائج الاختبارات</CardTitle>
                <CardDescription className="text-white/80">
                  عرض وإدارة جميع نتائج اختبارات الوعي الأمني
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-white/60" />
                  <Input
                    placeholder="بحث بالاسم أو الرقم الوظيفي"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 pr-10 w-64"
                  />
                </div>
                <Button
                  onClick={exportToExcel}
                  className="bg-white text-primary hover:bg-white/90 interactive-button"
                >
                  <Download className="h-4 w-4 ml-2" />
                  تصدير Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-white/5 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white font-medium">اسم الموظف</TableHead>
                    <TableHead className="text-white font-medium">الرقم الوظيفي</TableHead>
                    <TableHead className="text-white font-medium">الدرجة</TableHead>
                    <TableHead className="text-white font-medium">النسبة المئوية</TableHead>
                    <TableHead className="text-white font-medium">النتيجة</TableHead>
                    <TableHead className="text-white font-medium">الوقت المستغرق</TableHead>
                    <TableHead className="text-white font-medium">تاريخ الاختبار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-white/80 py-8">
                        جاري التحميل...
                      </TableCell>
                    </TableRow>
                  ) : filteredResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-white/80 py-8">
                        لا توجد نتائج
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResults.map((result) => (
                      <TableRow key={result.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white font-medium">{result.employee_name}</TableCell>
                        <TableCell className="text-white">{result.employee_id}</TableCell>
                        <TableCell className="text-white">{result.score} / 15</TableCell>
                        <TableCell className="text-white font-medium">{result.percentage.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge variant={result.passed ? "default" : "destructive"}>
                            {result.passed ? "نجح" : "لم ينجح"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white timer-display">{formatTime(result.time_taken)}</TableCell>
                        <TableCell className="text-white">
                          <div className="text-sm">
                            <div>{new Date(result.created_at).toLocaleDateString('ar-SA')}</div>
                            <div className="text-white/70">{new Date(result.created_at).toLocaleTimeString('ar-SA')}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
