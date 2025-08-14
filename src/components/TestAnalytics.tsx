import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, AlertTriangle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmployeeTestData {
  employee_id: string;
  employee_name: string;
  tests: {
    test_number: number;
    score: number;
    percentage: number;
    passed: boolean;
    created_at: string;
  }[];
  total_tests: number;
  all_passed: boolean;
  average_score: number;
}

interface Employee {
  employee_id: string;
  first_name: string;
  last_name: string;
}

const TestAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<EmployeeTestData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    allTestsPassed: 0,
    partialTests: 0,
    completedNotPassed: 0,
    totalEmployees: 0,
    averagePerformance: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('employee_id, first_name, last_name');

      if (employeesError) throw employeesError;

      // Fetch all test results
      const { data: resultsData, error: resultsError } = await supabase
        .from('employee_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (resultsError) throw resultsError;

      setEmployees(employeesData || []);
      
      // Process analytics data
      const processedData = processTestData(resultsData || [], employeesData || []);
      setAnalyticsData(processedData);
      calculateAnalyticsStats(processedData);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات التحليلات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processTestData = (results: any[], employees: Employee[]): EmployeeTestData[] => {
    // Group results by employee_id
    const groupedResults = results.reduce((acc, result) => {
      if (!acc[result.employee_id]) {
        acc[result.employee_id] = [];
      }
      acc[result.employee_id].push(result);
      return acc;
    }, {} as Record<string, any[]>);

    // Process each employee's data
    const processedData: EmployeeTestData[] = [];

    // Process employees who have taken tests
    Object.entries(groupedResults).forEach(([employeeId, tests]: [string, any[]]) => {
      const employee = employees.find(emp => emp.employee_id === employeeId);
      const employeeName = employee 
        ? `${employee.first_name} ${employee.last_name}`
        : tests[0]?.employee_name || employeeId;

      // Sort tests by creation date and remove true duplicates only
      const sortedTests = tests.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // Only remove exact duplicates (same score, percentage, date, and time)
      const uniqueTests = sortedTests.filter((test, index, self) => {
        return index === self.findIndex(t => 
          t.score === test.score && 
          t.percentage === test.percentage && 
          t.created_at === test.created_at
        );
      });

      const testData = uniqueTests.map((test, index) => ({
        test_number: index + 1,
        score: test.score,
        percentage: test.percentage,
        passed: test.passed,
        created_at: test.created_at
      }));

      const totalTests = testData.length;
      const allPassed = testData.every(test => test.passed);
      const averageScore = testData.reduce((sum, test) => sum + test.percentage, 0) / totalTests;

      processedData.push({
        employee_id: employeeId,
        employee_name: employeeName,
        tests: testData,
        total_tests: totalTests,
        all_passed: allPassed,
        average_score: averageScore
      });
    });

    // Add employees who haven't taken any tests
    employees.forEach(employee => {
      if (!groupedResults[employee.employee_id]) {
        processedData.push({
          employee_id: employee.employee_id,
          employee_name: `${employee.first_name} ${employee.last_name}`,
          tests: [],
          total_tests: 0,
          all_passed: false,
          average_score: 0
        });
      }
    });

    return processedData.sort((a, b) => {
      // First priority: those who passed all 3 tests
      if (a.all_passed && a.total_tests >= 3 && (!b.all_passed || b.total_tests < 3)) return -1;
      if (b.all_passed && b.total_tests >= 3 && (!a.all_passed || a.total_tests < 3)) return 1;
      
      // Second priority: those who took 3 tests (regardless of passing)
      if (a.total_tests >= 3 && b.total_tests < 3) return -1;
      if (b.total_tests >= 3 && a.total_tests < 3) return 1;
      
      // Third priority: by average score
      return b.average_score - a.average_score;
    });
  };

  const calculateAnalyticsStats = (data: EmployeeTestData[]) => {
    const allTestsPassed = data.filter(emp => emp.all_passed && emp.total_tests >= 3).length;
    const partialTests = data.filter(emp => emp.total_tests > 0 && emp.total_tests < 3).length;
    const completedNotPassed = data.filter(emp => emp.total_tests >= 3 && !emp.all_passed).length;
    const totalEmployees = data.length;
    const employeesWithTests = data.filter(emp => emp.total_tests > 0);
    const averagePerformance = employeesWithTests.length > 0 
      ? employeesWithTests.reduce((sum, emp) => sum + emp.average_score, 0) / employeesWithTests.length 
      : 0;

    setStats({
      allTestsPassed,
      partialTests,
      completedNotPassed,
      totalEmployees,
      averagePerformance
    });
  };

  const getStatusBadge = (employee: EmployeeTestData) => {
    if (employee.total_tests === 0) {
      return <Badge variant="destructive">لم يختبر</Badge>;
    } else if (employee.total_tests < 3) {
      return <Badge variant="secondary">اختبار جزئي ({employee.total_tests}/3)</Badge>;
    } else if (employee.all_passed) {
      return <Badge variant="default" className="bg-green-600">نجح في جميع الاختبارات</Badge>;
    } else {
      return <Badge variant="destructive">لم ينجح في جميع الاختبارات</Badge>;
    }
  };

  const getTopPerformers = () => {
    return analyticsData
      .filter(emp => emp.all_passed && emp.total_tests >= 3)
      .sort((a, b) => b.average_score - a.average_score)
      .slice(0, 10);
  };

  const getIncompleteTests = () => {
    return analyticsData.filter(emp => emp.total_tests > 0 && emp.total_tests < 3);
  };

  const getCompletedNotPassed = () => {
    return analyticsData.filter(emp => emp.total_tests >= 3 && !emp.all_passed);
  };

  const getNotTested = () => {
    return analyticsData.filter(emp => emp.total_tests === 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center text-white/80 py-8">
          جاري تحميل التحليلات...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">نجحوا في جميع الاختبارات</CardTitle>
            <Trophy className="h-4 w-4 text-green-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">{stats.allTestsPassed}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">أكملوا ولم ينجحوا في الكل</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-300">{stats.completedNotPassed}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">اختبارات جزئية</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-300">{stats.partialTests}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">إجمالي الموظفين</CardTitle>
            <Users className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalEmployees}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">متوسط الأداء</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-300">{stats.averagePerformance.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="bg-white/15 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-300" />
            أفضل الناجحين في جميع الاختبارات
          </CardTitle>
          <CardDescription className="text-white/80">
            الموظفون الذين نجحوا في جميع الاختبارات الثلاثة مرتبين حسب متوسط الدرجات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-white/5 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-white font-medium">الترتيب</TableHead>
                  <TableHead className="text-white font-medium">اسم الموظف</TableHead>
                  <TableHead className="text-white font-medium">الرقم الوظيفي</TableHead>
                  <TableHead className="text-white font-medium">متوسط الدرجات</TableHead>
                  <TableHead className="text-white font-medium">عدد الاختبارات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTopPerformers().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-white/80 py-8">
                      لا يوجد موظفون نجحوا في جميع الاختبارات بعد
                    </TableCell>
                  </TableRow>
                ) : (
                  getTopPerformers().map((employee, index) => (
                    <TableRow key={employee.employee_id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-bold">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-white/20'
                        }`}>
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-medium">{employee.employee_name}</TableCell>
                      <TableCell className="text-white">{employee.employee_id}</TableCell>
                      <TableCell className="text-white font-bold text-green-300">{employee.average_score.toFixed(1)}%</TableCell>
                      <TableCell className="text-white">{employee.total_tests}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Completed but not all passed */}
      <Card className="bg-white/15 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-300" />
            الموظفون الذين أكملوا 3 اختبارات ولم ينجحوا في الكل
          </CardTitle>
          <CardDescription className="text-white/80">
            الموظفون الذين اختبروا جميع الاختبارات الثلاثة ولكن لم ينجحوا في بعضها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-white/5 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-white font-medium">اسم الموظف</TableHead>
                  <TableHead className="text-white font-medium">الرقم الوظيفي</TableHead>
                  <TableHead className="text-white font-medium">عدد الاختبارات</TableHead>
                  <TableHead className="text-white font-medium">متوسط الدرجات</TableHead>
                  <TableHead className="text-white font-medium">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCompletedNotPassed().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-white/80 py-8">
                      جميع الذين أكملوا الاختبارات نجحوا في الكل
                    </TableCell>
                  </TableRow>
                ) : (
                  getCompletedNotPassed().map((employee) => (
                    <TableRow key={employee.employee_id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{employee.employee_name}</TableCell>
                      <TableCell className="text-white">{employee.employee_id}</TableCell>
                      <TableCell className="text-white">{employee.total_tests}</TableCell>
                      <TableCell className="text-white">{employee.average_score.toFixed(1)}%</TableCell>
                      <TableCell>{getStatusBadge(employee)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Incomplete Tests */}
      <Card className="bg-white/15 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-300" />
            الموظفون الذين لم يكملوا جميع الاختبارات
          </CardTitle>
          <CardDescription className="text-white/80">
            الموظفون الذين اختبروا اختبارًا واحدًا أو اثنين فقط
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-white/5 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-white font-medium">اسم الموظف</TableHead>
                  <TableHead className="text-white font-medium">الرقم الوظيفي</TableHead>
                  <TableHead className="text-white font-medium">عدد الاختبارات</TableHead>
                  <TableHead className="text-white font-medium">متوسط الدرجات</TableHead>
                  <TableHead className="text-white font-medium">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getIncompleteTests().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-white/80 py-8">
                      جميع الموظفين أكملوا الاختبارات أو لم يبدؤوا بعد
                    </TableCell>
                  </TableRow>
                ) : (
                  getIncompleteTests().map((employee) => (
                    <TableRow key={employee.employee_id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{employee.employee_name}</TableCell>
                      <TableCell className="text-white">{employee.employee_id}</TableCell>
                      <TableCell className="text-white">{employee.total_tests}/3</TableCell>
                      <TableCell className="text-white">{employee.average_score.toFixed(1)}%</TableCell>
                      <TableCell>{getStatusBadge(employee)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Not Tested */}
      <Card className="bg-white/15 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-red-300" />
            الموظفون الذين لم يختبروا
          </CardTitle>
          <CardDescription className="text-white/80">
            الموظفون المسجلون في النظام والذين لم يأخذوا أي اختبار بعد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-white/5 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-white font-medium">اسم الموظف</TableHead>
                  <TableHead className="text-white font-medium">الرقم الوظيفي</TableHead>
                  <TableHead className="text-white font-medium">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getNotTested().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-white/80 py-8">
                      جميع الموظفين أخذوا اختبارًا واحدًا على الأقل
                    </TableCell>
                  </TableRow>
                ) : (
                  getNotTested().map((employee) => (
                    <TableRow key={employee.employee_id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{employee.employee_name}</TableCell>
                      <TableCell className="text-white">{employee.employee_id}</TableCell>
                      <TableCell>{getStatusBadge(employee)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestAnalytics;