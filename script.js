import express from "express";
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

/////////// SERVER EVENTS
io.on("connection", (socket) => {
    
    // !! pull questions from JSON and save in game object
    const q1 = "One Option";
    const q2 = "Another Option";

    socket.emit("chooseQuestion", q1, q2);


    socket.on("choseQuestion", (questionText) => {
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