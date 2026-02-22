import { useState, useContext } from "react";
import questions from "../data/programmingQuestions";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { AuthContext } from "../context/AuthContext";

function TakeQuiz() {
  const { user } = useContext(AuthContext);

  // ---------- NORMAL QUIZ STATES ----------
  const [selectedTopic, setSelectedTopic] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [topicStats, setTopicStats] = useState({});

  // ---------- AI STATES ----------
  const [uploadedFile, setUploadedFile] = useState(null);
  const [difficulty, setDifficulty] = useState("");

  // ---------- START NORMAL QUIZ ----------
  const startQuiz = () => {
    if (!selectedTopic) {
      alert("Please select a topic");
      return;
    }
console.log(selectedTopic, selectedDifficulty);
    let filtered = questions.filter((q) =>
  (selectedTopic === "All" || q.topic === selectedTopic) &&
  (selectedDifficulty === "All" || q.difficulty === selectedDifficulty)
);

    if (filtered.length === 0) {
      alert("No questions available for this topic.");
      return;
    }

    setFilteredQuestions(filtered);
    setQuizStarted(true);
  };

  // ---------- GENERATE AI QUIZ ----------
  const generateQuiz = async () => {
    if (!uploadedFile || !difficulty) {
      alert("Upload file and select difficulty");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("difficulty", difficulty);

    const response = await fetch(
      "http://localhost:5000/generate-quiz",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    setFilteredQuestions(data);
    setQuizStarted(true);
  };

  // ---------- HANDLE NEXT ----------
  const handleNext = () => {
    const current = filteredQuestions[currentQuestion];
    const isCorrect = selectedAnswer === current.correctAnswer;

    if (isCorrect) setScore((prev) => prev + 1);

    setTopicStats((prev) => {
      const topic = current.topic || "AI";
      const prevTopic = prev[topic] || { correct: 0, total: 0 };

      return {
        ...prev,
        [topic]: {
          correct: prevTopic.correct + (isCorrect ? 1 : 0),
          total: prevTopic.total + 1
        }
      };
    });

    setSelectedAnswer(null);

    if (currentQuestion + 1 < filteredQuestions.length) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  // ---------- SAVE RESULT ----------
  const saveResult = async () => {
    if (!user?.uid) return;

    const accuracy =
      (score / filteredQuestions.length) * 100;

    const xpEarned = score * 10;

    await addDoc(collection(db, "quizAttempts"), {
      userId: user.uid,
      score,
      total: filteredQuestions.length,
      accuracy,
      topics: topicStats,
      xp: xpEarned,
      createdAt: serverTimestamp()
    });

    alert("Quiz result saved!");
  };

  // ---------- FINISHED SCREEN ----------
  if (quizFinished) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Quiz Completed</h2>
        <p>
          Score: {score} / {filteredQuestions.length}
        </p>
        <button onClick={saveResult}>
          Save Result
        </button>
      </div>
    );
  }

  // ---------- TOPIC SELECTION SCREEN ----------
  if (!quizStarted) {
    const uniqueTopics = [
      ...new Set(questions.map((q) => q.topic))
    ];

    return (
      <div style={{ padding: "40px" }}>
        <h2>Select Topic</h2>

        <select
        
          value={selectedTopic}
          onChange={(e) =>
            setSelectedTopic(e.target.value)
          }
        >
          <option value="">-- Choose Topic --</option>
          {uniqueTopics.map((topic, index) => (
            <option key={index} value={topic}>
              {topic}
            </option>
          ))}
          <option value="All">All Topics</option>
        </select>
        <h3>Select Difficulty</h3>

<select
  value={selectedDifficulty}
  onChange={(e) => setSelectedDifficulty(e.target.value)}
>
  <option value="All">All</option>
  <option value="easy">Easy</option>
  <option value="medium">Medium</option>
  <option value="hard">Hard</option>
</select>

        <button
          onClick={startQuiz}
          style={{ marginLeft: "10px" }}
        >
          Start Quiz
        </button>

        <hr style={{ margin: "30px 0" }} />

        <h2>Generate AI Quiz</h2>

        <input
          type="file"
          accept=".txt,.pdf"
          onChange={(e) =>
            setUploadedFile(e.target.files[0])
          }
        />

        <br /><br />

        <select
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value)
          }
        >
          <option value="">-- Select Difficulty --</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <button
          onClick={generateQuiz}
          style={{ marginLeft: "10px" }}
        >
          Generate AI Quiz
        </button>
      </div>
    );
  }

  // ---------- QUIZ SCREEN ----------
  return (
    <div style={{ padding: "40px" }}>
      <h2>Quiz</h2>

      <h3>
        {filteredQuestions[currentQuestion]?.question}
      </h3>

      {filteredQuestions[currentQuestion]?.options.map(
        (option, index) => (
          <div key={index}>
            <label>
              <input
                type="radio"
                value={option}
                checked={selectedAnswer === option}
                onChange={() =>
                  setSelectedAnswer(option)
                }
              />
              {option}
            </label>
          </div>
        )
      )}

      <br />

      <button
        onClick={handleNext}
        disabled={!selectedAnswer}
      >
        Next
      </button>
    </div>
  );
}

export default TakeQuiz;