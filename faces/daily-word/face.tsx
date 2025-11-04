"use client";

import React, { useState, useEffect } from "react";
import { Volume2, RotateCcw, BookOpen, Trash2 } from "lucide-react";
import { TextContent } from "@/components/ui/text-content";
import content from "./face.content.json";
import controlsData from "./face.controls.json";

interface Task {
  question: string;
  questionTranslation: string;
  correctAnswer: string;
  options: string[];
}

export default function DailyWordFace() {
  const [currentDay, setCurrentDay] = useState(1);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [taskAnswers, setTaskAnswers] = useState(["", ""]);
  const [errors, setErrors] = useState([false, false]);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [reviewWords, setReviewWords] = useState<Set<number>>(new Set());
  const [tasksForDay, setTasksForDay] = useState<Task[]>([]);
  const [showReviewPanel, setShowReviewPanel] = useState(false);

  // Load saved state
  useEffect(() => {
    const savedDay = localStorage.getItem("currentDay");
    const savedCompleted = localStorage.getItem("completedWords");
    const savedReview = localStorage.getItem("reviewWords");

    if (savedDay) setCurrentDay(parseInt(savedDay));
    if (savedCompleted) setCompletedWords(new Set(JSON.parse(savedCompleted)));
    if (savedReview) setReviewWords(new Set(JSON.parse(savedReview)));
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem("currentDay", currentDay.toString());
    localStorage.setItem("completedWords", JSON.stringify([...completedWords]));
    localStorage.setItem("reviewWords", JSON.stringify([...reviewWords]));
  }, [currentDay, completedWords, reviewWords]);

  const cardRadius = controlsData.controls.cardRadius?.value ?? 16;

  // helper words for alternatives
  const randomWordsEn = content.words.rows.map((w: any) => w.word);
  const randomWordsUa = content.words.rows.map((w: any) => w.translation);

  const shuffleArray = (arr: string[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // prepare tasks for a day with randomized option order
  useEffect(() => {
    const wordData = content.words.rows[currentDay - 1];
    if (!wordData) return;

    const options1 = shuffleArray(
      [wordData.translation, ...randomWordsUa.filter((w) => w !== wordData.translation)].slice(0, 4)
    ).map((o) => o.toString());

    const options2 = shuffleArray(
      [wordData.word, ...randomWordsEn.filter((w) => w.toLowerCase() !== wordData.word.toLowerCase())].slice(0, 4)
    ).map((o) => o.toString());

    const fixedTasks: Task[] = [
      {
        question: `Оберіть правильний переклад слова '${wordData.word}'`,
        questionTranslation: "Choose the correct translation",
        correctAnswer: wordData.translation,
        options: options1.map((o) => o.toLowerCase()),
      },
      {
        question: `Яке слово пропущене? '${wordData.exampleSentence.replace(new RegExp(wordData.word, "gi"), "_____")}'`,
        questionTranslation: "What word is missing?",
        correctAnswer: wordData.word,
        options: options2.map((o) => o.toLowerCase()),
      },
    ];

    setTasksForDay(fixedTasks);
    setTaskAnswers(["", ""]);
    setErrors([false, false]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDay]);

  const wordData = content.words.rows[currentDay - 1] || content.words.rows[0];

  const checkAnswers = () => {
    const newErrors = taskAnswers.map(
      (answer, idx) =>
        answer.toLowerCase().trim() !== tasksForDay[idx].correctAnswer.toLowerCase().trim()
    );
    setErrors(newErrors);

    if (!newErrors.some((e) => e)) {
      setCompletedWords((prev) => new Set([...prev, currentDay]));
      // show a brief confirmation
      setTimeout(() => {
        alert("✅ Ви відповіли правильно! Слово позначено як вивчене.");
      }, 150);
    }
  };

  const resetAnswers = () => {
    setTaskAnswers(["", ""]);
    setErrors([false, false]);
    // also reshuffle current tasks options
    setTasksForDay((prev) =>
      prev.map((t) => ({ ...t, options: shuffleArray(t.options) }))
    );
  };

  const playAudio = () => {
    const utterance = new SpeechSynthesisUtterance(wordData.word);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  // Toggle add/remove to review
  const toggleReviewForCurrent = () => {
    setReviewWords((prev) => {
      const next = new Set(prev);
      if (next.has(currentDay)) {
        next.delete(currentDay);
      } else {
        next.add(currentDay);
      }
      localStorage.setItem("reviewWords", JSON.stringify([...next]));
      return next;
    });
  };

  // Remove a specific day from review (from panel)
  const removeFromReview = (day: number) => {
    setReviewWords((prev) => {
      const next = new Set(prev);
      next.delete(day);
      localStorage.setItem("reviewWords", JSON.stringify([...next]));
      return next;
    });
  };

  const resetStatistics = () => {
    if (confirm("Ви впевнені, що хочете скинути всю статистику?")) {
      setCompletedWords(new Set());
      setReviewWords(new Set());
      setCurrentDay(1);
      resetAnswers();
    }
  };

  const isDayLocked = currentDay > 1 && !completedWords.has(currentDay - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 text-black">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <TextContent
            className="text-5xl font-bold text-gray-900 mb-4"
            content={content.title.content}
          />
          <TextContent
            className="text-xl text-gray-600"
            content={content.subtitle.content}
          />
          <div className="mt-2 text-lg text-gray-700">
            День {currentDay} з {content.words.rows.length}
          </div>
        </div>

        {/* REVIEW PANEL (спливна панель або блок) */}
        {showReviewPanel && (
          <div className="bg-white shadow-xl p-6 mb-8 rounded-xl" style={{ borderRadius: cardRadius }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Слова для повторення ({reviewWords.size})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReviewPanel(false)}
                  className="py-2 px-4 bg-gray-200 rounded-lg"
                >
                  Закрити
                </button>
                <button
                  onClick={() => { setShowReviewPanel(false); }}
                  className="py-2 px-3 bg-indigo-600 text-white rounded-lg"
                >
                  Повернутись до навчання
                </button>
              </div>
            </div>

            {reviewWords.size === 0 ? (
              <p className="text-gray-600">Поки що немає слів для повторення.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {[...reviewWords].map((day) => {
                  const w = content.words.rows[day - 1];
                  return (
                    <div key={day} className="w-full md:w-1/2 bg-gray-50 p-4 rounded-lg mb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="text-2xl font-bold text-indigo-600">{w.word}</div>
                          <div className="text-lg text-gray-800 mb-2">{w.translation}</div>
                          <div className="italic text-gray-600">"{w.exampleSentence}"</div>
                          <div className="text-gray-700 mt-1">{w.exampleTranslation}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setCurrentDay(day); setShowReviewPanel(false); setShowTest(false); }}
                            className="py-2 px-3 bg-sky-500 text-white rounded-lg"
                          >
                            Перейти
                          </button>
                          <button
                            onClick={() => removeFromReview(day)}
                            className="py-2 px-3 bg-red-500 text-white rounded-lg"
                          >
                            Видалити
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Word Card */}
        <div
          className="bg-white shadow-2xl p-8 mb-8"
          style={{ borderRadius: cardRadius }}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h2 className="text-6xl font-bold text-indigo-600">
                {wordData.word}
              </h2>
              <button
                onClick={playAudio}
                className="p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-full transition-colors"
                title="Послухати"
              >
                <Volume2 size={28} />
              </button>
            </div>
            <p className="text-3xl text-gray-700 font-medium">
              {wordData.translation}
            </p>
          </div>

          {/* Example Sentence */}
          <div className="bg-indigo-50 p-6 rounded-xl mb-8">
            <p className="text-xl text-gray-800 mb-2 italic">
              "{wordData.exampleSentence}"
            </p>
            <p className="text-lg text-gray-600">
              {wordData.exampleTranslation}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              disabled={isDayLocked}
              onClick={() => setShowTest(!showTest)}
              className={`flex-1 min-w-[200px] py-4 px-6 bg-lime-500 hover:bg-lime-600 text-white font-bold rounded-xl transition-colors text-lg ${isDayLocked ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {showTest ? "Сховати тест" : "Почати тест"}
            </button>

            <button
              onClick={() => setShowReviewPanel(true)}
              className="flex-1 min-w-[200px] py-4 px-6 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-colors text-lg"
            >
              Слова для повторення ({reviewWords.size})
            </button>

            <button
              onClick={() => toggleReviewForCurrent()}
              className={`py-4 px-6 ${reviewWords.has(currentDay) ? "bg-amber-700 hover:bg-amber-800" : "bg-amber-500 hover:bg-amber-600"} text-white font-bold rounded-xl transition-colors flex items-center gap-2`}
            >
              {reviewWords.has(currentDay) ? "Додано в повторення" : "Додати в повторення"}
            </button>

            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="flex-1 min-w-[200px] py-4 px-6 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
            >
              <BookOpen size={20} />
              {showAnalysis ? "Сховати розбір" : "Показати розбір"}
            </button>
          </div>

          {/* Analysis Section */}
          {showAnalysis && (
            <div className="bg-purple-50 p-6 rounded-xl mb-8">
              <h3 className="text-2xl font-bold text-purple-900 mb-4">Розбір слова</h3>
              <div className="space-y-3 text-lg text-gray-700">
                <p><strong>Слово:</strong> {wordData.word}</p>
                <p><strong>Переклад:</strong> {wordData.translation}</p>
                <p><strong>Приклад використання:</strong> {wordData.exampleSentence}</p>
                <p><strong>Переклад прикладу:</strong> {wordData.exampleTranslation}</p>
              </div>
            </div>
          )}

          {/* Tasks */}
          {showTest && (
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Завдання</h3>
              
              {tasksForDay.map((task, idx) => (
                <div key={idx} className="bg-gray-50 p-6 rounded-xl">
                  <p className="text-xl font-semibold text-gray-900 mb-2">
                    Завдання {idx + 1}: {task.question}
                  </p>
                  <p className="text-lg text-gray-600 mb-4 italic">
                    {task.questionTranslation}
                  </p>
                  
                  <div className="space-y-3">
                    {task.options.map((option, optIdx) => (
                      <label
                        key={optIdx}
                        className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${taskAnswers[idx] === option ? (errors[idx] ? "border-red-500 bg-red-50" : "border-indigo-500 bg-indigo-50") : "border-gray-300 bg-white hover:border-indigo-300"}`}
                      >
                        <input
                          type="radio"
                          name={`task-${idx}`}
                          value={option}
                          checked={taskAnswers[idx] === option}
                          onChange={(e) => {
                            const newAnswers = [...taskAnswers];
                            newAnswers[idx] = e.target.value;
                            setTaskAnswers(newAnswers);
                            const newErrors = [...errors];
                            newErrors[idx] = false;
                            setErrors(newErrors);
                          }}
                          className="mr-3"
                        />
                        <span className="text-lg">{option}</span>
                      </label>
                    ))}
                  </div>
                  
                  {errors[idx] && (
                    <div className="mt-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
                      <p className="text-red-800 font-semibold text-lg">
                        ❌ Помилка! Правильна відповідь: {task.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-4 mt-8">
                <button
                  onClick={checkAnswers}
                  className="flex-1 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors text-lg"
                >
                  Перевірити відповіді
                </button>
                <button
                  onClick={resetAnswers}
                  className="py-4 px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-xl transition-colors text-lg flex items-center gap-2"
                >
                  <RotateCcw size={20} />
                  Скинути
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => setCurrentDay((prev) => Math.max(1, prev - 1))}
            disabled={currentDay === 1}
            className={`py-2 px-4 rounded-xl font-bold ${currentDay === 1 ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
          >
            Попередній день
          </button>

          <button
            onClick={() => {
              if (completedWords.has(currentDay)) {
                setCurrentDay((prev) => Math.min(content.words.rows.length, prev + 1));
              }
            }}
            disabled={!completedWords.has(currentDay) || currentDay === content.words.rows.length}
            className={`py-2 px-4 rounded-xl font-bold ${!completedWords.has(currentDay) || currentDay === content.words.rows.length ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
          >
            Наступний день
          </button>
        </div>

        {/* Statistics */}
        <div className="bg-white shadow-xl p-6 mt-8" style={{ borderRadius: cardRadius }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900">Статистика</h3>
            <button
              onClick={resetStatistics}
              className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 size={18} />
              Скинути статистику
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-4xl font-bold text-green-600">{completedWords.size}</div>
              <div className="text-gray-700 mt-2">Вивчено слів</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <div className="text-4xl font-bold text-amber-600">{reviewWords.size}</div>
              <div className="text-gray-700 mt-2">На повторення</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <div className="text-4xl font-bold text-indigo-600">{Math.round((completedWords.size / content.words.rows.length) * 100)}%</div>
              <div className="text-gray-700 mt-2">Прогрес</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
