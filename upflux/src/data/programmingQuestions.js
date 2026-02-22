const questions = [
  {
    id: 1,
    question: "What is the output of: console.log(2 + '2')?",
    options: ["4", "22", "NaN", "Error"],
    correctAnswer: "22",
    topic: "Data Types"
  },
  {
    id: 2,
    question: "Which loop runs at least once?",
    options: ["for", "while", "do...while", "foreach"],
    correctAnswer: "do...while",
    topic: "Loops"
  },
  {
    id: 3,
    question: "What is recursion?",
    options: [
      "Looping technique",
      "Function calling itself",
      "Array method",
      "Sorting algorithm"
    ],
    correctAnswer: "Function calling itself",
    topic: "Recursion"
  },
  {
    id: 4,
    question: "Which data structure uses LIFO?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correctAnswer: "Stack",
    topic: "Data Structures"
  },
  {
    id: 5,
    question: "Time complexity of binary search?",
    options: ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
    correctAnswer: "O(log n)",
    topic: "Algorithms"
  }
];

export default questions;