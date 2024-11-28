function showSubject(subjectId) {
    document.querySelectorAll('.subject-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(subjectId).classList.add('active');
    document.querySelector(`.tab[onclick="showSubject('${subjectId}')"]`).classList.add('active');
}