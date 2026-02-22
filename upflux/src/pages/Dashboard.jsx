import { useEffect, useState, useContext, useMemo } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("All");

  const [loading, setLoading] = useState(true);
  const [velocity, setVelocity] = useState(null);
  const [status, setStatus] = useState("");
  const [insight, setInsight] = useState("");

  const [totalXP, setTotalXP] = useState(0);
  const [level, setLevel] = useState(1);

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    const fetchAttempts = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "quizAttempts"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "asc")
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc, index) => ({
          attempt: index + 1,
          accuracy: doc.data().accuracy || 0,
          topics: doc.data().topics || {},
          xp: doc.data().xp || 0,
          ...doc.data()
        }));

        setAttempts(data);

        // XP calculation
        let xpSum = 0;
        data.forEach((a) => (xpSum += a.xp || 0));
        setTotalXP(xpSum);
        setLevel(Math.floor(xpSum / 200) + 1);

        // Static topic list
        setAvailableTopics([
          "Data Structures",
          "OOPS",
          "Python",
          "Machine Learning"
        ]);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching attempts:", err);
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [user]);

  // ---------------- FILTER BY TOPIC ----------------
  const displayAttempts = useMemo(() => {
    if (selectedTopic === "All") return attempts;

    return attempts
      .map((attempt) => {
        const topicStats = attempt.topics?.[selectedTopic];
        if (!topicStats) return null;

        return {
          ...attempt,
          accuracy:
            (topicStats.correct / topicStats.total) * 100
        };
      })
      .filter(Boolean);
  }, [attempts, selectedTopic]);

  // ---------------- ANALYTICS ENGINE ----------------
  useEffect(() => {
    if (displayAttempts.length < 2) {
      setVelocity(null);
      setStatus("");
      setInsight("");
      return;
    }

    const first = displayAttempts[0].accuracy;
    const last =
      displayAttempts[displayAttempts.length - 1].accuracy;

    const slope =
      (last - first) / (displayAttempts.length - 1);

    setVelocity(slope.toFixed(2));

    const growthDrop = first - last;
    const stagnationIndex =
      0.5 * growthDrop + 0.2 * Math.abs(slope);

    let insights = [];

    // Growth insight
    if (slope < 0) {
      insights.push(
        "Your performance trend is declining. Immediate revision recommended."
      );
    } else if (slope < 1) {
      insights.push(
        "Growth rate is slow. Increase focused practice."
      );
    } else {
      insights.push(
        "Learning curve improving steadily."
      );
    }

    // Consistency insight
    const accuracies = displayAttempts.map((a) => a.accuracy);
    const variance =
      Math.max(...accuracies) -
      Math.min(...accuracies);

    if (variance > 40) {
      insights.push(
        "Performance is inconsistent. Maintain steady practice."
      );
    }

    // XP insight
    if (totalXP < 200) {
      insights.push(
        "Early learning stage. Complete more quizzes to level up."
      );
    } else if (level >= 3) {
      insights.push(
        "Strong engagement detected. Try higher difficulty quizzes."
      );
    }

    setInsight(insights.join(" "));

    if (stagnationIndex > 5) {
      setStatus("⚠ High Stagnation Risk");
    } else {
      setStatus("✅ Stable Learning Growth");
    }
  }, [displayAttempts, totalXP, level]);

  if (loading) {
    return <h2 style={{ padding: "40px" }}>Loading...</h2>;
  }

  return (
    <div style={{ padding: "40px" }}>
      <h2>Dashboard</h2>

      <button
        onClick={() => navigate("/quiz")}
        style={{
          marginTop: "15px",
          padding: "8px 16px",
          backgroundColor: "#6366f1",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Start Quiz
      </button>

      {/* XP */}
      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#ecfdf5",
          borderRadius: "8px",
          border: "1px solid #10b981"
        }}
      >
        <h3>Level: {level}</h3>
        <p>Total XP: {totalXP}</p>
      </div>

      {/* Topic Filter */}
      <div style={{ marginTop: "20px" }}>
        <h3>Filter by Topic</h3>
        <select
          value={selectedTopic}
          onChange={(e) =>
            setSelectedTopic(e.target.value)
          }
        >
          <option value="All">All Topics</option>
          {availableTopics.map((topic, index) => (
            <option key={index} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <p style={{ marginTop: "20px" }}>
        Total Attempts: {displayAttempts.length}
      </p>

      {velocity !== null && (
        <>
          <h3>Learning Velocity: {velocity}</h3>
          <h3>{status}</h3>
          {insight && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                backgroundColor: "#f0f4ff",
                borderRadius: "8px"
              }}
            >
              <strong>AI Insight:</strong>
              <p>{insight}</p>
            </div>
          )}
        </>
      )}

      {/* Chart */}
      {displayAttempts.length > 0 && (
        <div
          style={{
            width: "100%",
            height: 300,
            marginTop: "30px"
          }}
        >
          <ResponsiveContainer>
            <LineChart data={displayAttempts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attempt" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#6366f1"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default Dashboard;