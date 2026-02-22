import { useState } from "react";
import questions from "../data/programmingQuestions";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function TakeQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const { user } = useContext(AuthContext);
  const [topicStats, setTopicStats] = useState({});

  const handleNext = () => {
  const current = questions[currentQuestion];
  const isCorrect = selectedAnswer === current.correctAnswer;

  if (isCorrect) {
    setScore(score + 1);
  }

  // Track topic performance
  setTopicStats((prev) => {
    const topic = current.topic;
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

  if (currentQuestion + 1 < questions.length) {
    setCurrentQuestion(currentQuestion + 1);
  } else {
    setQuizFinished(true);
  }
};

 if (quizFinished) {

  const saveResult = async () => {
    const accuracy = (score / questions.length) * 100;

    await addDoc(collection(db, "quizAttempts"), {
  userId: user.uid,
  score: score,
  total: questions.length,
  accuracy: accuracy,
  topics: topicStats,
  createdAt: serverTimestamp()
});

    alert("Quiz result saved to database!");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Quiz Completed</h2>
      <p>Your Score: {score} / {questions.length}</p>

      <button onClick={saveResult}>Save Result</button>
    </div>
  );
}

  return (
    <div style={{ padding: "40px" }}>
      <h2>Programming Quiz</h2>
      <h3>{questions[currentQuestion].question}</h3>

      {questions[currentQuestion].options.map((option, index) => (
        <div key={index}>
          <label>
            <input
              type="radio"
              value={option}
              checked={selectedAnswer === option}
              onChange={() => setSelectedAnswer(option)}
            />
            {option}
          </label>
        </div>
      ))}

      <br />
      <button onClick={handleNext} disabled={!selectedAnswer}>
        Next
      </button>
    </div>
  );
}

export default TakeQuiz;