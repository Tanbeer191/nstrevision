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

    // Clear previous content
    document.getElementById("question-number").textContent = "";
    document.getElementById("question-content").innerHTML = "";
    document.getElementById("sub-instructions").innerHTML = "";
    document.getElementById("solution").textContent = "";
    document.getElementById("solution").classList.add("hidden");
    document.getElementById("question-origin").textContent = ""; 

    if (examType === "custom") {
        const questionTypeCounts = {
            saq: 0,
            mcq: 0,
            essay: 0,
            prac: 0,
            maths: 0
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
            prac: "Practical",
            maths: "Maths"
        };

        document.getElementById("question-number").textContent = `${questionTypeNames[question.type]} ${questionTypeIndex}/${questionTypeCounts[question.type]}`;
    } else {
        document.getElementById("question-number").textContent = question.displayNumber;
    }

    const contentText = question.content;
    const contentDiv = document.getElementById("question-content");
    contentDiv.innerHTML = "";
    contentDiv.innerHTML = contentText.join('');
    MathJax.typeset()

    const subInstructionText = question["sub-instructions"];
    const subInstructionDiv = document.getElementById("sub-instructions");
    if (examType !== "custom") {
        if (!subInstructionText || subInstructionText.length === 0) {
            subInstructionDiv.style.display = "none";
        } else {
            subInstructionDiv.style.display = "block";
            subInstructionDiv.innerHTML = "";
            if (Array.isArray(subInstructionText)) {
                subInstructionDiv.innerHTML = subInstructionText.join('');
            } else {
                subInstructionDiv.innerHTML = subInstructionText;
            }
        }
    } else {    
        subInstructionDiv.style.display = "none";   
        const yearMatch = question.fileName.match(/(\d{4})/);
        const year = yearMatch ? yearMatch[1] : "Unknown Year";
        const originText = `Source: ${question.sourceName} (${year}) - ${question.displayNumber}`;
        document.getElementById("question-origin").textContent = originText;
    }

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

    // Update the dropdown selection
    document.getElementById("question-dropdown").value = currentQuestionIndex;
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

function updateTotalCount() {
    const topicLists = document.querySelectorAll(".topic-list");
    topicLists.forEach(list => {
        const questionType = list.getAttribute("data-question-type");
        const topicItems = list.querySelectorAll(".topic-item");
        let totalSelected = 0;

        topicItems.forEach(item => {
            const topicCount = parseInt(item.querySelector(".topic-count").value, 10);
            if (!isNaN(topicCount)) {
                totalSelected += topicCount;
            }
        });

        const questionCountInput = document.getElementById(`${questionType}-count`);
        if (questionCountInput) {
            questionCountInput.value = totalSelected;
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname;

    if (document.querySelector(".exam-section")) {
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

    if (currentPage.includes("/exam.html")) {
        const urlParams = new URLSearchParams(window.location.search);
        const examType = urlParams.get("type");
        const examName = urlParams.get("name");

        if (examType && examName) {
            if (examType === "custom") {
                const customExamData = JSON.parse(localStorage.getItem("customExamData"));
                if (customExamData) {
                    loadExam(customExamData, examType, examName);
                } else {
                    console.error("Custom exam data not found.");
                }
            } else {
                let contentUrl = `../content/json/${examType}/${examName}.json`;

                fetch(contentUrl)
                    .then(response => response.json())
                    .then(data => loadExam(data, examType, examName))
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

            const questionDropdown = document.getElementById("question-dropdown");
            questionDropdown.innerHTML = "";
            data.questions.forEach((question, index) => {
                const option = document.createElement("option");
                option.value = index;
                if (examType === "custom") {
                    const questionTypeNames = {
                        saq: "SAQ",
                        mcq: "MCQ",
                        essay: "Essay",
                        prac: "Practical",
                        maths: "Maths"
                    };
                    const questionTypeCounts = {
                        saq: 0,
                        mcq: 0,
                        essay: 0,
                        prac: 0,
                        maths: 0
                    };
                    data.questions.forEach(q => {
                        questionTypeCounts[q.type]++;
                    });
                    let questionTypeIndex = 1;
                    for (let i = 0; i < index; i++) {
                        if (data.questions[i].type === question.type) {
                            questionTypeIndex++;
                        }
                    }
                    option.textContent = `${questionTypeNames[question.type]} ${questionTypeIndex}/${questionTypeCounts[question.type]}`;
                } else {
                    option.textContent = question.displayNumber || `Question ${index + 1}`;
                }
                questionDropdown.appendChild(option);
            });

            questionDropdown.classList.add("hidden"); // Hide dropdown initially

            questionDropdown.addEventListener("change", function () {
                currentQuestionIndex = parseInt(this.value);
                loadQuestion(data, examType, examName);
                document.getElementById("instructions-page").style.display = "none"; // Hide the instruction page
                document.getElementById("exam-page").style.display = "block"; // Ensure the exam page is displayed
                questionDropdown.classList.remove("hidden"); // Show dropdown when exam starts
            });

            document.getElementById("next-button").addEventListener("click", function () {
                document.getElementById("instructions-page").style.display = "none";
                document.getElementById("exam-page").style.display = "block";
                questionDropdown.classList.remove("hidden"); // Show dropdown when exam starts

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
        const questionTypeNames = {
            saq: "Short Answer Questions (SAQs)",
            mcq: "Multiple Choice Questions (MCQs)",
            essay: "Essay Questions",
            prac: "Practical Questions",
            maths: "Maths Questions"
        };

        questionTypeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                questionTypeCheckboxes.forEach(checkbox => {
                    if (checkbox.checked && !document.getElementById(`${checkbox.value}-count`)) {
                        const div = document.createElement("div");
                        div.classList.add("form-group");
                        div.innerHTML = `
                            <label for="${checkbox.value}-count">Number of ${questionTypeNames[checkbox.value]}:</label>
                            <input type="number" id="${checkbox.value}-count" name="${checkbox.value}-count" min="1">
                        `;
                        questionDetailsDiv.appendChild(div);
                    } else if (!checkbox.checked && document.getElementById(`${checkbox.value}-count`)) {
                        document.getElementById(`${checkbox.value}-count`).parentElement.remove();
                    }
                });
            });
        });

        // Restore state when page loads
        const checkboxStates = JSON.parse(localStorage.getItem("checkboxStates"));
        if (checkboxStates) {
            checkboxStates.forEach(state => {
                const checkbox = document.getElementById(state.id);
                if (checkbox) {
                    checkbox.checked = state.checked;
                    if (state.checked && !document.getElementById(`${checkbox.value}-count`)) {
                        const div = document.createElement("div");
                        div.classList.add("form-group");
                        div.innerHTML = `
                            <label for="${checkbox.value}-count">Number of ${questionTypeNames[checkbox.value]}:</label>
                            <input type="number" id="${checkbox.value}-count" name="${checkbox.value}-count" min="1">
                        `;
                        questionDetailsDiv.appendChild(div);
                    }
                }
            });
        }

        const inputCounts = JSON.parse(localStorage.getItem("inputCounts"));
        if (inputCounts) {
            inputCounts.forEach(state => {
                const input = document.getElementById(state.id);
                if (input) {
                    input.value = state.value;
                }
            });
        }

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
                    hasError = true;
                    return; // Prevent the user from continuing
                }

                // Save state before navigating away
                const checkboxStates = Array.from(questionTypeCheckboxes).map(checkbox => ({
                    id: checkbox.id,
                    checked: checkbox.checked
                }));
                localStorage.setItem("checkboxStates", JSON.stringify(checkboxStates));

                const inputCounts = Array.from(document.querySelectorAll('input[type="number"]')).map(input => ({
                    id: input.id,
                    value: input.value
                }));
                localStorage.setItem("inputCounts", JSON.stringify(inputCounts));

                const questionDetails = Object.keys(selectedQuestions).map(type => ({
                    type: type,
                    count: selectedQuestions[type]
                }));
                const subjectType = document.getElementById("subject-type").value;
                localStorage.setItem("questionDetails", JSON.stringify(questionDetails));
                localStorage.setItem("subjectType", subjectType);
                window.location.href = `../html/custom-topic-selector.html?type=${subjectType}`;
            });
        }
    }
    
    const summaryDiv = document.getElementById("summary");
    const topicChooserDiv = document.getElementById("topic-chooser");
    if (summaryDiv && topicChooserDiv) {
        const questionDetails = JSON.parse(localStorage.getItem("questionDetails"));
        const subjectType = new URLSearchParams(window.location.search).get('type');
        const questionTypeNames = {
            saq: "Short Answer Questions (SAQs)",
            mcq: "Multiple Choice Questions (MCQs)",
            essay: "Essay Questions",
            prac: "Practical Questions",
            maths: "Maths Questions"
        };

        const topicNamesUrl = `../content/json/${subjectType}/topics.json`;
        
        fetch(topicNamesUrl)
        .then(response => response.json())
        .then(data => {
            const topicNames = data.topics;

            const topicNamesReverse = Object.fromEntries(Object.entries(topicNames).map(([key, value]) => [value, key]));

            questionDetails.forEach(detail => {
                const div = document.createElement("div");
                div.classList.add("form-group");
                div.innerHTML = `
                    <label>${questionTypeNames[detail.type]}:</label>
                    <input type="number" id="${detail.type}-count" name="${detail.type}-count" min="1" max="100" value="${detail.count}">
                `;
                summaryDiv.appendChild(div);

                const input = div.querySelector(`input[name="${detail.type}-count"]`);
                input.addEventListener("input", () => {
                    detail.count = parseInt(input.value, 10);
                    localStorage.setItem("questionDetails", JSON.stringify(questionDetails));
                });
            });

            fetch(`../content/json/${subjectType}/questions.json`)
                .then(response => response.json())
                .then(data => {
                    const questionFiles = data.files;
                    const allQuestions = [];
                    //possible optimisation steps - not sure if this has an effect
                    //const selectedQuestionTypes = questionDetails.map(detail => detail.type);

                    console.time("loadQuestionBank");

                    Promise.all(questionFiles.map(file => fetch(`../content/json/${subjectType}/${file}`).then(response => response.json())))
                        .then(filesData => {
                            filesData.forEach((fileData, index) => {
                                const fileName = fileData.name;
                                const jsonFileName = questionFiles[index];
                                fileData.questions.filter(q => q.topic).forEach(question => {
                                    question.sourceName = fileName; 
                                    question.fileName = jsonFileName;
                                    allQuestions.push(question);
                                });
                            });

                            const topicsByType = {};
                            allQuestions.forEach(question => {
                                const { type, topic } = question;
                                if (!topicsByType[type]) {
                                    topicsByType[type] = {};
                                }
                                if (!topicsByType[type][topic]) {
                                    topicsByType[type][topic] = 0;
                                }
                                topicsByType[type][topic]++;
                            });

                            console.timeEnd("loadQuestionBank");
                            console.log("Question bank created:", topicsByType);

                            const topicChooserDiv = document.getElementById("topic-chooser");

                            questionDetails.forEach(detail => {
                                if (detail.count > 0) {
                                    const subHeader = document.createElement("h3");
                                    subHeader.textContent = `Select Topics for ${questionTypeNames[detail.type]}`;
                                    topicChooserDiv.appendChild(subHeader);
                        
                                    const topicList = document.createElement("div");
                                    topicList.classList.add("topic-list");
                                    topicList.setAttribute("data-question-type", detail.type);
                        
                                    const topics = topicsByType[detail.type];
                        
                                    if (topics && Object.keys(topics).length > 0) {
                                        const multiSelectDiv = document.createElement("div");
                                        multiSelectDiv.classList.add("multi-select");
                        
                                        const selectBox = document.createElement("div");
                                        selectBox.classList.add("selectBox");
                                        selectBox.innerHTML = `<span>Select topics</span><div class="overSelect"></div>`;
                                        multiSelectDiv.appendChild(selectBox);
                        
                                        const checkboxesDiv = document.createElement("div");
                                        checkboxesDiv.id = "checkboxes";
                        
                                        Object.keys(topicNames).forEach(topic => {
                                            if (topics[topic]) {
                                                const label = document.createElement("label");
                                                label.innerHTML = `<input type="checkbox" value="${topic}"/> ${topicNames[topic]} (Available: ${topics[topic]})`;
                                                checkboxesDiv.appendChild(label);
                                            }
                                        });
                        
                                        multiSelectDiv.appendChild(checkboxesDiv);
                                        topicChooserDiv.appendChild(multiSelectDiv);
                                        multiSelectDiv.appendChild(document.createElement("br")); // Add <br> after multiSelectDiv
                                        topicChooserDiv.appendChild(topicList);

                                        selectBox.addEventListener("click", () => {
                                            checkboxesDiv.style.display = checkboxesDiv.style.display === "block" ? "none" : "block";
                                        });
                        
                                        checkboxesDiv.addEventListener("change", (event) => {
                                            const selectedTopics = Array.from(checkboxesDiv.querySelectorAll("input[type='checkbox']:checked")).map(input => input.value);
                                            const currentTopics = Array.from(topicList.querySelectorAll(".topic-item")).map(item => item.getAttribute("data-topic"));
                        
                                            // Remove unselected topics
                                            currentTopics.forEach(topic => {
                                                if (!selectedTopics.includes(topic)) {
                                                    const topicDiv = topicList.querySelector(`.topic-item[data-topic="${topic}"]`);
                                                    if (topicDiv) {
                                                        topicList.removeChild(topicDiv);
                                                    }
                                                }
                                            });
                        
                                            // Add newly selected topics
                                            selectedTopics.forEach(topic => {
                                                if (!currentTopics.includes(topic)) {
                                                    const topicDiv = document.createElement("div");
                                                    topicDiv.classList.add("topic-item");
                                                    topicDiv.setAttribute("data-topic", topic);
                        
                                                    const label = document.createElement("label");
                                                    label.textContent = `${topicNames[topic]} (Available: ${topics[topic]}):`;
                        
                                                    const input = document.createElement("input");
                                                    input.type = "number";
                                                    input.min = "0";
                                                    input.max = topics[topic];
                                                    input.value = "0";
                                                    input.classList.add("topic-count");
                        
                                                    topicDiv.appendChild(label);
                                                    topicDiv.appendChild(input);
                                                    topicList.appendChild(topicDiv);

                                                    input.addEventListener("input", updateTotalCount);
                                                }
                                            });
                                        });
                                    } else {
                                        const noTopicsMessage = document.createElement("p");
                                        noTopicsMessage.textContent = "No topics available for this question type.";
                                        topicChooserDiv.appendChild(noTopicsMessage);
                                        topicChooserDiv.appendChild(document.createElement("br"));
                                    }
                                }
                            });

                            document.getElementById("submit-topics").addEventListener("click", function() {
                                const topicLists = document.querySelectorAll(".topic-list");
                                const selectedTopics = {};
                                let hasError = false;

                                topicLists.forEach(list => {
                                    const questionType = list.getAttribute("data-question-type");
                                    selectedTopics[questionType] = [];

                                    const topicItems = list.querySelectorAll(".topic-item");
                                    let totalSelected = 0;

                                    topicItems.forEach(item => {
                                        const topicName = item.querySelector("label").textContent.split(" (")[0];
                                        const topicCount = parseInt(item.querySelector(".topic-count").value, 10);
                                        const availableCount = parseInt(item.querySelector(".topic-count").max, 10);

                                        if (topicCount > availableCount) {
                                            alert(`You have selected more questions for ${topicName} than are available. Please reduce the number of questions.`);
                                            hasError = true;
                                        }

                                        if (topicCount > 0) {
                                            selectedTopics[questionType].push({ topic: topicNamesReverse[topicName], count: topicCount });
                                            totalSelected += topicCount;
                                        }
                                    });

                                    const questionDetail = questionDetails.find(detail => detail.type === questionType);
                                        if (totalSelected < questionDetail.count) {
                                        const confirmContinue = confirm(`You have selected fewer questions than required for ${questionTypeNames[questionType]}. The remaining questions will be selected at random. Do you want to continue?`);
                                        if (!confirmContinue) {
                                            hasError = true;
                                        }
                                    }
                                });

                                if (!hasError) {
                                    localStorage.setItem("selectedTopics", JSON.stringify(selectedTopics));
                                    generateRandomQuestionSet(allQuestions, questionDetails, selectedTopics);
                                    window.location.href = "../html/exam.html?type=custom&name=custom";
                                }
                            });
                        });
                })
                .catch(error => {
                    console.error("Error loading questions:", error);
                });
        })
        .catch(error => {
            console.error("Error loading topics:", error);
        });
    }
});

function generateRandomQuestionSet(allQuestions, questionDetails, selectedTopics) {
    const selectedSet = [];

    questionDetails.forEach(detail => {
        const questionsOfType = allQuestions.filter(q => q.type === detail.type && q.topic);
        const topics = selectedTopics[detail.type] || [];

        topics.forEach(topic => {
            const questionsOfTopic = questionsOfType.filter(q => q.topic === topic.topic);
            while (selectedSet.filter(q => q.type === detail.type && q.topic === topic.topic).length < topic.count) {
                if (questionsOfTopic.length === 0) {
                    console.error(`No questions available for topic ${topic.topic} of type ${detail.type}`);
                    break;
                }
                const randomIndex = Math.floor(Math.random() * questionsOfTopic.length);
                selectedSet.push(questionsOfTopic.splice(randomIndex, 1)[0]);
            }
        });

        const remainingCount = detail.count - selectedSet.filter(q => q.type === detail.type).length;
        if (remainingCount > 0) {
            const remainingQuestions = questionsOfType.filter(q => !selectedSet.includes(q));
            while (selectedSet.filter(q => q.type === detail.type).length < detail.count) {
                if (remainingQuestions.length === 0) {
                    console.error(`No remaining questions available for type ${detail.type}`);
                    break;
                }
                const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
                selectedSet.push(remainingQuestions.splice(randomIndex, 1)[0]);
            }
        }
    });

    const customExamData = {
        name: "Custom Exam",
        date: new Date().toLocaleDateString(),
        time: 0,
        displayTime: "Custom",
        instructions: {
            table: {},
            text: ["Answer all questions."]
        },
        questions: selectedSet
    };

    localStorage.setItem("customExamData", JSON.stringify(customExamData));
}