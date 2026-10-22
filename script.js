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

const wordsToChooseFrom = [];
const ai = new GoogleGenAI({});

/////////// SERVER EVENTS
io.on("connection", (socket) => {
    if (wordsToChooseFrom.length == 0){
        generateRandomWords(socket, 4);
    }
    else{
        socket.emit("chooseWord", wordsToChooseFrom);
    }

    socket.on("chosenWord", ([word, difficulty]) => {
        // !! save word
        chooseQuestion(socket);
    })
    

    socket.on("chosenQuestion", (questionText) => {
        // !! save chosen question in game object
        const currentQuestion = questionText;
        
        io.emit("questionToAnswer", (questionText));
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
    // !! pull questions from JSON and save in game object
    const q1 = "One Option";
    const q2 = "Another Option";

    socket.emit("chooseQuestion", q1, q2);
}

async function generateRandomWords(socket, numWordsToGenerate){
    for (let i = 0; i < numWordsToGenerate; i++){
        let generatedWord = undefined;
        let difficulty = Number.MAX_VALUE;
        while(difficulty > 5){
            generatedWord = faker.word.noun();

            const modelResponse = await ai.models.generateContent({
                model: "gemini-3.5-flash-lite",
                contents:  `How easy would the word '${generatedWord}' be to guess using a series of yes/no questions. Rate physical objects and concrete ideas as easier than gerunds and the like. 
                            Uncommon words are difficult to guess. Respond only with a value from 1(easiest) - 20(hardest). Pay special attention to values you assign to words in the 1-5 range.
                            Use the following examples as a rough guidline 1: car, arm, house; 2: finger, bottle, tissue; 3: coaster, driveway, whisker; 4: antennae, cord, alarm; 5: diorite, flow, occupation;`,
            });
            if (Number(modelResponse.text)){
                difficulty = Number(modelResponse.text);
            }

            console.log(`Candidate for word '${i}': '${generatedWord}' rated as a '${difficulty}'`);
        }
        wordsToChooseFrom.push([generatedWord, difficulty]);
    }
    socket.emit("chooseWord", wordsToChooseFrom);
}