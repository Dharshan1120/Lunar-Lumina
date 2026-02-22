import { useEffect, useState, useContext } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { AuthContext } from "../context/AuthContext";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [attempts, setAttempts] = useState([]);
  const [topicData, setTopicData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [velocity, setVelocity] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const q = query(
          collection(db, "quizAttempts"),
          where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc, index) => ({
          attempt: index + 1,
          ...doc.data()
        }));

        setAttempts(data);

        // -------- TOPIC AGGREGATION --------
        let topicAggregate = {};

        data.forEach((attempt) => {
          if (attempt.topics) {
            Object.entries(attempt.topics).forEach(([topic, stats]) => {
              if (!topicAggregate[topic]) {
                topicAggregate[topic] = { topic, correct: 0, total: 0 };
              }

              topicAggregate[topic].correct += stats.correct;
              topicAggregate[topic].total += stats.total;
            });
          }
        });

        const topicChartData = Object.values(topicAggregate).map((t) => ({
          topic: t.topic,
          accuracy: Number(
            ((t.correct / t.total) * 100).toFixed(2)
          )
        }));

        setTopicData(topicChartData);

        // -------- WEIGHTED STAGNATION INDEX --------
        if (data.length >= 2) {
          const first = data[0].accuracy;
          const last = data[data.length - 1].accuracy;

          const slope = (last - first) / data.length;
          setVelocity(slope.toFixed(2));

          const growthDrop = first - last;

          let weaknessScore = 0;
          topicChartData.forEach((t) => {
            if (t.accuracy < 50) {
              weaknessScore += 1;
            }
          });

          const stagnationIndex =
            0.5 * growthDrop +
            0.3 * weaknessScore +
            0.2 * Math.abs(slope);

          if (stagnationIndex > 5) {
            setStatus("⚠ High Stagnation Risk");
          } else {
            setStatus("✅ Stable Learning Growth");
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching attempts:", error);
        setLoading(false);
      }
    };

    if (user) {
      fetchAttempts();
    }
  }, [user]);

  if (loading) {
    return <h2 style={{ padding: "40px" }}>Loading...</h2>;
  }

  return (
    <div style={{ padding: "40px" }}>
      <h2>Dashboard</h2>

      <p>Total Attempts: {attempts.length}</p>

      {velocity && (
        <>
          <h3>Learning Velocity: {velocity}</h3>
          <h3>{status}</h3>
        </>
      )}

      {/* -------- LINE CHART -------- */}
      {attempts.length > 0 && (
        <div style={{ width: "100%", height: 300, marginTop: "30px" }}>
          <h3>Accuracy Trend</h3>
          <ResponsiveContainer>
            <LineChart data={attempts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attempt" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#8884d8"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* -------- TOPIC BAR CHART -------- */}
      {topicData.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h3>Topic-wise Accuracy</h3>
          <BarChart width={500} height={300} data={topicData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="topic" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="accuracy" fill="#82ca9d" />
          </BarChart>
        </div>
      )}
    </div>
  );
}

export default Dashboard;