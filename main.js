document.addEventListener("DOMContentLoaded", function () {
  const PRESENT = "PRESENT"
  const CORRECT = "CORRECT"
  const ABSENT = "ABSENT"
  const OPTIONS = Object.freeze({
    PRESENT,
    CORRECT,
    ABSENT,
  })
  const OPTIONS_TO_CLASS = Object.freeze({
    PRESENT: "present",
    CORRECT: "correct",
    ABSENT: "absent",
  })
  const OPTIONS_TO_EMOJI = Object.freeze({
    PRESENT: String.fromCodePoint(0x1F7E8),
    CORRECT: String.fromCodePoint(0x1F7E9),
    ABSENT: String.fromCodePoint(0x2B1B),
  })

  const QUERY_PARAM_ANSWER_KEY = "a"
  const ENCODED_ANSWER = (new URLSearchParams(window.location.search)).get(QUERY_PARAM_ANSWER_KEY)
  const DECODED_ANSWER = ENCODED_ANSWER ? window.atob(ENCODED_ANSWER) : ""

  const WORD_LENGTH = DECODED_ANSWER.length
  const MAX_GUESS_COUNT = WORD_LENGTH + 1

  const checkWord = (answer, guess) => {
    const indexMatch = new Map()
    const answerMap = new Map()
    answer.split("").forEach((char, index) => {
      indexMatch.set(index, guess[index] === answer[index])
      answerMap.set(char, (answerMap.get(char) || []).concat(index))
    })
    return guess.split("").map((char, index) => {
      const answerChar = answer[index]
      if (char === answerChar) return OPTIONS.CORRECT
      const indices = answerMap.get(char)
      if (indices && indices.some(index => !indexMatch.get(index))) return OPTIONS.PRESENT
      return OPTIONS.ABSENT
    })
  }

  const resultToEmoji = (result) => {
    return result.map(option => OPTIONS_TO_EMOJI[option]).join("")
  }

  const creatBoard = () => {
    const board = document.createElement("div")
    board.classList.add("board")
    return board
  }

  const createLineId = row => `line-${row}`
  const createLine = row => {
    const line = document.createElement("div")
    line.id = createLineId(row)
    line.classList.add("line")
    return line
  }

  const createCellId = (row, column) => `cell-${row}-${column}`
  const createCell = (row, column) => {
    const cell = document.createElement("div")
    cell.id = createCellId(row, column)
    cell.classList.add("cell")
    return cell
  }

  const getCellValue = (cell) => cell.innerText
  const setCellValue = (cell, value) => cell.innerText = value

  const cellsInLine = (wordLength, row) => {
    const cells = []
    for (let column = 0; column < wordLength; column++) {
      cells.push(document.getElementById(createCellId(row, column)))
    }
    return cells
  }
  const cellsToGuess = cells => cells.map(getCellValue).join("")

  const lineIsValid = (wordLength, row) => {
    const cells = cellsInLine(wordLength, row)
    return cells.every(cell => getCellValue(cell).length === 1)
  }

  const getResultFromLine = (answer, wordLength, line) => {
    const cells = cellsInLine(wordLength, line)
    const guess = cellsToGuess(cells)
    const result = checkWord(answer.toLowerCase(), guess.toLowerCase())
    return result
  }

  const getBoardState = (answer, wordLength) => {
    const results = []
    for (let row = 0; row < currentLine; row++) {
      const result = getResultFromLine(answer, wordLength, row)
      results.push(result)
    }
    return results.map(result => resultToEmoji(result)).join("\n")
  }

  let currentLine = 0
  const checkLine = (answer, wordLength) => {
    const result = getResultFromLine(answer, wordLength, currentLine)
    console.log(resultToEmoji(result))
    const cells = cellsInLine(wordLength, currentLine)
    cells.forEach((cell, index) => {
      cell.classList.add(OPTIONS_TO_CLASS[result[index]])
    })
  }

  const generateBoard = (wordLength, maxGuessCount) => {
    const board = creatBoard()
    for (let row = 0; row < maxGuessCount; row++) {
      const line = createLine(row)
      for (let column = 0; column < wordLength; column++) {
        const cell = createCell(row, column)
        line.appendChild(cell)
      }
      board.appendChild(line)
    }
    return board
  }

  const generateActions = (wordLength) => {
    const container = document.createElement("div")
    container.classList.add("check-button-container")

    const checkButton = document.createElement("button")
    checkButton.innerText = "Check"
    checkButton.classList.add("check-button")
    checkButton.addEventListener("click", function () {
      if (currentLine >= MAX_GUESS_COUNT) { return }
      if (!lineIsValid(WORD_LENGTH, currentLine)) { return }
      checkLine(DECODED_ANSWER, wordLength)
    })

    const shareButton = document.createElement("button")
    shareButton.innerText = "Share"
    shareButton.classList.add("share-button")
    shareButton.addEventListener("click", function () {
      const state = getBoardState(DECODED_ANSWER, WORD_LENGTH)
      console.log(state)
    })

    container.appendChild(checkButton)
    container.appendChild(shareButton)
    return container
  }

  const getBaseUrl = () => window.location.href.split("?")[0]
  const generateLink = answer => {
    const encodedAnswer = window.btoa(answer)
    const baseUrl = getBaseUrl()
    const searchParams = new URLSearchParams()
    searchParams.set(QUERY_PARAM_ANSWER_KEY, encodedAnswer)
    const queryString = searchParams.toString()
    return `${baseUrl}?${queryString}`
  }

  const generateLinkGenerator = () => {
    const container = document.createElement("div")
    container.classList.add("link-generator")

    const field = document.createElement("input")
    field.type = "text"
    field.classList.add("field")

    const link = document.createElement("a")
    link.target = "_blank"
    link.classList.add("link")

    const button = document.createElement("button")
    button.innerText = "Generate"
    button.classList.add("button")
    button.addEventListener("click", function () {
      const answer = field.value
      if (!answer) { return }
      const href = generateLink(answer)
      link.innerText = href
      link.href = href
      link.click()
    })

    const inputContainer = document.createElement("div")
    const outputContainer = document.createElement("div")
    inputContainer.appendChild(field)
    inputContainer.appendChild(button)
    outputContainer.appendChild(link)
    container.appendChild(inputContainer)
    container.appendChild(outputContainer)
    return container
  }

  const generateKeyboard = (onClickLetter, onClickEnter, onClickBackspace) => {
    const ALPHABET_KEYS = [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["z", "x", "c", "v", "b", "n", "m"]
    ]
    const LAST_ROW = ALPHABET_KEYS.length - 1
    const keyboard = document.createElement("div")
    keyboard.classList.add("keyboard")
    for (let row = 0; row < ALPHABET_KEYS.length; row++) {
      const keyRow = document.createElement("div")
      keyRow.classList.add("keyboard-row")
      const rowLetters = ALPHABET_KEYS[row]
      if (row === LAST_ROW) {
        const enterKey = document.createElement("button")
        enterKey.classList.add("keyboard-key")
        enterKey.innerText = "ENTER"
        enterKey.addEventListener("click", function () {
          onClickEnter()
        })
        keyRow.appendChild(enterKey)
      }
      for (let letter = 0; letter < rowLetters.length; letter++) {
        const key = document.createElement("button")
        key.classList.add("keyboard-key")
        const letterValue = rowLetters[letter]
        key.innerText = letterValue.toUpperCase()
        key.addEventListener("click", function () {
          onClickLetter(letterValue)
        })
        keyRow.appendChild(key)
      }
      if (row === LAST_ROW) {
        const backspaceKey = document.createElement("button")
        backspaceKey.classList.add("keyboard-key")
        backspaceKey.innerText = "<="
        backspaceKey.addEventListener("click", function () {
          onClickBackspace()
        })
        keyRow.appendChild(backspaceKey)
      }
      keyboard.appendChild(keyRow)
    }
    return keyboard
  }

  let currentLetter = 0
  const getCurrentCell = () => {
    if (currentLetter > WORD_LENGTH) { return null }
    const currentCellId = createCellId(currentLine, currentLetter)
    return document.getElementById(currentCellId)
  }
  const getLastCell = () => {
    if (currentLetter < 1) return null
    const lastCellId = createCellId(currentLine, currentLetter - 1)
    return document.getElementById(lastCellId)
  }

  const enterLetter = (letter) => {
    const currentCell = getCurrentCell()
    if (!currentCell) { return }
    setCellValue(currentCell, letter)
    currentLetter++
  }

  const checkCurrentGuess = () => {
    if (currentLine >= MAX_GUESS_COUNT) { return }
    if (!lineIsValid(WORD_LENGTH, currentLine)) { return }
    checkLine(DECODED_ANSWER, WORD_LENGTH)
    currentLine++
    currentLetter = 0
  }

  const removeCurrentLetter = () => {
    const lastCell = getLastCell()
    if (!lastCell) { return }
    setCellValue(lastCell, "")
    currentLetter--
  }

  const onClickLetter = (letter) => {
    enterLetter(letter)
  }
  const onClickEnter = () => {
    checkCurrentGuess()
  }
  const onClickBackspace = () => {
    removeCurrentLetter()
  }

  const CONTAINER_ID = "wordal"
  const container = document.getElementById(CONTAINER_ID)
  const isValidGame = DECODED_ANSWER.length > 0

  if (isValidGame) {
    container.appendChild(generateBoard(WORD_LENGTH, MAX_GUESS_COUNT))
    // container.appendChild(generateActions(WORD_LENGTH))
  }
  if (isValidGame) {
    container.appendChild(generateKeyboard(
      onClickLetter,
      onClickEnter,
      onClickBackspace,
    ))
  }
  container.appendChild(generateLinkGenerator())
})
