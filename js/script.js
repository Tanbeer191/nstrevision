let currentQuestionIndex = 0;
let timerInterval;
let timerInitialized = false; // Define timerInitialized at the appropriate scope

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
        window.location.href = "/index.html";
    }
}

function loadQuestion(data, examType, examName) {
    const exam = data.types[examType]?.exams[examName];
    const question = exam.questions[currentQuestionIndex];

    if (examName === "custom") {
        const questionTypeCounts = {
            saq: 0,
            mcq: 0,
            essay: 0,
            prac: 0
        };

        exam.questions.forEach(q => {
            questionTypeCounts[q.type]++;
        });

        const questionTypeIndex = {
            saq: 0,
            mcq: 0,
            essay: 0,
            prac: 0
        };

        for (let i = 0; i <= currentQuestionIndex; i++) {
            questionTypeIndex[exam.questions[i].type]++;
        }

        const questionTypeName = {
            saq: "SAQ",
            mcq: "MCQ",
            essay: "Essay",
            prac: "Practical"
        };

        const displayNumber = `${questionTypeName[question.type]} ${questionTypeIndex[question.type]}/${questionTypeCounts[question.type]}`;
        document.getElementById("question-number").textContent = displayNumber;
    } else {
        document.getElementById("question-number").textContent = question.displayNumber;
    }

    const contentText = question.content;
    const contentDiv = document.getElementById("question-content");
    contentDiv.innerHTML = "";
    contentDiv.innerHTML = contentText.join('');

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
    if (currentQuestionIndex === exam.questions.length - 1) {
        nextButton.textContent = "Finish";
        nextButton.onclick = () => {
            window.location.href = "/index.html";
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
    const exam = data.types[examType]?.exams[examName];
    const question = exam.questions[currentQuestionIndex];
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

    if (currentPage.includes("/index.html")) {
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

        let contentUrl = "/content/content.json";
        if (examType === "cells" && examName === "custom") {
            const tempContent = localStorage.getItem("tempContent");
            if (tempContent) {
                loadExam(JSON.parse(tempContent));
                return;
            } else {
                console.error("Custom exam data not found in localStorage.");
                alert("An error occurred while loading the custom exam. Please try again.");
                return;
            }
        }

        fetch(contentUrl)
            .then(response => response.json())
            .then(data => {
                loadExam(data);
            })
            .catch(error => console.error("Error loading content.json:", error));
    }

    function loadExam(data) {
        const urlParams = new URLSearchParams(window.location.search);
        const examType = urlParams.get("type");
        const examName = urlParams.get("name");

        const exam = data.types[examType]?.exams[examName];

        if (exam) {
            document.getElementById("exam-name").textContent = exam.name;
            document.getElementById("exam-date").textContent = exam.date;

            const instructions = exam.instructions;
            const tableData = instructions.table;
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
                        const timerInterval = setInterval(() => {
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
                        const label = document.createElement("label");
                        label.textContent = `Number of ${questionTypeNames[checkbox.value]}: `;
                        questionDetailsDiv.appendChild(label);

                        const input = document.createElement("input");
                        input.type = "number";
                        input.name = `${checkbox.value}-count`;
                        input.min = "1";
                        input.max = "100";
                        input.required = true;
                        input.value = questionCounts[checkbox.value] || '';
                        input.addEventListener("input", () => {
                            questionCounts[checkbox.value] = input.value;
                        });
                        questionDetailsDiv.appendChild(input);
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
                        const count = parseInt(questionCounts[checkbox.value], 10);
                        if (isNaN(count) || count <= 0) {
                            alert(`Please enter a valid number of ${questionTypeNames[checkbox.value]}`);
                            return;
                        }
                        selectedQuestions[checkbox.value] = count;
                        totalQuestions += count;
                    }
                }

                if (totalQuestions === 0) {
                    alert("Please select at least one question type and enter the number of questions.");
                    return;
                }

                try {
                    const response = await fetch("/content/content.json");
                    const data = await response.json();
                    const subjectExams = data.types[subjectType].exams;

                    const allQuestions = [];
                    for (const exam of Object.values(subjectExams)) {
                        allQuestions.push(...exam.questions);
                    }

                    const selectedSet = [];
                    for (const [type, count] of Object.entries(selectedQuestions)) {
                        const questionsOfType = allQuestions.filter(q => q.type === type);
                        if (questionsOfType.length < count) {
                            alert(`Not enough ${questionTypeNames[type]} available. Please reduce the number.`);
                            return;
                        }
                        const shuffled = questionsOfType.sort(() => 0.5 - Math.random());
                        selectedSet.push(...shuffled.slice(0, count));
                    }

                    // Sort questions by type
                    selectedSet.sort((a, b) => {
                        const typeOrder = ["saq", "mcq", "prac", "essay"];
                        return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
                    });

                    const tempContent = {
                        types: {
                            [subjectType]: {
                                exams: {
                                    custom: {
                                        name: "Custom Exam",
                                        date: new Date().toLocaleDateString(),
                                        time: 0,
                                        displayTime: "Custom",
                                        instructions: {
                                            table: {},
                                            text: ["Answer all questions."]
                                        },
                                        questions: selectedSet
                                    }
                                }
                            }
                        }
                    };

                    localStorage.setItem("tempContent", JSON.stringify(tempContent));

                    window.location.href = `exam.html?type=${subjectType}&name=custom`;
                } catch (error) {
                    console.error("Error fetching or processing content.json:", error);
                    alert("An error occurred while building the exam. Please try again.");
                }
            });
        }
    }
});