const Websocket = require("ws");

const server = new Websocket.Server({ port: 9900 });

let wsocket; // Declare a variable to hold the WebSocket object

var index = 0;
var bombCount = 0;
var balance = 0;
var playerId = "";
var increaseMoney = 0;
var gameCode = "";
var awardMoney = 0;
var awardBase = 0;
var gameType = 2;
var roomId = 0;
var records = [];
var round = 0; // 0 = reset, 1 = betting, 2 = start crash, 3 = game over
var roundDelayCount = [-1, 4, -1, 2];
var roundCount = 0;
var roundCrashValue = 0;
var currentCrashValue = 0;
var currentSpeed = 1;

var cashOutCondition = false;


const start = 1.00;
const end = 500.00;
const duration = 50 * 1000; // 150 seconds in milliseconds
const interval = 10; // update every 10 milliseconds
const steps = duration / interval;
const range = end - start;
let estimatedTimeToTarget = 0;

let currentValue = start;
let currentStep = 0;
let startTime = Date.now();
let elapsedTime = 0;
let intervalId = null; // Store interval reference
let lastUpdateTime = Date.now(); // Track last update time
let lastProgress = 0; // Track last recorded progress


function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}

function generateRandomInt(length) {
    const characters = '0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}


function generate() {
    currentValue = start;
    currentStep = 0;
    lastUpdateTime = Date.now(); // Track last update time
    lastProgress = 0; // Track last recorded progress

    const min = 1.00;
    const max = 500.00;
    //roundCrashValue = (Math.random() * (max - min) + min).toFixed(2);
    roundCrashValue = 500.00;
    startTime = Date.now();
};

function loginRequest() {
    currentSpeed = 1;

    playerId = generateRandomString(8);
    balance = 200000;

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 1,
        id: 1,
        data: {
            sessionId: generateRandomInt(10),
            errCode: 0,
            lobbyServerIp: "127.0.0.1",
            lobbyServerPort: 9900,
            playerId: playerId,
        }
    }

    return response;
}

function lobbyRequest() {

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 3,
        id: 3,
        data: {
            gameId: generateRandomInt(6),
            errCode: 0,
            balance: balance,
            serverTime: Date.now(),
            currency: "CNY",
            walletType:2,
        }
    }
    return response;
}

function joinRoomRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = [{
        gameName: "Slash",
        betSizeList: [1.00, 2.00, 3.00, 4.00, 5.00, 6.00, 8.00, 10, 12, 14, 16, 18, 20, 25, 30, 40, 50, 70, 90, 120, 160, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
        topWin: 100.15,
        topMiss: 350.89,
        lastRound:20.56,
    }]

    currencyInfo = [{
        currencyId: 1,
        currency: "CNY",
    }]

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100005,
            subData: {
                gameType: gameType,
                roomId: roomId,
                errCode: 0,
                balance: balance,
                betInfo: betInfo,
                currencyInfo: currencyInfo,
            }
        }
    }

    return response;
}

function transferRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100069,
            subData: {
                errCode: 0,
                balance: balance,
                increaseMoney: increaseMoney,
            }
        }
    }

    increaseMoney = 0;
    return response;
}

function recordRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    records = [
        {
            id: 321541,
            bet: 2,
            odds: 0.0,
            winMoney:0,
        },
        {
            id: 321541,
            bet: 2,
            odds: 1.5,
            winMoney: 3,
        },
    ]

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: {
                errCode: 0,
                opCode: "GetRecords",
                recordsInfo: records,
            }
        }
    }

    return response;
}

function roomInfoRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    roomInfo = {
        betLimit: 10000,
        recordList: records,
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: {
                errCode: 0,
                opCode: "SyncRoomInfo",
                roomInfo: roomInfo,
            }
        }
    }

    return response;
}

function roomListRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    let date = Date.now();
    date += 60 * 60 * 1000;
    response.vals = {
        type: 100000,
        id: 3,
        data: {
            gameType: gameType,
            roomIndex: roomId,
            isOccupied: true,
            reserveExpiredTime : date,
        }
    }

    return response;
}

function setBetRequest(bet) {
    awardBase = bet;
    gameCode = "#" + generateRandomString(6);
    balance -= awardBase;

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = [{
        bet: awardBase,
        balance: balance,
        gameCode: gameCode,
        index: index,
    }]
    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: {
                errCode: 0,
                opCode: "SetBet",
                betInfo: betInfo,
            }
        }
    }


    round += 1;
    roundCount = 1;

    return response;
}

function cashOutRequest() {
    let gameOver = true;
    awardMoney = currentCrashValue * awardBase;
    increaseMoney = awardMoney;
    balance += awardMoney;

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = [{
        errCode: 0,
        cashOutValue: currentCrashValue,
        awardMoney: awardMoney,
        gameOver: gameOver,
        balance: balance,
    }]

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: {
                errCode: 0,
                opCode: "CashOut",
                betInfo: betInfo,
            }
        }
    }

    cashOutCondition = true;

    round += 1;
    roundCount = 1;

    return response;
}

function specialRequest() {

    currentSpeed += 1;
    if (currentSpeed > 3) {
        currentSpeed = 1;
    }

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    specialInfo = [{
        errCode: 0,
        currentSpeed: currentSpeed,
    }]

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: {
                errCode: 0,
                opCode: "Special",
                specialInfo: specialInfo,
            }
        }
    }

    betIntervalInit();

    return response;
}

function resetResponse() {
    currentCrashValue = parseFloat(1.00);
    awardBase = 0;
    cashOutCondition = false;

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: {
                errCode: 0,
                opCode: "Reset",
                roundCount: roundCount,
                maxRoundCount: roundDelayCount[0],
            }
        }
    }

    return response;
}

function startBetResponse() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: {
                errCode: 0,
                opCode: "StartBet",
                roundCount: roundCount,
                maxRoundCount: roundDelayCount[1],
            }
        }
    }

    return response;
}

function bettingResponse() {
    let currentTime = Date.now();
    let elapsedTime = (currentTime - lastUpdateTime) * currentSpeed; // Apply speed only to remaining time
    lastUpdateTime = currentTime; // Update last time

    // Keep previous progress and add new progress from elapsed time
    let newProgress = elapsedTime / duration;
    let totalProgress = Math.min(lastProgress + newProgress, 1); // Ensure it never exceeds 100%

    const easeInProgress = totalProgress * totalProgress; // Quadratic ease-in

    // Update the current value based on eased progress
    currentValue = start + range * easeInProgress;
    lastProgress = totalProgress; // Store the new progress for next iteration

    // Calculate estimated time to target
    const remainingProgress = (roundCrashValue - start) / range - totalProgress;
    estimatedTimeToTarget = Math.sqrt(Math.max(remainingProgress, 0)) * duration / (1000 * currentSpeed);

    let value = parseFloat(currentValue);
    currentCrashValue = value.toFixed(2);

    let crash = false;
    const numCurrentCrashValue = parseFloat(currentCrashValue);
    const numRoundCrashValue = parseFloat(roundCrashValue);

    if (numCurrentCrashValue >= numRoundCrashValue) {
        console.log("crash!!!");
        round += 1;
        roundCount = 1;
        estimatedTimeToTarget = 0;
        crash = true;
        lastProgress = 0; // Reset progress for new round
        lastUpdateTime = Date.now(); // Reset time tracking
    }

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {
            type: 100000,
            id: 3,
            data: {
                subType: 100071,
                subData: {
                    errCode: 0,
                    opCode: "Betting",
                    currentCrashValue: currentCrashValue,
                    currentCrashStatus: crash ? 1 : 0,
                }
            }
        }
    };

    return response;
}


function gameOverResponse() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: {
                errCode: 0,
                opCode: "GameOver",
                roundCount: roundCount,
                maxRoundCount: roundDelayCount[3],
                currentCrashValue: currentCrashValue,
                roundCrashValue: roundCrashValue,
                gameOverStatus: cashOutCondition ? 1 : 0,
                elapsedTime: elapsedTime.toFixed(2),
                estimatedTimeToTarget: estimatedTimeToTarget.toFixed(2),
            }
        }
    }

    return response;
}


    // Define your custom function that you want to run independently
function commonIntervalInit() {
    // Keep the server running indefinitely
    setInterval(() => {
        roundCount += 1;

        if (roundDelayCount[round] != -1 && roundCount > roundDelayCount[round]) {
            round += 1;
            roundCount = 1;
            // reset
            if (round > roundDelayCount.length - 1) {
                round = 0;
            }
        }

        // reset action
        if (round == 0) {
            let response = resetResponse();
            if (wsocket && wsocket.readyState === Websocket.OPEN) {
                wsocket.send(JSON.stringify(response));
            }
        }

        // start betting action
        if (round == 1) {
            let response = startBetResponse();
            if (wsocket && wsocket.readyState === Websocket.OPEN) {
                wsocket.send(JSON.stringify(response));
            }
        }

        if (round == 2) {
            if (roundCount == 1) {
                generate();
            }
        }

        // game over action
        if (round == 3) {
            console.log("game over!!!")
            let response = gameOverResponse();
            if (wsocket && wsocket.readyState === Websocket.OPEN) {
                wsocket.send(JSON.stringify(response));
            }
        }
    }, 1000);
}

function betIntervalInit() {
    if (intervalId) clearInterval(intervalId); // Stop previous interval

    let currentInterval = interval / currentSpeed; // Adjust interval based on speed
    console.log(currentInterval);

    intervalId = setInterval(() => {
        if (round === 2) {
            let response = bettingResponse();
            if (wsocket && wsocket.readyState === Websocket.OPEN) {
                wsocket.send(JSON.stringify(response));
            }
        }
    }, currentInterval);
}

// Call your custom function independently
commonIntervalInit();
betIntervalInit();

server.on("connection", (ws) => {
    wsocket = ws;

    ws.on("message", (message) => {
        const jsonContent = JSON.parse(message);

        // login request
        if (jsonContent.type == 0) {
            let response = loginRequest();
            ws.send(JSON.stringify(response));
        }

        // lobby request
        if (jsonContent.type == 2) {
            let response = lobbyRequest();
            ws.send(JSON.stringify(response));
        }

        // room list request
        if (jsonContent.type == 200017) {
            let response = roomListRequest();
            ws.send(JSON.stringify(response));
        }

        if (jsonContent.type == 100000) {
            // join Room request
            if (jsonContent.data.subType == 100004) {
                roomId = jsonContent.data.subData.roomId;
                let response = joinRoomRequest();
                ws.send(JSON.stringify(response));
            }

            // transfer info request
            if (jsonContent.data.subType == 100068) {
                let response = transferRequest();
                ws.send(JSON.stringify(response));
            }

            // custom request
            if (jsonContent.data.subType == 100070) {
                // get records request
                if (jsonContent.data.subData.opCode == "GetRecords") {
                    let response = recordRequest();
                    ws.send(JSON.stringify(response));
                }
                // sync room info request
                if (jsonContent.data.subData.opCode == "SyncRoomInfo") {
                    let response = roomInfoRequest();
                    ws.send(JSON.stringify(response));
                }
                // set bet request
                if (jsonContent.data.subData.opCode == "SetBet") {
                    let bet = jsonContent.data.subData.message.bet;
                    let response = setBetRequest(bet);
                    ws.send(JSON.stringify(response));
                }
                // cash out request
                if (jsonContent.data.subData.opCode == "CashOut") {
                    let response = cashOutRequest();
                    ws.send(JSON.stringify(response));
                }

                if (jsonContent.data.subData.opCode == "Special") {
                    let response = specialRequest();
                    ws.send(JSON.stringify(response));
                }
            }
        }
    })
});