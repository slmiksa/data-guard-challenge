import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { questions } from "@/data/questions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Timer from "@/components/Timer";

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
  const [timeTaken, setTimeTaken] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [incorrectAnswers, setIncorrectAnswers] = useState<Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
  }>>([]);

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

  const handleTimeUpdate = (seconds: number) => {
    setTimeTaken(seconds);
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    const wrongAnswers: Array<{
      question: string;
      userAnswer: string;
      correctAnswer: string;
    }> = [];

    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      } else {
        wrongAnswers.push({
          question: question.question,
          userAnswer: question.options[selectedAnswers[index]] || "لم يتم الإجابة",
          correctAnswer: question.options[question.correctAnswer]
        });
      }
    });

    return {
      score: correctAnswers,
      percentage: (correctAnswers / questions.length) * 100,
      incorrectAnswers: wrongAnswers
    };
  };

  const handleSubmit = async () => {
    if (selectedAnswers.length !== questions.length) {
      toast({
        title: "يجب الإجابة على جميع الأسئلة",
        description: "يرجى الإجابة على جميع الأسئلة قبل الإرسال",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setIsTimerActive(false);

    try {
      const results = calculateResults();
      const passed = results.percentage >= 70;

      console.log('Saving results:', {
        employee_name: employeeData.employeeName,
        employee_id: employeeData.employeeId,
        score: results.score,
        percentage: results.percentage,
        passed: passed,
        time_taken: timeTaken
      });

      // Save results to database
      const { data, error } = await supabase
        .from('employee_results')
        .insert({
          employee_name: employeeData.employeeName,
          employee_id: employeeData.employeeId,
          score: results.score,
          percentage: results.percentage,
          passed: passed,
          time_taken: timeTaken
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Results saved successfully:', data);
      setScore(results.score);
      setPercentage(results.percentage);
      setIncorrectAnswers(results.incorrectAnswers);
      setShowResult(true);
    } catch (error) {
      console.error('Error saving results:', error);
      toast({
        title: "خطأ في حفظ النتائج",
        description: "حدث خطأ أثناء حفظ النتائج، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
      setIsTimerActive(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!employeeData) {
    return null;
  }

  if (showResult) {
    const passed = percentage >= 70;
    const timeMinutes = Math.floor(timeTaken / 60);
    const timeSeconds = timeTaken % 60;

    return (
      <div className="min-h-screen brown-gradient flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {passed ? (
                  <CheckCircle className="h-20 w-20 text-green-300 animate-pulse" />
                ) : (
                  <XCircle className="h-20 w-20 text-red-300 animate-pulse" />
                )}
              </div>
              <CardTitle className="text-white text-3xl font-bold">
                {passed ? "🎉 نجحت في الاختبار!" : "😔 لم تجتز الاختبار"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="bg-white/10 rounded-lg p-4 space-y-3">
                <p className="text-white text-xl font-medium">النتيجة: {score} من {questions.length}</p>
                <p className="text-white text-xl font-medium">النسبة المئوية: {percentage.toFixed(1)}%</p>
                <p className="text-white text-lg">الوقت المستغرق: {timeMinutes}:{timeSeconds.toString().padStart(2, '0')}</p>
              </div>
              <div className="space-y-2">
                <p className="text-white/90 text-lg">
                  {passed 
                    ? "تهانينا! لقد أجبت بشكل صحيح على معظم الأسئلة وأظهرت وعياً جيداً بأمن المعلومات" 
                    : "يرجى مراجعة مواد أمن المعلومات وحماية البيانات والمحاولة مرة أخرى في المستقبل"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Show incorrect answers if any */}
          {incorrectAnswers.length > 0 && (
            <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
              <CardHeader>
                <CardTitle className="text-white text-2xl font-bold text-center">
                  الإجابات الخاطئة والحلول الصحيحة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {incorrectAnswers.map((item, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-4 space-y-3">
                    <h4 className="text-white font-medium text-lg">
                      السؤال {index + 1}: {item.question}
                    </h4>
                    <div className="space-y-2">
                      <p className="text-red-300 text-right">
                        <span className="font-medium">إجابتك:</span> {item.userAnswer}
                      </p>
                      <p className="text-green-300 text-right">
                        <span className="font-medium">الإجابة الصحيحة:</span> {item.correctAnswer}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen brown-gradient p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="logo-container">
              <img 
                src="/lovable-uploads/dfff4da4-873f-4b05-9e34-0a05daeb9091.png" 
                alt="شعار الوصل" 
                className="h-16 w-16 object-contain logo-image" 
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            اختبار الوعي الأمني
          </h1>
          <p className="text-white/90 text-lg">
            {employeeData.employeeName} - {employeeData.employeeId}
          </p>
        </div>

        {/* Progress and Timer */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-white font-medium text-lg">
                السؤال {currentQuestion + 1} من {questions.length}
              </span>
              <span className="text-white/90 text-lg">
                {Math.round(progress)}%
              </span>
            </div>
            <Timer 
              isActive={isTimerActive} 
              onTimeUpdate={handleTimeUpdate} 
              className="bg-white/20 rounded-lg px-4 py-2" 
            />
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Question */}
        <Card className="bg-white/15 backdrop-blur-sm border-white/20 mb-8 interactive-card">
          <CardHeader>
            <CardTitle className="text-white text-2xl font-medium leading-relaxed">
              {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswers[currentQuestion] === index ? "default" : "outline"}
                className={`w-full text-right p-6 h-auto text-lg font-medium transition-all duration-300 ${
                  selectedAnswers[currentQuestion] === index
                    ? "bg-white text-primary shadow-lg transform scale-105"
                    : "bg-white/10 text-white border-white/30 hover:bg-white/20 hover:scale-102"
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="text-right w-full">{option}</span>
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
            className="bg-white/10 text-white border-white/30 hover:bg-white/20 interactive-button h-12 px-6"
          >
            <ArrowRight className="h-5 w-5 ml-2" />
            السابق
          </Button>

          <div className="text-center">
            <p className="text-white/80 text-sm">
              {selectedAnswers.filter(a => a !== undefined).length} / {questions.length} تم الإجابة عليها
            </p>
          </div>

          {currentQuestion === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedAnswers.length !== questions.length}
              className="bg-white text-primary hover:bg-white/90 interactive-button h-12 px-6"
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال الاختبار"}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestion] === undefined}
              className="bg-white text-primary hover:bg-white/90 interactive-button h-12 px-6"
            >
              التالي
              <ArrowLeft className="h-5 w-5 mr-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
