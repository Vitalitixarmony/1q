"use client";

import React, { useState, useEffect } from "react";
import { Volume2, RotateCcw, BookOpen, Trash2, RefreshCcw } from "lucide-react";
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
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [taskAnswers, setTaskAnswers] = useState(["", ""]);
  const [errors, setErrors] = useState([false, false]);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [reviewWords, setReviewWords] = useState<Set<number>>(new Set());
  const [tasksForDay, setTasksForDay] = useState<Task[]>([]);

  useEffect(() => {
    const savedDay = localStorage.getItem("currentDay");
    const savedCompleted = localStorage.getItem("completedWords");
    const savedReview = localStorage.getItem("reviewWords");

    if (savedDay) setCurrentDay(parseInt(savedDay));
    if (savedCompleted) setCompletedWords(new Set(JSON.parse(savedCompleted)));
    if (savedReview) setReviewWords(new Set(JSON.parse(savedReview)));
  }, []);

  useEffect(() => {
    localStorage.setItem("currentDay", currentDay.toString());
    localStorage.setItem("completedWords", JSON.stringify([...completedWords]));
    localStorage.setItem("reviewWords", JSON.stringify([...reviewWords]));
  }, [currentDay, completedWords, reviewWords]);

  const cardRadius = controlsData.controls.cardRadius?.value ?? 16;

  const randomWordsEn = ["sleep", "music", "happy", "green", "school", "water", "light", "sky"];
  const randomWordsUa = ["сон", "музика", "щастя", "зелений", "школа", "вода", "світло", "небо"];

  const shuffleArray = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);

  useEffect(() => {
    const wordData = content.words.rows[currentDay - 1];
    if (!wordData) return;

    const fixedTasks: Task[] = [
      {
        question: `Оберіть правильний переклад слова '${wordData.word}'`,
        questionTranslation: "Choose the correct translation",
        correctAnswer: wordData.translation,
        options: shuffleArray([
          wordData.translation,
          ...randomWordsUa.filter((w) => w !== wordData.translation).slice(0, 3),
        ]).map((o) => o.toLowerCase()),
      },
      {
        question: `Яке слово пропущене? '${wordData.exampleSentence.replace(new RegExp(wordData.word, "gi"), "_____")}'`,
        questionTranslation: "What word is missing?",
        correctAnswer: wordData.word,
        options: shuffleArray([
          wordData.word,
          ...randomWordsEn.filter((w) => w.toLowerCase() !== wordData.word.toLowerCase()).slice(0, 3),
        ]).map((o) => o.toLowerCase()),
      },
    ];

    setTasksForDay(fixedTasks);
    setTaskAnswers(["", ""]);
    setErrors([false, false]);
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
      alert("✅ Ви пройшли цей день! Тепер відкрито наступний.");
    }
  };

  const resetAnswers = () => {
    setTaskAnswers(["", ""]);
    setErrors([false, false]);
    setTasksForDay((tasks) =>
      tasks.map((task) => ({
        ...task,
        options: shuffleArray(task.options),
      }))
    );
  };

  const playAudio = () => {
    const utterance = new SpeechSynthesisUtterance(wordData.word);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  const addToReview = () => {
    setReviewWords((prev) => new Set([...prev, currentDay]));
    alert("📌 Додано в повторення!");
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* ✅ Окрема сторінка повторення */}
        {showReviewPage ? (
          <div>
            <h2 className="text-4xl font-bold mb-6 text-center text-purple-700">Повторення слів</h2>

            {[...reviewWords].map((day) => {
              const w = content.words.rows[day - 1];
              return (
                <div key={day} className="bg-white p-6 rounded-xl shadow-md mb-4">
                  <h3 className="text-2xl font-bold text-indigo-600">{w.word}</h3>
                  <p className="text-lg">Переклад: {w.translation}</p>
                  <p className="italic mt-2 text-gray-600">"{w.exampleSentence}"</p>
                  <p className="text-gray-700">{w.exampleTranslation}</p>
                </div>
              );
            })}

            {reviewWords.size === 0 && (
              <p className="text-xl text-center text-gray-600">Немає доданих слів 😌</p>
            )}

            <button
              className="mt-6 py-3 px-6 bg-indigo-600 text-white font-bold rounded-xl w-full"
              onClick={() => setShowReviewPage(false)}
            >
              ◀ Назад до навчання
            </button>
          </div>
        ) : (
          <>
            {/* ✅ Основна частина навчання */}
            <div className="text-center mb-12">
              <TextContent className="text-5xl font-bold text-gray-900 mb-4" content={content.title.content} />
              <TextContent className="text-xl text-gray-600" content={content.subtitle.content} />
              <div className="mt-4 text-lg text-gray-700">
                День {currentDay} з {content.words.rows.length}
              </div>
            </div>

            <div className="bg-white shadow-2xl p-8 mb-8" style={{ borderRadius: cardRadius }}>
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <h2 className="text-6xl font-bold text-indigo-600">{wordData.word}</h2>
                  <button
                    onClick={playAudio}
                    className="p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-full"
                    title="Послухати"
                  >
                    <Volume2 size={28} />
                  </button>
                </div>
                <p className="text-3xl text-gray-700 font-medium">{wordData.translation}</p>
              </div>

              <div className="bg-indigo-50 p-6 rounded-xl mb-8">
                <p className="text-xl text-gray-800 mb-2 italic">"{wordData.exampleSentence}"</p>
                <p className="text-lg text-gray-600">{wordData.exampleTranslation}</p>
              </div>

              <div className="flex gap-4 mb-8 flex-wrap">
                <button
                  disabled={isDayLocked}
                  onClick={() => setShowTest(!showTest)}
                  className={`flex-1 min-w-[200px] py-4 px-6 font-bold rounded-xl text-lg ${
                    isDayLocked ? "bg-gray-400 cursor-not-allowed"
                    : "bg-lime-500 hover:bg-lime-600 text-white"
                  }`}
                >
                  {isDayLocked ? "Заблоковано" : showTest ? "Сховати тест" : "Почати тест"}
                </button>

                <button
                  onClick={() => setShowReviewPage(true)}
                  className="flex-1 min-w-[200px] py-4 px-6 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-lg"
                >
                  Перейти до повторення 📌
                </button>

                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="flex-1 min-w-[200px] py-4 px-6 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2"
                >
                  <BookOpen size={20} />
                  {showAnalysis ? "Сховати розбір" : "Показати розбір"}
                </button>

                <button
                  onClick={addToReview}
                  className="py-4 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  📌 Додати в повторення
                </button>
              </div>

              {showAnalysis && (
                <div className="bg-purple-50 p-6 rounded-xl mb-8">
                  <h3 className="text-2xl font-bold text-purple-900 mb-4">Розбір слова</h3>
                  <p><strong>Слово:</strong> {wordData.word}</p>
                  <p><strong>Переклад:</strong> {wordData.translation}</p>
                  <p><strong>Приклад:</strong> {wordData.exampleSentence}</p>
                  <p><strong>Переклад:</strong> {wordData.exampleTranslation}</p>
                </div>
              )}

              {showTest && (
                <div className="space-y-6">
                  {tasksForDay.map((task, idx) => (
                    <div key={idx} className="bg-gray-50 p-6 rounded-xl">
                      <p className="text-xl font-semibold">{task.question}</p>
                      <div className="space-y-3 mt-4">
                        {task.options.map((option, optIdx) => (
                          <label key={optIdx}
                            className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              taskAnswers[idx] === option
                                ? errors[idx]
                                  ? "border-red-500 bg-red-50"
                                  : "border-green-500 bg-green-50"
                                : "border-gray-300 bg-white hover:border-indigo-300"
                            }`}
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
                                const newErr = [...errors];
                                newErr[idx] = false;
                                setErrors(newErr);
                              }}
                              className="mr-3"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                      {errors[idx] && (
                        <p className="text-red-600 font-semibold mt-2">
                          ❌ Правильна відповідь: {task.correctAnswer}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={checkAnswers}
                      className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl"
                    >
                      ✅ Перевірити
                    </button>

                    <button
                      onClick={resetAnswers}
                      className="py-4 px-6 bg-gray-300 rounded-xl flex items-center gap-2"
                    >
                      <RefreshCcw size={20} /> Перемішати знову
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setCurrentDay((prev) => Math.max(1, prev - 1))}
              disabled={currentDay === 1}
              className="py-2 px-4 bg-indigo-600 text-white rounded-xl"
            >
              ◀ Попередній
            </button>

            <button
              onClick={() => {
                if (completedWords.has(currentDay)) {
                  setCurrentDay((prev) => prev + 1);
                }
              }}
              disabled={!completedWords.has(currentDay)}
              className="py-2 px-4 bg-indigo-600 text-white rounded-xl ml-4"
            >
              Наступний ▶
            </button>

            <button
              onClick={resetStatistics}
              className="mt-6 py-3 px-6 bg-red-500 text-white font-bold rounded-xl w-full"
            >
              🗑 Скинути статистику
            </button>
          </>
        )}
      </div>
    </div>
  );
}
