const rand = (min, max) => {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

let gameOver = false

const canvas = document.querySelector("canvas")
const [sizeSelect, gameModeSelect] = [...document.querySelectorAll("select")]
const ps = [...document.querySelectorAll("p")]
const ctx = canvas.getContext("2d")
const overlay = document.getElementById("overlay")

const config = {
    gameMode: "1",
    canvasSize: {
        width: canvas.width,
        height: canvas.height,
        mode: "2"
    }
}

const showDialog = () => {
    overlay.classList.add("show")
}

const closeDialog = () => {
    overlay.classList.remove("show")
}

const paused = {
    _v: false,
    get() {
        return this._v
    },
    set(v) {
        if (v) showDialog()
        else closeDialog()

        this._v = v
    }
}

config.cellSize = config.canvasSize.width / 15

const changeGameMode = (evt) => {
    const mode = evt?.target?.value ?? evt

    config.gameMode = mode

    gameModeSelect.value = mode

    saveData()
}

const changeLayout = (evt) => {
    const option = evt?.target?.value ?? evt

    switch (option) {
        case "1":
            canvas.width = 350
            canvas.height = 350
            break
        default:
        case "2":
            canvas.width = 525
            canvas.height = 525
            break
        case "3":
            canvas.width = 780
            canvas.height = 780
            break
    }

    config.canvasSize.mode = option

    config.canvasSize.width = canvas.width
    config.canvasSize.height = canvas.height
    config.cellSize = config.canvasSize.width / 15

    sizeSelect.value = option

    saveData()
}

sizeSelect.onchange = changeLayout
gameModeSelect.onchange = changeGameMode

let SCORE = 0

const highScore = { classic: 0, noWalls: 0 }

const pressedKeys = {}

const initialSnakeSize = SCORE + 3

let secondsPassed
let oldTimeStamp
let fps = 60
let FRAMES = 0

const assets = {
    // apple: { img: "/apple.png" },
    apple: { img: "/snake-sprite.png", spriteSize: { w: 64, h: 64 } },
    snake: { img: "/snake-sprite.png", spriteSize: { w: 64, h: 64 } }
}

for (const [key, val] of Object.entries(assets))
    for (const [innerKey, innerVal] of Object.entries(val)) {
        if (innerKey === "img" && typeof innerVal === "string") {
            const img = new Image()
            img.src = innerVal

            assets[key][innerKey] = img
        }
    }

const generateSnake = () => {
    const Snake = {
        size: initialSnakeSize,
        direction: "right",
        lastMoveDirection: ""
    }

    Snake.head = {
        x: 4,
        y: 3
    }

    Snake.tail = Array.apply(null, Array(Snake.size - 1)).map((t, idx) => ({
        y: Snake.head.y,
        x: Snake.head.x - 1 - idx
    }))

    return Snake
}

const Snake = generateSnake()

const moveSnake = () => {
    if (!Snake.direction) return

    let prev = { ...Snake.head }

    switch (Snake.direction) {
        case "up":
            Snake.head.y--
            break
        case "right":
            Snake.head.x++
            break
        case "down":
            Snake.head.y++
            break
        case "left":
            Snake.head.x--
            break
    }

    for (let i = 0; i < Snake.tail.length; i++) {
        const currentTailItem = Snake.tail[i]
        const tmp = { ...currentTailItem }

        currentTailItem.x = prev.x
        currentTailItem.y = prev.y

        prev = tmp
    }

    for (let i = 0; i < Snake.tail.length; i++) if (Snake.head.x === Snake.tail[i].x && Snake.head.y === Snake.tail[i].y) return finishGame()

    if (Snake.head.x >= config.canvasSize.width / config.cellSize || Snake.head.x < 0 || Snake.head.y >= config.canvasSize.height / config.cellSize || Snake.head.y < 0)
        if (config.gameMode === "1") return finishGame()
        else {
            if (Snake.head.x === config.canvasSize.width / config.cellSize) Snake.head.x = 0
            if (Snake.head.x < 0) Snake.head.x = config.canvasSize.width / config.cellSize - 1
            if (Snake.head.y === config.canvasSize.height / config.cellSize) Snake.head.y = 0
            if (Snake.head.y < 0) Snake.head.y = config.canvasSize.height / config.cellSize - 1
        }

    if (Snake.head.x === Apple.x && Snake.head.y === Apple.y) {
        SCORE++
        Snake.size++

        const [preLastTailPiece, lastTailPiece] = [Snake.tail[Snake.tail.length - 2], Snake.tail[Snake.tail.length - 1]]
        let newTail = {}

        if (preLastTailPiece.x === lastTailPiece.x) {
            newTail.x = lastTailPiece.x
            newTail.y = preLastTailPiece.y > lastTailPiece.y ? lastTailPiece.y - 1 : lastTailPiece.y + 1
        } else if (preLastTailPiece.y === lastTailPiece.y) {
            newTail.y = preLastTailPiece.y
            newTail.x = preLastTailPiece.x > lastTailPiece.x ? lastTailPiece.x - 1 : lastTailPiece.x + 1
        }

        Snake.tail.push(newTail)
        positionApple()
    }

    Snake.lastMoveDirection = Snake.direction
}

const positionApple = () => {
    const makePosition = () => ({
        x: rand(0, config.canvasSize.width / config.cellSize - 1),
        y: rand(0, config.canvasSize.height / config.cellSize - 1)
    })

    const position = makePosition()

    const snakeParts = [Snake.head, ...Snake.tail]

    for (let i = 0; i < snakeParts.length; i++) if (position.x === snakeParts[i].x && position.y === snakeParts[i].y) return positionApple()

    Object.assign(Apple, position)
}

const Apple = { x: undefined, y: undefined }
positionApple()

const calcFps = (timeStamp) => {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000
    oldTimeStamp = timeStamp

    fps = Math.round(1 / secondsPassed)
}

const Logics = (timeStamp) => {
    calcFps(timeStamp)

    if (pressedKeys["ArrowLeft"] && ![Snake.direction, Snake.lastMoveDirection].includes("right")) Snake.direction = "left"
    else if (pressedKeys["ArrowUp"] && ![Snake.direction, Snake.lastMoveDirection].includes("down")) Snake.direction = "up"
    else if (pressedKeys["ArrowDown"] && ![Snake.direction, Snake.lastMoveDirection].includes("up")) Snake.direction = "down"
    else if (pressedKeys["ArrowRight"] && ![Snake.direction, Snake.lastMoveDirection].includes("left")) Snake.direction = "right"

    if (!(FRAMES % Math.floor(10 - SCORE * 0.175))) moveSnake()
}

const drawApple = () => {
    if (assets.apple.hasOwnProperty("spriteSize")) ctx.drawImage(assets.apple.img, 0, 192, assets.apple.spriteSize.w, assets.apple.spriteSize.h, Apple.x * config.cellSize, Apple.y * config.cellSize, config.cellSize, config.cellSize)
    else ctx.drawImage(assets.apple.img, Apple.x * config.cellSize, Apple.y * config.cellSize, config.cellSize, config.cellSize)
}

const drawSnake = () => {
    let sx
    let sy

    switch (Snake.lastMoveDirection) {
        case "up":
            sx = 192
            sy = 0
            break
        default:
        case "right":
            sx = 256
            sy = 0
            break
        case "down":
            sx = 256
            sy = 64
            break
        case "left":
            sx = 192
            sy = 64
            break
    }

    ctx.drawImage(assets.apple.img, sx, sy, assets.apple.spriteSize.w, assets.apple.spriteSize.h, Snake.head.x * config.cellSize, Snake.head.y * config.cellSize, config.cellSize, config.cellSize)

    const snakeParts = [Snake.head, ...Snake.tail]

    for (let i = 1; i < snakeParts.length; i++) {
        if (i === snakeParts.length - 1) {
            if (snakeParts[i].y === snakeParts[i - 1].y)
                if (snakeParts[i].x > snakeParts[i - 1].x) {
                    sx = 192
                    sy = 192
                } else {
                    sx = 256
                    sy = 128
                }
            else {
                if (snakeParts[i].y > snakeParts[i - 1].y) {
                    sx = 192
                    sy = 128
                } else {
                    sx = 256
                    sy = 192
                }
            }
        } else if (snakeParts[i].y === snakeParts[i - 1].y) {
            if (snakeParts[i].x > snakeParts[i - 1].x && snakeParts[i].y > snakeParts[i + 1].y) {
                sx = 128
                sy = 128
            } else if (snakeParts[i].x > snakeParts[i - 1].x && snakeParts[i].y < snakeParts[i + 1].y) {
                sx = 128
                sy = 0
            } else if (snakeParts[i].x < snakeParts[i - 1].x && snakeParts[i].y > snakeParts[i + 1].y) {
                sx = 0
                sy = 64
            } else if (snakeParts[i].x < snakeParts[i - 1].x && snakeParts[i].y < snakeParts[i + 1].y) {
                sx = 0
                sy = 0
            } else {
                sx = 64
                sy = 0
            }
        } else if (snakeParts[i].x === snakeParts[i - 1].x) {
            if (snakeParts[i].y > snakeParts[i - 1].y && snakeParts[i].x > snakeParts[i + 1].x) {
                sx = 128
                sy = 128
            } else if (snakeParts[i].y > snakeParts[i - 1].y && snakeParts[i].x < snakeParts[i + 1].x) {
                sx = 0
                sy = 64
            } else if (snakeParts[i].y < snakeParts[i - 1].y && snakeParts[i].x > snakeParts[i + 1].x) {
                sx = 128
                sy = 0
            } else if (snakeParts[i].y < snakeParts[i - 1].y && snakeParts[i].x < snakeParts[i + 1].x) {
                sx = 0
                sy = 0
            } else {
                sx = 128
                sy = 64
            }
        }

        ctx.drawImage(assets.apple.img, sx, sy, assets.apple.spriteSize.w, assets.apple.spriteSize.h, Snake.tail[i - 1].x * config.cellSize, Snake.tail[i - 1].y * config.cellSize, config.cellSize, config.cellSize)
    }
}

const drawMap = () => {
    ctx.lineWidth = 2
    ctx.strokeStyle = "#222"

    for (let i = 0; i < config.canvasSize.width; i++) {
        ctx.beginPath()
        ctx.moveTo(config.cellSize * (i + 1), 0)
        ctx.lineTo(config.cellSize * (i + 1), config.canvasSize.height)
        ctx.stroke()
    }

    for (let i = 0; i < config.canvasSize.width; i++) {
        ctx.beginPath()
        ctx.moveTo(0, config.cellSize * (i + 1))
        ctx.lineTo(config.canvasSize.width, config.cellSize * (i + 1))
        ctx.stroke()
    }
}

const Render = () => {
    ctx.clearRect(0, 0, config.canvasSize.width, config.canvasSize.height)
    drawMap()

    drawSnake()
    drawApple()

    ps[0].innerText = "FPS: " + fps
    ps[1].innerText = "Score: " + SCORE

    if (highScore.classic) ps[2].innerText = "Classic High Score: " + highScore.classic
    if (highScore.noWalls) ps[3].innerText = "No Walls High Score: " + highScore.noWalls
}

const Game = (timeStamp) => {
    if (!paused.get()) {
        Logics(timeStamp)
        if (gameOver) return
    }

    Render()
    FRAMES++

    requestAnimationFrame(Game)
}

const keyDown = (evt) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(evt.code)) evt.preventDefault()
    if (evt.code === "Space") paused.set(!paused.get())
    else pressedKeys[evt.code] = true
}

const keyUp = (evt) => {
    evt.preventDefault()
    delete pressedKeys[evt.code]
}

window.addEventListener("keydown", keyDown, false)
window.addEventListener("keyup", keyUp, false)

const finishGame = () => {
    gameOver = true
    if (config.gameMode === "1" && highScore.classic < SCORE) localStorage.setItem("classic-high-score", SCORE.toString())
    if (config.gameMode === "2" && highScore.noWalls < SCORE) localStorage.setItem("no-walls-high-score", SCORE.toString())

    return alert("Game is Finished!\nScore: " + SCORE)
}

const loadData = () => {
    paused.set(paused.get())

    highScore.classic = +(localStorage.getItem("classic-high-score") ?? 0)
    highScore.noWalls = +(localStorage.getItem("no-walls-high-score") ?? 0)

    try {
        const cfg = JSON.parse(localStorage.getItem("config"))

        if (cfg.gameMode) changeGameMode(cfg.gameMode)
        if (cfg.canvasSize) changeLayout(cfg.canvasSize.mode)
    } catch (e) {
        console.log(e)
    }
}

const saveData = () => {
    localStorage.setItem("config", JSON.stringify(config))
}

loadData()
requestAnimationFrame(Game)
