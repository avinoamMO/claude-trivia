require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Question = require("./models/Question");

const QUESTIONS_DIR = path.join(__dirname, "..", "questions");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/claude-trivia");
  console.log("Connected to MongoDB");

  // Load all domain JSON files
  const files = fs.readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.error("No question files found in", QUESTIONS_DIR);
    process.exit(1);
  }

  let allQuestions = [];
  const stats = { byCategory: {}, bySubtopic: {}, byDifficulty: {} };

  for (const file of files) {
    const filePath = path.join(QUESTIONS_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    let questions;
    try {
      questions = JSON.parse(raw);
    } catch (err) {
      console.error(`Invalid JSON in ${file}:`, err.message);
      continue;
    }

    // Validate each question
    const valid = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const errors = [];

      if (!q.category) errors.push("missing category");
      if (!q.subtopic) errors.push("missing subtopic");
      if (!q.difficulty || q.difficulty < 1 || q.difficulty > 5) errors.push("invalid difficulty");
      if (!q.question) errors.push("missing question");
      if (!Array.isArray(q.options) || q.options.length !== 4) errors.push("options must be array of 4");
      if (q.correctIndex === undefined || q.correctIndex < 0 || q.correctIndex > 3) errors.push("invalid correctIndex");
      if (!q.deeperKnowledge) errors.push("missing deeperKnowledge");
      if (!q.wrongExplanations) errors.push("missing wrongExplanations");

      if (errors.length > 0) {
        console.warn(`  ${file}[${i}]: ${errors.join(", ")} — skipping`);
        continue;
      }

      valid.push(q);

      // Track stats
      stats.byCategory[q.category] = (stats.byCategory[q.category] || 0) + 1;
      stats.bySubtopic[q.subtopic] = (stats.bySubtopic[q.subtopic] || 0) + 1;
      stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
    }

    console.log(`${file}: ${valid.length}/${questions.length} valid questions`);
    allQuestions = allQuestions.concat(valid);
  }

  if (allQuestions.length === 0) {
    console.error("No valid questions to seed!");
    process.exit(1);
  }

  // Clear existing and insert
  await Question.deleteMany({});
  console.log("Cleared existing questions");

  const result = await Question.insertMany(allQuestions);
  console.log(`\nSeeded ${result.length} questions total\n`);

  // Print breakdown
  console.log("By Category:");
  for (const [cat, count] of Object.entries(stats.byCategory).sort()) {
    console.log(`  ${cat}: ${count}`);
  }

  console.log("\nBy Subtopic:");
  for (const [sub, count] of Object.entries(stats.bySubtopic).sort()) {
    console.log(`  ${sub}: ${count}`);
  }

  console.log("\nBy Difficulty:");
  for (const [diff, count] of Object.entries(stats.byDifficulty).sort()) {
    const labels = { 1: "What is this?", 2: "How does it work?", 3: "What's wrong here?", 4: "Why did it break?", 5: "Architect it" };
    console.log(`  Level ${diff} (${labels[diff]}): ${count}`);
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
