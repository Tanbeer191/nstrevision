let currentQuestionIndex = 0;
let timerInterval;

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
        window.location.href = "index.html";
    }
}

function loadQuestion(data, examType, examName) {
    const exam = data.types[examType]?.exams[examName]
    const question = exam.questions[currentQuestionIndex];

    document.getElementById("question-number").textContent = question.displayNumber;
    

    const contentText = question.content;
    const contentDiv = document.getElementById("question-content");
    contentDiv.innerHTML = "";
    contentDiv.innerHTML = contentText.join('');
    
    const solutionDiv = document.getElementById("solution");
    solutionDiv.textContent = "";
    solutionDiv.classList.add("hidden");

    const nextButton = document.getElementById("next-button");
    if (currentQuestionIndex === exam.questions.length - 1) {
        nextButton.textContent = "Finish";
        nextButton.onclick = () => {
            window.location.href = "index.html";
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
    const exam = data.types[examType]?.exams[examName]
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

    if (currentPage.includes("index.html")) {
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

        let timerInitialized = false; // Flag to ensure the timer is only started once

        fetch("content.json")
            .then(response => response.json())
            .then(data => {
                const instructions = data.types[examType]?.instructions;
                const exam = data.types[examType]?.exams[examName];

                if (exam) {
                    document.getElementById("exam-name").textContent = exam.name;
                    document.getElementById("exam-date").textContent = exam.date;

                    const tableData = instructions.table;
                    document.getElementById("time").textContent = tableData["displaytime"];

                    const instructionText = instructions.text;
                    const instructionDiv = document.getElementById("instruction-text");
                    instructionDiv.innerHTML = "";
                    instructionText.forEach(line => {
                        const p = document.createElement("p");
                        p.innerHTML = line;
                        instructionDiv.appendChild(p);
                    });

                    document.getElementById("next-button").addEventListener("click", function () {
                        document.getElementById("instructions-page").style.display = "none";  
                        document.getElementById("exam-page").style.display = "block";  

                        if (!timerInitialized) { // Start the timer only if it hasn't been started
                            timerInitialized = true;
                            let timeRemaining = parseInt(tableData["time"]); 
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

                        loadQuestion(data, examType, examName);

                        const viewSolutionButton = document.getElementById("view-solution");
                        viewSolutionButton.classList.remove("hidden");
                        viewSolutionButton.textContent = "View Solution";
                        viewSolutionButton.onclick = () => toggleSolution(data, examType, examName);
                    });
                } else {
                    console.error("Exam not found in content.json");
                }
            })
            .catch(error => console.error("Error loading content.json:", error));
    }
});

