document.addEventListener("DOMContentLoaded", function () {
  const NAME = "Wordal"

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

  const getCellValue = (cell) => cell.innerText.toLowerCase()
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

  const getGuessFromLine = (wordLength, line) => {
    const cells = cellsInLine(wordLength, line)
    return cellsToGuess(cells)
  }
  const getResult = (answer, guess) => {
    return checkWord(answer.toLowerCase(), guess.toLowerCase())
  }
  const getResultFromLine = (answer, wordLength, line) => {
    const guess = getGuessFromLine(wordLength, line)
    return getResult(answer, guess)
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
  let hasGuessedCorrectly = false
  const letterValueMap = new Map()
  const resultIsCorrect = result => {
    return result.every(option => option === OPTIONS.CORRECT)
  }
  const showShareButton = () => {
    const shareButtonId = createShareButtonId()
    const shareButton = document.getElementById(shareButtonId)
    shareButton.classList.remove("hidden")
  }
  const onCorrectGuess = () => {
    hasGuessedCorrectly = true
    showShareButton()
  }
  const checkLine = (answer, wordLength) => {
    const guess = getGuessFromLine(wordLength, currentLine)
    const result = getResult(answer, guess)
    console.log(resultToEmoji(result))
    if (resultIsCorrect(result)) {
      onCorrectGuess()
    }
    const cells = cellsInLine(wordLength, currentLine)
    cells.forEach((cell, index) => {
      cell.classList.add(OPTIONS_TO_CLASS[result[index]])
    })

    updateKeyboard(guess, result)
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

  const getBaseUrl = () => window.location.href.split("?")[0]
  const generateLink = answer => {
    const encodedAnswer = window.btoa(answer)
    const baseUrl = getBaseUrl()
    const searchParams = new URLSearchParams()
    searchParams.set(QUERY_PARAM_ANSWER_KEY, encodedAnswer)
    const queryString = searchParams.toString()
    return `${baseUrl}?${queryString}`
  }

  const onShare = () => {
    if (!hasGuessedCorrectly) { return }
    const state = getBoardState(DECODED_ANSWER, WORD_LENGTH)
    const text = [NAME, ENCODED_ANSWER, state].join("\n")
    console.log(text)
    navigator.clipboard.writeText(text).then(() => {
      window.alert("Text copied")
    })
  }

  const createShareButtonId = () => "share-button"
  const generateActionPanel = (onShare) => {
    const container = document.createElement("div")
    container.classList.add("link-generator")

    const field = document.createElement("input")
    field.type = "text"
    field.classList.add("field")

    const linkButton = document.createElement("button")
    linkButton.innerText = "generate"
    linkButton.classList.add("button")
    linkButton.addEventListener("click", function () {
      const answer = field.value
      if (!answer) { return }
      const link = document.createElement("a")
      link.target = "_blank"
      const href = generateLink(answer)
      link.innerText = href
      link.href = href
      link.click()
    })

    const shareButton = document.createElement("button")
    shareButton.id = createShareButtonId()
    shareButton.innerText = "share"
    shareButton.classList.add("button")
    shareButton.classList.add("hidden")
    shareButton.addEventListener("click", function () {
      onShare()
    })

    container.appendChild(field)
    container.appendChild(linkButton)
    container.appendChild(shareButton)
    return container
  }

  const createKeyId = letter => `key-${letter}`
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
        enterKey.innerText = "enter"
        enterKey.addEventListener("click", function () {
          onClickEnter()
        })
        keyRow.appendChild(enterKey)
      }
      for (let letter = 0; letter < rowLetters.length; letter++) {
        const letterValue = rowLetters[letter]
        const key = document.createElement("button")
        key.id = createKeyId(letterValue)
        key.classList.add("keyboard-key")
        key.innerText = letterValue
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

  const updateKeyboard = (guess, result) => {
    guess.split("").forEach((letterValue, index) => {
      const option = result[index]
      if (option === OPTIONS.ABSENT) {
        letterValueMap.set(letterValue, option)
      } else if (option === OPTIONS.PRESENT) {
        if (letterValueMap.get(letterValue) !== OPTIONS.CORRECT) {
          letterValueMap.set(letterValue, option)
        }
      } else if (option === OPTIONS.CORRECT) {
        letterValueMap.set(letterValue, option)
      }
    })
    letterValueMap.forEach((option, letterValue) => {
      const keyId = createKeyId(letterValue)
      const key = document.getElementById(keyId)
      key.classList.add(OPTIONS_TO_CLASS[option])
    })
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
    if (hasGuessedCorrectly) { return }
    enterLetter(letter)
  }
  const onClickEnter = () => {
    if (hasGuessedCorrectly) { return }
    checkCurrentGuess()
  }
  const onClickBackspace = () => {
    if (hasGuessedCorrectly) { return }
    removeCurrentLetter()
  }

  const CONTAINER_ID = "wordal"
  const container = document.getElementById(CONTAINER_ID)
  const isValidGame = DECODED_ANSWER.length > 0

  if (isValidGame) {
    container.appendChild(generateBoard(WORD_LENGTH, MAX_GUESS_COUNT))
  }
  if (isValidGame) {
    container.appendChild(generateKeyboard(
      onClickLetter,
      onClickEnter,
      onClickBackspace,
    ))
  }
  container.appendChild(generateActionPanel(onShare))
})
