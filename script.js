import express from "express";
import { faker } from "@faker-js/faker"
import { GoogleGenAI } from '@google/genai';
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/////// SOCKETIO SETUP
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000 ;

app.use(express.static(__dirname));

app.use("/static", express.static(join(__dirname, 'static')));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5500",
    }
});

io.use((socket, next) => {
    currentID = socket.handshake.auth.token;
    next();
});

let currentID = undefined;
const ai = new GoogleGenAI({});

class GameState {
    #gameID;
    #gameRound = 0;
    #gamePhase = "Word Generation";
    #wordList = [];
    #secretWord;
    #revealedLetters = [];
    #questionOptions;
    #currentQuestion;
    #userAnswers;
    #spiritChoice;

    constructor(gameID) {
        this.#gameID = gameID;
    }

    addToWordList(word){
        this.#wordList.push(word);
    }
    revealWordLength(){
        for (let i = 0; i < this.#secretWord[0].length; i++){
            this.#revealedLetters.push(undefined);
        }
    }
    revealNewLetter(){
        const lettersLeft = this.#revealedLetters.filter(letter => letter == undefined).length;
        const indexToReveal = Math.floor(Math.random() * lettersLeft);
        this.#revealedLetters[indexToReveal] = this.#secretWord[0][indexToReveal];
    }
    newRound(){
        this.#gameRound++;
        this.#questionOptions = undefined;
        this.#currentQuestion = undefined;
        this.#userAnswers = undefined;
        this.#spiritChoice = undefined;
    }


    set secretWord(wordToGuess){
        this.#secretWord = wordToGuess;
    }
    set gameRound(newRound){
        this.#gameRound = newRound;
    }
    set gamePhase(newPhase){
        this.#gamePhase = newPhase;
    }
    set questionOptions(options){
        this.#questionOptions = options;
    }
    set currentQuestion(question){
        this.#currentQuestion = question;
    }

    get gameRound(){
        return this.#gameRound
    }
    get wordList(){
        return this.#wordList;
    }
    get revealedLetters(){
        return this.#revealedLetters;
    }
    get secretWord() {
        return this.#secretWord;
    }
    get gamePhase(){
        return this.#gamePhase
    }
}

const myGame = new GameState(crypto.randomUUID());

let generatedWords = false
let generatingWords = false;

/////////// SERVER EVENTS
io.on("connection", (socket) => {
    if (myGame.wordList.length == 4){
        socket.emit("chooseWord", myGame.wordList);
    }
    else if (myGame.gamePhase == "Word Generation"){
        myGame.gamePhase = "Waiting on Generation";
        generateRandomWords(socket, 4);
    }

    socket.on("chosenWord", (wordToGuess) => {
        myGame.secretWord = wordToGuess;
        myGame.gamePhase = "Question Generation";
        chooseQuestion(socket);
    })

    socket.on("chosenQuestion", (questionText) => {
        myGame.currentQuestion = questionText;
        myGame.gamePhase = "Question Responses";
        
        // !! end game testing
        myGame.revealWordLength();
        myGame.revealNewLetter();
        myGame.revealNewLetter();
        io.emit("displayRevealedLetters", myGame.revealedLetters);

        socket.broadcast.emit("questionToAnswer", (questionText));
    })


    socket.on("evaluatedQuestionAnswers", (winner) => {
        // !! reveal and save chosen answer 
    })
    socket.on("evaluatedCloserWord", (ranking) => {
        // !! reveal and save chosen ranking
    })
})
httpServer.listen(port, function () {
    var host = httpServer.address().address
    var port = httpServer.address().port
    console.log('App listening at https://%s:%s', host, port)
});

function chooseQuestion(socket){
    if (myGame.gamePhase == "Question Generation"){
        // !! pull questions from JSON and save in game object
        const q1 = "One Option";
        const q2 = "Another Option";
        myGame.questionOptions = [q1, q2];

        myGame.gamePhase = "Question Selection";
        socket.emit("chooseQuestion", q1, q2);
    }
}

async function generateRandomWords(socket, numWordsToGenerate){
    for (let i = 0; i < numWordsToGenerate; i++){
        let generatedWord = undefined;
        let difficulty = Number.MAX_VALUE;
        while(difficulty > 5){
            generatedWord = faker.word.noun();

            const modelResponse = await ai.models.generateContent({
                model: "gemini-3.5-flash-lite",
                contents:  `How easy would the word '${generatedWord}' be to guess using a series of yes/no questions. Rate physical objects as easier than ideas, gerunds, and the like. 
                            Uncommon words are difficult to guess. Respond only with a value from 1(easiest) - 20(hardest). Pay special attention to values you assign to words in the 1-5 range.
                            Use the following examples as a rough guidline 1: car, arm, house; 2: finger, bottle, tissue; 3: coaster, driveway, whisker; 4: antennae, cord, alarm; 5: diorite, flow, occupation;`,
            });
            if (Number(modelResponse.text)){
                difficulty = Number(modelResponse.text);
            }

            console.log(`Candidate for word '${i}': '${generatedWord}' rated as a '${difficulty}'`);
        }
        myGame.addToWordList([generatedWord, difficulty]);
    }
    myGame.gamePhase = "Word Selection";
    socket.emit("chooseWord", myGame.wordList);
}