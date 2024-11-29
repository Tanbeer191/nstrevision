function showSubject(subjectId) {
    document.querySelectorAll('.subject-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    if (document.getElementById(subjectId)) {
        document.getElementById(subjectId).classList.add('active');
    }
    document.querySelector(`.tab[onclick="showSubject('${subjectId}')"]`).classList.add('active');
}

function endExam() {
    const confirmEnd = confirm("Are you sure you want to end the exam?");
    if (confirmEnd) {
        window.location.href = "index.html";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const defaultSubjectID = "cells";
    showSubject(defaultSubjectID);
});

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const examType = urlParams.get("type");
    const examName = urlParams.get("name");

    fetch("content.json")
        .then(response => response.json())
        .then(data => {
            const instructions = data.types[examType]?.instructions;
            const exam = data.types[examType]?.exams[examName];

            console.log("Hello")
            console.log(instructions)
            console.log(exam)
            
            if (exam) {
                document.getElementById("exam-name").textContent = exam.name;
                document.getElementById("exam-date").textContent = exam.date;

                const tableData = instructions.table;
                document.getElementById("time").textContent = tableData["Time"];

                const instuctionText = instructions.text;
                const instructionDiv = document.getElementById("instruction-text");
                instructionDiv.innerHTML = "";
                instuctionText.forEach(line => {
                    const p = document.createElement("p");
                    p.innerHTML = line;
                    instructionDiv.appendChild(p);
                });
                
            } else {
                console.error("Exam not found in content.json");
            }
        })
        .catch(error => console.error("Error loading content.json:", error));
});

