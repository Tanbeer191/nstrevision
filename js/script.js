let timerInterval;
let timerInitialized = false;
let currentQuestionIndex = 0;

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
    window.scrollTo(0, 0);
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

    if (question.type === "prac" || question.type === "maths") {
        const pdfUrl = examType === "custom" ? question.pdfUrl : data.pdfUrl;
        const startPage = question.startPage || 1;
        const endPage = question.endPage || startPage;
        const containerId = "pdf-container";

        renderPDFPages(pdfUrl, containerId, startPage, endPage);
    }
    else {
        const contentText = question.content;
        const contentDiv = document.getElementById("question-content");
        contentDiv.innerHTML = "";
        contentDiv.innerHTML = contentText.join('');
        MathJax.typeset()
    }
    
    if (!instructionTooShort && currentQuestionIndex === 0) {
        const questionContentDiv = document.querySelector(".question-content");
        const instructionDiv = document.getElementById("instruction-text");
        const button = instructionDiv.querySelector("button");
        if (button) {
            questionContentDiv.appendChild(button);
        }
    }
    checkIfAtBottom()

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
            if (firstRun === false) {
                loadQuestion(data, examType, examName);
            }
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
        let topicSum = 0;
        topicItems.forEach(item => {
            const input = item.querySelector(".topic-count");
            const topicCount = parseInt(input.value, 10) || 0;
            topicSum += topicCount;
        });
        // Update the type total box for this question type
        const questionCountInput = document.getElementById(`${questionType}-count`);
        if (questionCountInput) {
            questionCountInput.value = topicSum;
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
            document.getElementById("question").style.display = "none";
            instructionDiv.innerHTML = "";
            instructionText.forEach(line => {
                const p = document.createElement("p");
                p.innerHTML = line;
                instructionDiv.appendChild(p);
            });

            if (examType === "custom") {
                const customExamData = JSON.parse(localStorage.getItem("customExamData"));
                if (customExamData && !document.getElementById("download-custom-exam-pdf")) {
                    const btn = document.createElement("button")
                    btn.id = "download-custom-exam-pdf";
                    btn.textContent = "Download Exam";
                    const header = document.querySelector(".exam-header")
                    if (header) {
                        header.appendChild(btn);
                        btn.addEventListener("click", () => downloadCustomExamPDF(customExamData));
                    }
                }
            }
    
            if (!checkIfAtBottom()) {
                instructionTooShort = false;
                const questionContentDiv = document.querySelector(".question-content");
                const instructionDiv = document.getElementById("instruction-text");
                const button = questionContentDiv.querySelector("button");
                if (button) {
                    instructionDiv.appendChild(button);
                }
            } else {
                instructionTooShort = true;
            }

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
                document.getElementById("question").style.display = "block";
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
                        }, 1000);                    }
                }

                setTimeout(() => {
                    checkIfAtBottom();
                }, 1000);
                
                if (typeof firstRun === "undefined") {
                    loadQuestion(data, examType, examName);
                    firstRun = false;
                }

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
                const countInput = document.getElementById(`${checkbox.value}-count`);
                if (countInput) {
                    countInput.parentElement.remove();
                }
            });
        });

        // Restore state when page loads
        const checkboxStates = JSON.parse(localStorage.getItem("checkboxStates"));
        if (checkboxStates) {
            checkboxStates.forEach(state => {
                const checkbox = document.getElementById(state.id);
                if (checkbox) {
                    checkbox.checked = state.checked;
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
                    selectedQuestions[checkbox.value] = true; // Just record the type
                    totalQuestions++;
                }
            }

            if (totalQuestions === 0) {
                alert("Please select at least one question type.");
                return; 
            }

            const checkboxStates = Array.from(questionTypeCheckboxes).map(checkbox => ({
                id: checkbox.id,
                checked: checkbox.checked
            }));
            localStorage.setItem("checkboxStates", JSON.stringify(checkboxStates));

            const questionDetails = Object.keys(selectedQuestions).map(type => ({
                type: type
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
                    <input type="number" id="${detail.type}-count" class="type-total-count" min="0" value="0" style="margin-left:1em; width:60px;">
                    <span style="font-size:0.9em; color:#888;"></span>
                `;
                summaryDiv.appendChild(div);
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
                                    if (question.type === "prac" || question.type === "maths") {
                                        question.pdfUrl = fileData.pdfUrl;
                                        question.startPage = question.startPage || 1;
                                        question.endPage = question.endPage || question.startPage;
                                    }
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
                                    multiSelectDiv.appendChild(document.createElement("br"));
                                    topicChooserDiv.appendChild(topicList);

                                    selectBox.addEventListener("click", () => {
                                        checkboxesDiv.style.display = checkboxesDiv.style.display === "block" ? "none" : "block";
                                    });

                                    checkboxesDiv.addEventListener("change", (event) => {
                                        const selectedTopics = Array.from(checkboxesDiv.querySelectorAll("input[type='checkbox']:checked")).map(input => input.value);
                                        const currentTopics = Array.from(topicList.querySelectorAll(".topic-item")).map(item => item.getAttribute("data-topic"));

                                        currentTopics.forEach(topic => {
                                            if (!selectedTopics.includes(topic)) {
                                                const topicDiv = topicList.querySelector(`.topic-item[data-topic="${topic}"]`);
                                                if (topicDiv) {
                                                    topicList.removeChild(topicDiv);
                                                }
                                            }
                                        });

                                        selectedTopics.forEach(topic => {
                                            if (!currentTopics.includes(topic)) {
                                                const topicDiv = document.createElement("div");
                                                topicDiv.classList.add("topic-item");
                                                topicDiv.setAttribute("data-topic", topic);

                                                const label = document.createElement("label");
                                                label.textContent = `${topicNames[topic]} (Available: ${topics[topic]})`;

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
                            });

                            document.getElementById("submit-topics").addEventListener("click", function() {
                                const topicLists = document.querySelectorAll(".topic-list");
                                const selectedTopics = {};
                                let errorMessages = [];

                                const availableByType = {};
                                Object.keys(topicsByType).forEach(type => {
                                    availableByType[type] = Object.values(topicsByType[type]).reduce((a, b) => a + b, 0);
                                });

                                topicLists.forEach(list => {
                                    const questionType = list.getAttribute("data-question-type");
                                    selectedTopics[questionType] = [];

                                    const topicItems = list.querySelectorAll(".topic-item");
                                    let topicSum = 0;
                                    topicItems.forEach(item => {
                                        const labelText = item.querySelector("label").textContent;
                                        const topicName = labelText.split(" (")[0];
                                        const topicCount = parseInt(item.querySelector(".topic-count").value, 10);
                                        const availableMatch = labelText.match(/\(Available:\s*(\d+)\)/);
                                        const availableCount = availableMatch ? parseInt(availableMatch[1], 10) : 0;

                                        if (topicCount > availableCount) {
                                            errorMessages.push(`You requested ${topicCount} for "${topicName}" but only ${availableCount} are available.`);
                                        }
                                        if (topicCount > 0) {
                                            selectedTopics[questionType].push({ topic: topicNamesReverse[topicName], count: topicCount });
                                            topicSum += topicCount;
                                        }
                                    });

                                    if (selectedTopics[questionType].length === 0) {
                                        const typeTotalInput = document.getElementById(`${questionType}-count`);
                                        const typeTotal = typeTotalInput ? parseInt(typeTotalInput.value, 10) : 0;
                                        if (typeTotal > 0) {
                                            selectedTopics[questionType].push({ topic: null, count: typeTotal });
                                            topicSum = typeTotal;
                                        }
                                    }

                                    if (topicSum > (availableByType[questionType] || 0)) {
                                        errorMessages.push(
                                            `You requested ${topicSum} total for "${questionTypeNames[questionType]}" but only ${availableByType[questionType] || 0} are available.`
                                        );
                                    }
                                });

                                if (errorMessages.length > 0) {
                                    alert(errorMessages.join('\n'));
                                    return;
                                }

                                localStorage.setItem("selectedTopics", JSON.stringify(selectedTopics));
                                generateRandomQuestionSet(allQuestions, questionDetails, selectedTopics);
                                window.location.href = "../html/exam.html?type=custom&name=custom";
                            });

                            // Make updateTotalCount globally available if needed
                            window.updateTotalCount = updateTotalCount;
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

        if (topics.length > 0) {
            topics.forEach(topicObj => {
                if (topicObj.topic === null && (topicObj.count === null || topicObj.count === 0)) {
                    selectedSet.push(...questionsOfType);
                } else if (topicObj.topic === null) {
                    const shuffled = questionsOfType.sort(() => Math.random() - 0.5);
                    selectedSet.push(...shuffled.slice(0, topicObj.count));
                } else {
                    const questionsOfTopic = questionsOfType.filter(q => q.topic === topicObj.topic);
                    const shuffled = questionsOfTopic.sort(() => Math.random() - 0.5);
                    selectedSet.push(...shuffled.slice(0, topicObj.count));
                }
            });
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

const scrollBtn = document.getElementById('scrollDownBtn');
const tolerance = 10;

scrollBtn.addEventListener('click', () => {
  window.scrollBy({
    top: window.innerHeight / 1.5,
    behavior: 'smooth'
  });
});

window.addEventListener('scroll', () => {
    const atBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - tolerance);
    scrollBtn.classList.toggle('hidden', atBottom);
  });
  
function checkIfAtBottom() {
    const atBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - tolerance);
    scrollBtn.classList.toggle('hidden', atBottom);
    return atBottom;
}

let pdfLayout = "vertical"; 
let pdfWidth = 65; 

async function renderPDFPages(pdfUrl, containerId, startPage, endPage) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const oldControls = document.getElementById("pdf-controls");
    if (oldControls) oldControls.remove();

    const controls = document.createElement("div");
    controls.id = "pdf-controls";
    controls.style.marginBottom = "1em";
    let buttonLabel = "Horizontal Page Layout";
    if (pdfLayout === "horizontal") buttonLabel = "Grid Layout";
    if (pdfLayout === "grid") buttonLabel = "Vertical Page Layout";
    controls.innerHTML = `
        <button id="download-pdf-btn" style="font-size: 0.9em; padding: 0.5em 0.5em;">Download PDF</button>
        <button id="toggle-layout-btn" style="font-size: 0.9em; padding: 0.5em 0.5em;">
            ${buttonLabel}
        </button>
        <label style="margin-left:1em;">
            Page Width:
            <input type="range" id="pdf-width-slider" min="1" max="100" value="${pdfLayout === "grid" ? 100 : pdfWidth}" style="vertical-align:middle;" ${pdfLayout === "grid" ? "disabled" : ""}>
            <span id="pdf-width-value">${pdfLayout === "grid" ? 100 : pdfWidth}%</span>
        </label>
    `;
    container.parentNode.insertBefore(controls, container);

    // Remove all layout classes first
    container.classList.remove("vertical", "horizontal", "grid");

    // Apply the current layout
    if (pdfLayout === "vertical") {
        container.classList.add("vertical");
        container.style.setProperty("--pdf-page-width", pdfWidth + "%");
    } else if (pdfLayout === "horizontal") {
        container.classList.add("horizontal");
        container.style.setProperty("--pdf-page-width", pdfWidth + "%");
    } else if (pdfLayout === "grid") {
        container.classList.add("grid");
        container.style.setProperty("--pdf-page-width", "100%");
    }

    document.getElementById("toggle-layout-btn").onclick = function() {
        if (pdfLayout === "vertical") {
            pdfLayout = "horizontal";
        } else if (pdfLayout === "horizontal") {
            pdfLayout = "grid";
        } else {
            pdfLayout = "vertical";
        }
        renderPDFPages(pdfUrl, containerId, startPage, endPage);
    };

    const widthSlider = document.getElementById("pdf-width-slider");
    const widthValue = document.getElementById("pdf-width-value");
    if (widthSlider) {
        widthSlider.value = pdfLayout === "grid" ? 100 : pdfWidth;
        widthSlider.disabled = pdfLayout === "grid";
        widthValue.textContent = pdfLayout === "grid" ? "100%" : pdfWidth + "%";
        widthSlider.oninput = function() {
            pdfWidth = this.value;
            container.style.setProperty("--pdf-page-width", pdfWidth + "%");
            widthValue.textContent = pdfWidth + "%";
        };
    }

    try {
        const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            const scale = 10;
            const viewport = page.getViewport({ scale });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = `${viewport.width / scale}px`;
            canvas.style.height = `${viewport.height / scale}px`;
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            container.appendChild(canvas);
        }
    } catch (error) {
        container.innerHTML = "<p>Failed to load PDF pages.</p>";
        console.error("PDF rendering error:", error);
    }

    document.getElementById("download-pdf-btn").onclick = async function() {
        const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
        const newPdfDoc = await PDFLib.PDFDocument.create();
        
        const pagesToCopy = [];
        for (let i = startPage; i <= endPage; i++) {
            pagesToCopy.push(i - 1);
        }
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToCopy);
        copiedPages.forEach(page => newPdfDoc.addPage(page));

        const pdfBytes = await newPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf"});
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank")
    };
}

async function downloadCustomExamPDF(customExamData) {
    alert("Note: Only practical and Maths questions will be included in the PDF. Other question types will be skipped.");
    const { questions } = customExamData;
    const pdfCache = {};
    const newPdfDoc = await PDFLib.PDFDocument.create();

    for (const q of questions) {
        if (!["prac", "maths"].includes(q.type)) continue;
        if (!q.pdfUrl || !q.startPage || !q.endPage) continue;
        if (!pdfCache[q.pdfUrl]) {
            try {
                const bytes = await fetch(q.pdfUrl).then(res => res.arrayBuffer());
                pdfCache[q.pdfUrl] = await PDFLib.PDFDocument.load(bytes);
            } catch (e) {
                console.error(`Failed to load PDF: ${q.pdfUrl}`, e);
                continue;
            }
        }
        const srcPdf = pdfCache[q.pdfUrl];
        const pageIndices = [];
        for (let i = q.startPage; i <= q.endPage; i++) {
            pageIndices.push(i - 1);
        }
        try {
            const copiedPages = await newPdfDoc.copyPages(srcPdf, pageIndices);
            copiedPages.forEach(page => newPdfDoc.addPage(page));
        } catch (e) {
            console.error(`Failed to copy page for question:`, q, e);
        }
    }

    const pdfBytes = await newPdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank")
}

document.addEventListener("keydown", function(e) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const nextBtn = document.getElementById("next-button");
    const prevBtn = document.getElementById("prev-button");

    if ((isMac ? e.metaKey : e.ctrlKey) && e.key === "ArrowRight") {
        if (nextBtn && !nextBtn.disabled && nextBtn.offsetParent !== null) {
            e.preventDefault();
            nextBtn.click();
        }
    }
    if ((isMac ? e.metaKey : e.ctrlKey) && e.key === "ArrowLeft") {
        if (prevBtn && !prevBtn.disabled && prevBtn.offsetParent !== null) {
            e.preventDefault();
            prevBtn.click();
        }
    }
});
