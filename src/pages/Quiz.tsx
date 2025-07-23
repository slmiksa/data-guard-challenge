
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { questions } from "@/data/questions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Quiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);

  const employeeData = location.state;

  useEffect(() => {
    if (!employeeData) {
      navigate("/");
    }
  }, [employeeData, navigate]);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    return {
      score: correctAnswers,
      percentage: (correctAnswers / questions.length) * 100
    };
  };

  const handleSubmit = async () => {
    if (selectedAnswers.length !== questions.length) {
      toast({
        title: "يجب الإجابة على جميع الأسئلة",
        description: "يرجى الإجابة على جميع الأسئلة قبل الإرسال",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const results = calculateResults();
      const passed = results.percentage >= 70;

      // Save results to database
      const { error } = await supabase
        .from('employee_results')
        .insert({
          employee_name: employeeData.employeeName,
          employee_id: employeeData.employeeId,
          score: results.score,
          percentage: results.percentage,
          passed: passed
        });

      if (error) {
        throw error;
      }

      setScore(results.score);
      setPercentage(results.percentage);
      setShowResult(true);

    } catch (error) {
      console.error('Error saving results:', error);
      toast({
        title: "خطأ في حفظ النتائج",
        description: "حدث خطأ أثناء حفظ النتائج، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!employeeData) {
    return null;
  }

  if (showResult) {
    const passed = percentage >= 70;
    return (
      <div className="min-h-screen purple-gradient flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {passed ? (
                <CheckCircle className="h-16 w-16 text-green-400" />
              ) : (
                <XCircle className="h-16 w-16 text-red-400" />
              )}
            </div>
            <CardTitle className="text-white text-2xl">
              {passed ? "نجحت في الاختبار!" : "لم تجتز الاختبار"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-white/90">النتيجة: {score} من {questions.length}</p>
              <p className="text-white/90">النسبة المئوية: {percentage.toFixed(1)}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-white/80 text-sm">
                {passed 
                  ? "تهانينا! لقد أجبت بشكل صحيح على معظم الأسئلة"
                  : "يرجى مراجعة مواد أمن المعلومات والمحاولة مرة أخرى في المستقبل"
                }
              </p>
            </div>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-white text-purple-600 hover:bg-white/90"
            >
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen purple-gradient p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            اختبار أمن المعلومات
          </h1>
          <p className="text-white/80">
            {employeeData.employeeName} - {employeeData.employeeId}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white">
              السؤال {currentQuestion + 1} من {questions.length}
            </span>
            <span className="text-white">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswers[currentQuestion] === index ? "default" : "outline"}
                className={`w-full text-right p-4 h-auto ${
                  selectedAnswers[currentQuestion] === index
                    ? "bg-white text-purple-600"
                    : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                {option}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="bg-white/10 text-white border-white/30 hover:bg-white/20"
          >
            السابق
          </Button>

          <div className="flex items-center space-x-2 text-white/80">
            <Clock className="h-4 w-4" />
            <span>لا يوجد حد زمني</span>
          </div>

          {currentQuestion === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedAnswers.length !== questions.length}
              className="bg-white text-purple-600 hover:bg-white/90"
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال الاختبار"}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestion] === undefined}
              className="bg-white text-purple-600 hover:bg-white/90"
            >
              التالي
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
