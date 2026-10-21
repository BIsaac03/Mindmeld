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
        socket.emit("choseQuestion", q1Text);
    })
    q2.addEventListener("click", () =>{
        socket.emit("choseQuestion", q2Text);
    })

    questionChoicePopUp.append(q1, or, q2);
    bodyElement.appendChild(questionChoicePopUp);
})