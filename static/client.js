if (document.cookie == ""){
    document.cookie = "userID=p"+crypto.randomUUID();
}
const myID = document.cookie.slice(7);
let myPlayerNum = undefined;

const socket = io("http://localhost:3000", {
    auth: {
        token: myID
    }
});

const bodyElement = document.body;

socket.on("chooseWord", (wordList) => {
    removeExistingElement("#chooseWord");
    const wordChoicePopUp = document.createElement("div");
    wordChoicePopUp.id = "chooseWord";

    wordList.forEach(wordDifficultyPair => {
        const optionDiv = document.createElement("div");

        const button = document.createElement("button");
        button.textContent = wordDifficultyPair[0];

        button.addEventListener("click", () => {
            wordChoicePopUp.remove();
            socket.emit("chosenWord", wordDifficultyPair);
        })

        const difficulty = document.createElement("p");
        difficulty.textContent = wordDifficultyPair[1];

        optionDiv.append(button, difficulty);
        wordChoicePopUp.appendChild(optionDiv);
    });

    bodyElement.appendChild(wordChoicePopUp);
})

socket.on("chooseQuestion", (q1Text, q2Text) => {
    const questionChoicePopUp = document.createElement("div");
    questionChoicePopUp.id = "chooseQuestion";

    const q1 = document.createElement("button");
    q1.textContent = q1Text;
    const or = document.createElement("p");
    or.textContent = "or";
    const q2 = document.createElement("button");
    q2.textContent = q2Text;

    q1.addEventListener("click", () => {
        questionChoicePopUp.remove();
        socket.emit("chosenQuestion", q1Text);
    })
    q2.addEventListener("click", () =>{
        questionChoicePopUp.remove();
        socket.emit("chosenQuestion", q2Text);
    })

    questionChoicePopUp.append(q1, or, q2);
    bodyElement.appendChild(questionChoicePopUp);
})

function removeExistingElement(querySelector){
    const elementToRemove = document.querySelector(querySelector);
    if (elementToRemove){
        elementToRemove.remove();
    }
}