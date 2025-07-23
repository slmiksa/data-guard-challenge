
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Users, TrendingUp, Award, AlertTriangle } from "lucide-react";
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
  created_at: string;
}

const AdminDashboard = ({ isAuthenticated }: AdminDashboardProps) => {
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<EmployeeResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin");
      return;
    }
    fetchResults();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const filtered = results.filter(result => 
      result.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.employee_id.includes(searchTerm)
    );
    setFilteredResults(filtered);
  }, [searchTerm, results]);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل نتائج الموظفين",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    const exportData = filteredResults.map(result => ({
      'الاسم': result.employee_name,
      'الرقم الوظيفي': result.employee_id,
      'الدرجة': `${result.score}/15`,
      'النسبة المئوية': `${result.percentage.toFixed(1)}%`,
      'النتيجة': result.passed ? 'نجح' : 'لم ينجح',
      'التاريخ': new Date(result.created_at).toLocaleDateString('ar-SA'),
      'الوقت': new Date(result.created_at).toLocaleTimeString('ar-SA')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'نتائج الاختبار');
    XLSX.writeFile(wb, `نتائج_اختبار_أمن_المعلومات_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "تم تصدير البيانات",
      description: "تم تصدير النتائج إلى ملف Excel بنجاح",
    });
  };

  const stats = {
    totalEmployees: results.length,
    passedEmployees: results.filter(r => r.passed).length,
    failedEmployees: results.filter(r => !r.passed).length,
    averageScore: results.length > 0 ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1) : 0
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen purple-gradient p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">لوحة تحكم الإدارة</h1>
            <p className="text-white/80">نتائج اختبار أمن المعلومات</p>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="bg-white/10 text-white border-white/30 hover:bg-white/20"
          >
            العودة للصفحة الرئيسية
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">إجمالي الموظفين</CardTitle>
              <Users className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalEmployees}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">الناجحون</CardTitle>
              <Award className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.passedEmployees}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">غير الناجحين</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats.failedEmployees}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">المتوسط العام</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.averageScore}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              <CardTitle className="text-white">نتائج الموظفين</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <Input
                    placeholder="البحث بالاسم أو الرقم الوظيفي..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>
                <Button
                  onClick={exportToExcel}
                  className="bg-white text-purple-600 hover:bg-white/90"
                  disabled={filteredResults.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  تصدير إلى Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-white">جاري تحميل البيانات...</div>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-white/80">لا توجد نتائج</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead className="text-white">الاسم</TableHead>
                      <TableHead className="text-white">الرقم الوظيفي</TableHead>
                      <TableHead className="text-white">الدرجة</TableHead>
                      <TableHead className="text-white">النسبة المئوية</TableHead>
                      <TableHead className="text-white">النتيجة</TableHead>
                      <TableHead className="text-white">التاريخ</TableHead>
                      <TableHead className="text-white">الوقت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.id} className="border-white/20 hover:bg-white/5">
                        <TableCell className="text-white">{result.employee_name}</TableCell>
                        <TableCell className="text-white">{result.employee_id}</TableCell>
                        <TableCell className="text-white">{result.score}/15</TableCell>
                        <TableCell className="text-white">{result.percentage.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge 
                            variant={result.passed ? "default" : "destructive"}
                            className={result.passed ? "bg-green-500" : "bg-red-500"}
                          >
                            {result.passed ? "نجح" : "لم ينجح"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">
                          {new Date(result.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell className="text-white">
                          {new Date(result.created_at).toLocaleTimeString('ar-SA')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
