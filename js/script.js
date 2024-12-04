let currentQuestionIndex = 0;
let timerInterval;
let timerInitialized = false;

function showSubject(subjectId) {
    document.querySelectorAll('.subject-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const subjectElement = document.getElementById(subjectId);
    if (subjectElement) {
        subjectElement.classList.add('active');
    }

    const tabElement = document.querySelector(`.tab[onclick="showSubject('${subjectId}')"]`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
}

function endExam() {
    const confirmEnd = confirm("Are you sure you want to end the exam?");
    if (confirmEnd) {
        clearInterval(timerInterval);
        window.location.href = "../index.html";
    }
}

function loadQuestion(data, examType, examName) {
    const question = data.questions[currentQuestionIndex];

    if (examType === "custom") {
        const questionTypeCounts = {
            saq: 0,
            mcq: 0,
            essay: 0,
            prac: 0
        };

        data.questions.forEach(q => {
            questionTypeCounts[q.type]++;
        });

        let questionIndex = 1;
        let questionTypeIndex = 1;
        for (const q of data.questions) {
            if (q.type === question.type) {
                if (q === question) {
                    break;
                }
                questionTypeIndex++;
            }
            questionIndex++;
        }

        const questionTypeNames = {
            saq: "SAQ",
            mcq: "MCQ",
            essay: "Essay",
            prac: "Practical"
        };

        document.getElementById("question-number").textContent = `${questionTypeNames[question.type]} ${questionTypeIndex}/${questionTypeCounts[question.type]}`;
    } else {
        document.getElementById("question-number").textContent = question.displayNumber;
    }

    const contentText = question.content;
    const contentDiv = document.getElementById("question-content");
    contentDiv.innerHTML = "";
    contentDiv.innerHTML = contentText.join('');

    if (examType !== "custom") {
        const subInstructionText = question["sub-instructions"];
        const subInstructionDiv = document.getElementById("sub-instructions");
        subInstructionDiv.innerHTML = "";
        if (Array.isArray(subInstructionText)) {
            subInstructionDiv.innerHTML = subInstructionText.join('');
        } else {
            subInstructionDiv.innerHTML = subInstructionText;
        }
        subInstructionDiv.style.display = subInstructionText ? "block" : "none"; // Hide if no sub instructions
    }

    const solutionDiv = document.getElementById("solution");
    solutionDiv.textContent = "";
    solutionDiv.classList.add("hidden");

    const marksDisplay = document.getElementById("marks-display");
    if (question.marks) {
        marksDisplay.textContent = `Marks: ${question.marks}`;
        marksDisplay.style.display = "block";
    } else {
        marksDisplay.style.display = "none";
    }

    const nextButton = document.getElementById("next-button");
    if (currentQuestionIndex === data.questions.length - 1) {
        nextButton.textContent = "Finish";
        nextButton.onclick = () => {
            window.location.href = "../index.html";
        };
    } else {
        nextButton.textContent = "Next";
        nextButton.onclick = () => {
            currentQuestionIndex++;
            loadQuestion(data, examType, examName);
        };
    }

    const prevButton = document.getElementById("prev-button");
    if (currentQuestionIndex > 0) {
        prevButton.classList.remove("hidden");
        prevButton.onclick = () => {
            currentQuestionIndex--;
            document.getElementById("view-solution").textContent = "View Solution";
            loadQuestion(data, examType, examName);
        };
    } else {
        prevButton.classList.add("hidden");
    }
}

function toggleSolution(data, examType, examName) {
    const viewSolutionButton = document.getElementById("view-solution");
    const solutionDiv = document.getElementById("solution");
    const question = data.questions[currentQuestionIndex];
    const solutionText = question.solution;

    if (solutionDiv.classList.contains("hidden")) { 
        solutionDiv.innerHTML = "";
        solutionText.forEach(line => {
            const p = document.createElement("p");
            p.innerHTML = line;
            solutionDiv.appendChild(p);
        });
        solutionDiv.classList.remove("hidden");
        viewSolutionButton.textContent = "Hide Solution";
    } else {
        solutionDiv.textContent = "";
        solutionDiv.classList.add("hidden");
        viewSolutionButton.textContent = "View Solution";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname;

    if (currentPage.includes("../index.html")) {
        const defaultSubjectID = "cells";
        if (document.getElementById(defaultSubjectID)) {
            showSubject(defaultSubjectID);
        } else {
            console.error(`Element with id '${defaultSubjectID}' not found.`);
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname;

    if (currentPage.includes("exam.html")) {
        const urlParams = new URLSearchParams(window.location.search);
        const examType = urlParams.get("type");
        const examName = urlParams.get("name");

        if (examType && examName) {
            if (examType === "custom") {
                const customExamData = JSON.parse(localStorage.getItem("customExamData"));
                if (customExamData) {
                    customExamData.questions.sort((a, b) => a.type.localeCompare(b.type));
                    loadExam(customExamData, examType, examName);
                } else {
                    console.error("Custom exam data not found.");
                    alert("Custom exam data not found. Please create a custom exam first.");
                    window.location.href = "../index.html";
                }
            } else {
                let contentUrl = `../content/${examType}/${examName}.json`;

                fetch(contentUrl)
                    .then(response => response.json())
                    .then(data => {
                        loadExam(data, examType, examName);
                    })
                    .catch(error => console.error("Error loading exam JSON:", error));
            }
        } else {
            console.error("Invalid exam type or name.");
        }
    }

    function loadExam(data, examType, examName) {
        const exam = data;
        if (exam) {
            document.getElementById("exam-name").textContent = exam.name;
            document.getElementById("exam-date").textContent = exam.date;

            const instructions = exam.instructions;
            document.getElementById("time").textContent = exam.displayTime;

            const instructionText = instructions.text;
            const instructionDiv = document.getElementById("instruction-text");
            instructionDiv.innerHTML = "";
            instructionText.forEach(line => {
                const p = document.createElement("p");
                p.innerHTML = line;
                instructionDiv.appendChild(p);
            });

            document.getElementById("marks-display").style.display = "none"; // Hide marks display initially

            document.getElementById("next-button").addEventListener("click", function () {
                document.getElementById("instructions-page").style.display = "none";
                document.getElementById("exam-page").style.display = "block";

                if (!timerInitialized) { // Start the timer only if it hasn't been started
                    timerInitialized = true;
                    if (parseInt(exam.time) === 0) {
                        document.getElementById("timer").style.display = "none";
                    } else {
                        document.getElementById("timer").style.display = "block";
                        let timeRemaining = parseInt(exam.time);
                        timerInterval = setInterval(() => {
                            const minutes = Math.floor(timeRemaining / 60);
                            const seconds = timeRemaining % 60;
                            document.getElementById("timer").textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
                            timeRemaining--;

                            if (timeRemaining < 0) {
                                clearInterval(timerInterval);
                            }
                        }, 1000);
                    }
                }

                loadQuestion(data, examType, examName);

                const viewSolutionButton = document.getElementById("view-solution");
                viewSolutionButton.classList.remove("hidden");
                viewSolutionButton.textContent = "View Solution";
                viewSolutionButton.onclick = () => toggleSolution(data, examType, examName);
            });
        } else {
            console.error("Exam not found in content.json");
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("custom-exam.html")) {
        const urlParams = new URLSearchParams(window.location.search);
        const subjectType = urlParams.get("type");
        document.getElementById("subject-type").value = subjectType;

        const questionTypeCheckboxes = document.querySelectorAll("input[name='question-type']");
        const questionDetailsDiv = document.getElementById("question-details");
        const questionCounts = {};

        const questionTypeNames = {
            saq: "Short Answer Questions (SAQs)",
            mcq: "Multiple Choice Questions (MCQs)",
            essay: "Essay Questions",
            prac: "Practical Questions"
        };

        questionTypeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                questionDetailsDiv.innerHTML = '';

                questionTypeCheckboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        const div = document.createElement("div");
                        div.classList.add("form-group");
                        div.innerHTML = `
                            <label for="${checkbox.value}-count">Number of ${questionTypeNames[checkbox.value]}:</label>
                            <input type="number" id="${checkbox.value}-count" name="${checkbox.value}-count" min="1">
                        `;
                        questionDetailsDiv.appendChild(div);
                    }
                });
            });
        });

        const customExamForm = document.getElementById("custom-exam-form");
        if (customExamForm) {
            customExamForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                const selectedQuestions = {};
                let totalQuestions = 0;

                for (const checkbox of questionTypeCheckboxes) {
                    if (checkbox.checked) {
                        const count = parseInt(document.getElementById(`${checkbox.value}-count`).value);
                        if (count > 0) {
                            selectedQuestions[checkbox.value] = count;
                            totalQuestions += count;
                        }
                    }
                }

                if (totalQuestions === 0) {
                    alert("Please select at least one question type and enter the number of questions.");
                    return;
                }

                try {
                    const allQuestions = [];
                    const response = await fetch(`../content/${subjectType}/`);
                    const text = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    const files = Array.from(doc.querySelectorAll('a'))
                        .map(link => link.getAttribute('href'))
                        .filter(href => href.endsWith('.json'));

                    for (const file of files) {
                        const fileResponse = await fetch(file);
                        if (fileResponse.ok) {
                            const data = await fileResponse.json();
                            allQuestions.push(...data.questions);
                        }
                    }

                    const selectedSet = [];
                    const alertMessages = [];
                    for (const [type, count] of Object.entries(selectedQuestions)) {
                        const questionsOfType = allQuestions.filter(q => q.type === type);
                        if (questionsOfType.length < count) {
                            alertMessages.push(`Not enough ${questionTypeNames[type]} available. Requested: ${count}, Available: ${questionsOfType.length}`);
                        }
                    }

                    if (alertMessages.length > 0) {
                        alert(alertMessages.join('\n'));
                        return;
                    }

                    for (const [type, count] of Object.entries(selectedQuestions)) {
                        const questionsOfType = allQuestions.filter(q => q.type === type);
                        while (selectedSet.filter(q => q.type === type).length < count) {
                            const randomIndex = Math.floor(Math.random() * questionsOfType.length);
                            selectedSet.push(questionsOfType.splice(randomIndex, 1)[0]);
                        }
                    }

                    // Sort questions by type
                    selectedSet.sort((a, b) => a.type.localeCompare(b.type));

                    // Redirect to custom exam page with selected questions
                    const customExamData = {
                        name: "Custom Exam",
                        date: new Date().toLocaleDateString(),
                        time: 0,
                        displayTime: "Unlimited",
                        instructions: {
                            table: {},
                            text: ["Answer all questions."]
                        },
                        questions: selectedSet
                    };

                    localStorage.setItem("customExamData", JSON.stringify(customExamData));
                    window.location.href = "/html/exam.html?type=custom&name=custom";
                } catch (error) {
                    console.error("Error building custom exam:", error);
                }
            });
        }
    }
});