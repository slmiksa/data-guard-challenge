import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Check, X, Download } from "lucide-react";
import { questions } from "@/data/questions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Timer from "@/components/Timer";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// Function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Function to shuffle question options and track correct answer
const shuffleQuestionOptions = (question: any) => {
  const optionsWithIndex = question.options.map((option: string, index: number) => ({
    option,
    isCorrect: index === question.correctAnswer
  }));
  const shuffledOptions = shuffleArray(optionsWithIndex);
  const newCorrectAnswer = shuffledOptions.findIndex((item: {
    option: string;
    isCorrect: boolean;
  }) => item.isCorrect);
  return {
    ...question,
    options: shuffledOptions.map((item: {
      option: string;
      isCorrect: boolean;
    }) => item.option),
    correctAnswer: newCorrectAnswer
  };
};
const Quiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [shuffledQuestions] = useState(() => {
    // Keep all questions and options in their original order
    return questions;
  });
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
    if (currentQuestion < shuffledQuestions.length - 1) {
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
    shuffledQuestions.forEach((question, index) => {
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
      percentage: correctAnswers / shuffledQuestions.length * 100,
      incorrectAnswers: wrongAnswers
    };
  };
  const downloadResultsWord = async () => {
    try {
      const timeMinutes = Math.floor(timeTaken / 60);
      const timeSeconds = timeTaken % 60;
      const currentDate = new Date().toLocaleDateString('ar-SA');

      // Create document paragraphs
      const children = [new Paragraph({
        children: [new TextRun({
          text: "نتائج اختبار الجودة",
          bold: true,
          size: 28
        })],
        heading: HeadingLevel.HEADING_1,
        alignment: "center"
      }), new Paragraph({
        children: [new TextRun({
          text: `اسم الموظف: ${employeeData.employeeName}`,
          size: 24
        })]
      }), new Paragraph({
        children: [new TextRun({
          text: `رقم الموظف: ${employeeData.employeeId}`,
          size: 24
        })]
      }), new Paragraph({
        children: [new TextRun({
          text: `النتيجة: ${score} من ${shuffledQuestions.length}`,
          size: 24
        })]
      }), new Paragraph({
        children: [new TextRun({
          text: `النسبة المئوية: ${percentage.toFixed(1)}%`,
          size: 24
        })]
      }), new Paragraph({
        children: [new TextRun({
          text: `الوقت المستغرق: ${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}`,
          size: 24
        })]
      }), new Paragraph({
        children: [new TextRun({
          text: `النتيجة النهائية: ${percentage >= 70 ? 'نجح' : 'لم ينجح'}`,
          size: 24,
          bold: true,
          color: percentage >= 70 ? "00FF00" : "FF0000"
        })]
      }), new Paragraph({
        children: [new TextRun({
          text: `تاريخ الاختبار: ${currentDate}`,
          size: 24
        })]
      })];

      // Add incorrect answers if any
      if (incorrectAnswers.length > 0) {
        children.push(new Paragraph({
          children: [new TextRun({
            text: "الإجابات الخاطئة:",
            bold: true,
            size: 26
          })],
          heading: HeadingLevel.HEADING_2
        }));
        incorrectAnswers.forEach((item, index) => {
          children.push(new Paragraph({
            children: [new TextRun({
              text: `${index + 1}. السؤال: ${item.question}`,
              size: 22,
              bold: true
            })]
          }), new Paragraph({
            children: [new TextRun({
              text: `إجابتك: ${item.userAnswer}`,
              size: 20,
              color: "FF0000"
            })]
          }), new Paragraph({
            children: [new TextRun({
              text: `الإجابة الصحيحة: ${item.correctAnswer}`,
              size: 20,
              color: "00FF00"
            })]
          }), new Paragraph({
            children: [new TextRun({
              text: "",
              size: 20
            })]
          }));
        });
      }

      // Create the document
      const doc = new Document({
        sections: [{
          properties: {},
          children: children
        }]
      });

      // Generate and save the document
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `نتيجة_الاختبار_${employeeData.employeeId}.docx`);
      toast({
        title: "تم تحميل النتيجة بنجاح",
        description: "تم حفظ ملف Word للنتيجة"
      });
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast({
        title: "خطأ في تحميل Word",
        description: "حدث خطأ أثناء إنشاء ملف Word",
        variant: "destructive"
      });
    }
  };
  const handleSubmit = async () => {
    // تأكد من أن جميع الأسئلة تم الإجابة عليها
    if (selectedAnswers.length !== shuffledQuestions.length || selectedAnswers.includes(undefined)) {
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

      // Check if employee already has a result
      const {
        data: existingResult,
        error: checkError
      } = await supabase.from('employee_results').select('*').eq('employee_id', employeeData.employeeId).maybeSingle();
      if (checkError) {
        console.error('Error checking existing results:', checkError);
        throw checkError;
      }
      let saveResult;
      if (existingResult) {
        // Update existing result
        const {
          data,
          error
        } = await supabase.from('employee_results').update({
          employee_name: employeeData.employeeName,
          score: results.score,
          percentage: results.percentage,
          passed: passed,
          time_taken: timeTaken
        }).eq('employee_id', employeeData.employeeId).select();
        saveResult = {
          data,
          error
        };
      } else {
        // Insert new result
        const {
          data,
          error
        } = await supabase.from('employee_results').insert({
          employee_name: employeeData.employeeName,
          employee_id: employeeData.employeeId,
          score: results.score,
          percentage: results.percentage,
          passed: passed,
          time_taken: timeTaken
        }).select();
        saveResult = {
          data,
          error
        };
      }
      if (saveResult.error) {
        console.error('Supabase error:', saveResult.error);
        throw saveResult.error;
      }
      console.log('Results saved successfully:', saveResult.data);
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

  // Check if there are no questions available
  if (shuffledQuestions.length === 0) {
    return <div className="min-h-screen brown-gradient flex items-center justify-center p-4">
        <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl font-bold">
              لا توجد أسئلة متاحة
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-white/90 text-lg">
              لم يتم العثور على أسئلة للاختبار. يرجى المحاولة لاحقاً.
            </p>
            <Button onClick={() => navigate("/")} className="bg-white text-primary hover:bg-white/90">
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  if (showResult) {
    const passed = percentage >= 70;
    const timeMinutes = Math.floor(timeTaken / 60);
    const timeSeconds = timeTaken % 60;
    return <div className="min-h-screen brown-gradient flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {passed ? <CheckCircle className="h-20 w-20 text-green-300 animate-pulse" /> : <XCircle className="h-20 w-20 text-red-300 animate-pulse" />}
              </div>
              <CardTitle className="text-white text-3xl font-bold">
                {passed ? "🎉 نجحت في الاختبار!" : "😔 لم تجتز الاختبار"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="bg-white/10 rounded-lg p-4 space-y-3">
                <p className="text-white text-xl font-medium">النتيجة: {score} من {shuffledQuestions.length}</p>
                <p className="text-white text-xl font-medium">النسبة المئوية: {percentage.toFixed(1)}%</p>
                <p className="text-white text-lg">الوقت المستغرق: {timeMinutes}:{timeSeconds.toString().padStart(2, '0')}</p>
              </div>
              <div className="space-y-2">
                
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={downloadResultsWord} className="bg-green-600 text-white hover:bg-green-700 px-6 py-2">
                  <Download className="h-5 w-5 ml-2" />
                  تحميل النتيجة Word
                </Button>
                <Button onClick={() => navigate("/")} className="bg-white text-primary hover:bg-white/90 px-6 py-2">
                  العودة للصفحة الرئيسية
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Show incorrect answers if any */}
          {incorrectAnswers.length > 0 && <Card className="bg-white/15 backdrop-blur-sm border-white/20 interactive-card">
              <CardHeader>
                <CardTitle className="text-white text-2xl font-bold text-center">
                  الإجابات الخاطئة والحلول الصحيحة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {incorrectAnswers.map((item, index) => <div key={index} className="bg-white/10 rounded-lg p-4 space-y-3">
                    <h4 className="text-white font-medium text-lg">
                      السؤال {index + 1}: {item.question}
                    </h4>
                    <div className="space-y-2">
                      <p className="text-right text-red-500">
                        <span className="font-medium">إجابتك:</span> {item.userAnswer}
                      </p>
                      <p className="text-right text-green-600">
                        <span className="font-medium">الإجابة الصحيحة:</span> {item.correctAnswer}
                      </p>
                    </div>
                  </div>)}
              </CardContent>
            </Card>}
        </div>
      </div>;
  }
  const progress = (currentQuestion + 1) / shuffledQuestions.length * 100;
  const question = shuffledQuestions[currentQuestion];
  return <div className="min-h-screen brown-gradient p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="logo-container">
              <img src="/lovable-uploads/dfff4da4-873f-4b05-9e34-0a05daeb9091.png" alt="شعار الوصل" className="h-16 w-16 object-contain logo-image" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">اختبار توعوي للموظفين</h1>
          <p className="text-white/90 text-lg">
            {employeeData.employeeName} - {employeeData.employeeId}
          </p>
        </div>

        {/* Progress and Timer */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-white font-medium text-lg">
                السؤال {currentQuestion + 1} من {shuffledQuestions.length}
              </span>
              <span className="text-white/90 text-lg">
                {Math.round(progress)}%
              </span>
            </div>
            <Timer isActive={isTimerActive} onTimeUpdate={handleTimeUpdate} className="flex-shrink-0" />
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
            {question.options.length === 2 ?
          // True/False Questions - Special Design
          <div className="grid grid-cols-2 gap-6">
                {question.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestion] === index;
              const isTrue = option === "صح";
              return <Button key={index} variant="outline" className={`
                        relative p-8 h-32 text-xl font-bold transition-all duration-300 border-2
                        ${isSelected ? isTrue ? "bg-green-500 text-white border-green-400 shadow-2xl transform scale-105" : "bg-red-500 text-white border-red-400 shadow-2xl transform scale-105" : "bg-white/10 text-white border-white/30 hover:bg-white/20 hover:scale-102"}
                        ${isTrue ? "hover:border-green-300" : "hover:border-red-300"}
                      `} onClick={() => handleAnswerSelect(index)}>
                      <div className="flex flex-col items-center space-y-3">
                        {isTrue ? <Check className={`h-12 w-12 ${isSelected ? "text-white" : "text-green-400"}`} /> : <X className={`h-12 w-12 ${isSelected ? "text-white" : "text-red-400"}`} />}
                        <span className="text-2xl font-bold">{option}</span>
                      </div>
                    </Button>;
            })}
              </div> :
          // Multiple Choice Questions - Original Design
          question.options.map((option, index) => <Button key={index} variant={selectedAnswers[currentQuestion] === index ? "default" : "outline"} className={`
                    w-full text-right p-6 h-auto text-lg font-medium transition-all duration-300 
                    ${selectedAnswers[currentQuestion] === index ? "bg-white text-primary shadow-lg transform scale-105" : "bg-white/10 text-white border-white/30 hover:bg-white/20 hover:scale-102"}
                  `} onClick={() => handleAnswerSelect(index)}>
                  <span className="text-right w-full">{option}</span>
                </Button>)}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0} className="bg-white/10 text-white border-white/30 hover:bg-white/20 interactive-button h-12 px-6">
            <ArrowRight className="h-5 w-5 ml-2" />
            السابق
          </Button>

          <div className="text-center">
            <p className="text-white/80 text-sm">
              {selectedAnswers.filter(a => a !== undefined).length} / {shuffledQuestions.length} تم الإجابة عليها
            </p>
          </div>

          {currentQuestion === shuffledQuestions.length - 1 ? <Button onClick={handleSubmit} disabled={isSubmitting || selectedAnswers[currentQuestion] === undefined} className="bg-white text-primary hover:bg-white/90 interactive-button h-12 px-6">
              {isSubmitting ? "جاري الإرسال..." : "إرسال الاختبار"}
            </Button> : <Button onClick={handleNext} disabled={selectedAnswers[currentQuestion] === undefined} className="bg-white text-primary hover:bg-white/90 interactive-button h-12 px-6">
              التالي
              <ArrowLeft className="h-5 w-5 mr-2" />
            </Button>}
        </div>
      </div>
    </div>;
};
export default Quiz;