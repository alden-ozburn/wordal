document.addEventListener("DOMContentLoaded", function () {
  const range = length => [...Array(length).keys()]
  const zip = (...arrays) => arrays.length > 0
    ? range(Math.min(...arrays.map(array => array.length))).map(index =>
        arrays.map(array => array[index])
      )
    : []
  const getBaseUrl = () => window.location.href.split("?")[0]
  const encodeAnswer = answer => answer ? window.btoa(answer) : ""
  const decodeAnswer = encodedAnswer => encodedAnswer ? window.atob(encodedAnswer) : ""
  const getQueryParameterValue = key => new URLSearchParams(window.location.search).get(key)
  const answerIsValid = answer => answer.length > 0

  const BASE_URL = getBaseUrl()
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
  const ENCODED_ANSWER = getQueryParameterValue(QUERY_PARAM_ANSWER_KEY)
  const ANSWER = decodeAnswer(ENCODED_ANSWER)
  const WORD_LENGTH = ANSWER.length
  const MAX_GUESS_COUNT = WORD_LENGTH + 1

  const CONTAINER_ID = "wordal"
  const IS_ANSWER_VALID = answerIsValid(ANSWER)
  let hasGuessedCorrectly = false
  let currentLine = 0
  let currentLetter = 0

  const EMPTY_CELL_VALUE = null
  const rowRange = range(MAX_GUESS_COUNT)
  const columnRange = range(WORD_LENGTH)
  const createState = () =>
    rowRange.map(_ =>
      columnRange.map(_ => EMPTY_CELL_VALUE)
    )
  const getStateAt = (state, row, column) => state[row][column]
  const setStateAtCell = (state, row, column, value) => state[row][column] = value
  const clearStateAt = (state, row, column) => state[row][column] = EMPTY_CELL_VALUE
  const setStateAtCurrentCell = (state, value) => {
    setStateAtCell(state, currentLine, currentLetter, value)
    currentLetter++
  }
  const clearStateAtPrevious = (state) => {
    clearStateAt(state, currentLine, currentLetter - 1)
    currentLetter--
  }
  const setStateAtLine = (state, row, values) =>
    columnRange.forEach(column => setStateAtCell(state, row, column, values[column]))
  const setStateAtCurrentLine = (state, values) => setStateAtLine(state, currentLine, values)

  const updateLetterOptionMapping = (mapping, guess, result) => {
    zip(guess.split(""), result).forEach(([letter, option]) => {
      mapping.set(letter, (mapping.get(letter) || []).concat([option]))
    })
    letterValueMap.forEach((option, letterValue) => {
      const keyId = createKeyId(letterValue)
      const key = document.getElementById(keyId)
      key.classList.add(OPTIONS_TO_CLASS[option])
    })
  }

  const boardState = createState()
  const optionState = createState()
  const letterOptionState = new Map()

  const createLineId = row => `line-${row}`
  const createCellId = (row, column) => `cell-${row}-${column}`
  const getCell = (row, column) => document.getElementById(createCellId(row, column))
  const getCellValue = (cell) => cell.innerText.toLowerCase()
  const setCellValue = (cell, value) => cell.innerText = value
  const setCellClassName = (cell, className) =>
    !cell.classList.contains("checked") && cell.classList.add(className)

  const updateBoard = ({boardState, optionState}) => {
    rowRange.forEach(row => {
      columnRange.forEach(column => {
        const cell = getCell(row, column)
        setCellValue(
          cell,
          getStateAt(boardState, row, column) || "",
        )
        setCellClassName(
          cell,
          OPTIONS_TO_CLASS[getStateAt(optionState, row, column)]
        )
      })
    })
  }

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

  const createBoard = () => {
    const board = document.createElement("div")
    board.classList.add("board")
    return board
  }
  const createLine = row => {
    const line = document.createElement("div")
    line.id = createLineId(row)
    line.classList.add("line")
    return line
  }
  const createCell = (row, column) => {
    const cell = document.createElement("div")
    cell.id = createCellId(row, column)
    cell.classList.add("cell")
    return cell
  }

  const cellsInLine = (wordLength, row) => {
    return range(wordLength).map(column =>
      getCell(row, column)
    )
  }

  const lineIsValid = (wordLength, row) => {
    const cells = cellsInLine(wordLength, row)
    return cells.every(cell => getCellValue(cell).length === 1)
  }

  const getGuessFromLine = (state, line) => state[line].join("")
  const getResult = (answer, guess) => {
    return checkWord(answer.toLowerCase(), guess.toLowerCase())
  }
  const getResultFromLine = (answer, wordLength, line) => {
    const guess = getGuessFromLine(wordLength, line)
    return getResult(answer, guess)
  }

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
  const checkLine = (state, answer) => {
    const guess = getGuessFromLine(state.boardState, currentLine)
    const result = getResult(answer, guess)
    console.log(resultToEmoji(result))
    if (resultIsCorrect(result)) {
      onCorrectGuess()
    }
    setStateAtCurrentLine(state.optionState, result)
    updateLetterOptionMapping(state.letterOptionState, guess, result)
    updateKeyboard(state.letterOptionState)
    currentLine++
    currentLetter = 0
  }

  const generateBoard = (wordLength, maxGuessCount) => {
    const board = createBoard()
    range(maxGuessCount)
      .forEach(row => {
        const line = createLine(row)
        range(wordLength)
          .map(column => createCell(row, column))
          .forEach(cell => line.appendChild(cell))
        board.appendChild(line)
      })
    return board
  }

  const generateLink = (baseURL, answer) => {
    const encodedAnswer = encodeAnswer(answer)
    const searchParams = new URLSearchParams()
    searchParams.set(QUERY_PARAM_ANSWER_KEY, encodedAnswer)
    const queryString = searchParams.toString()
    return `${baseURL}?${queryString}`
  }

  const onShare = state => () => {
    if (!hasGuessedCorrectly) { return }
    const emoji = state.optionState.slice(0, currentLine)
      .map(resultToEmoji).join("\n")
    const text = [NAME, ENCODED_ANSWER, emoji].join("\n")
    console.log(text)
    navigator.clipboard.writeText(text).then(() => {
      window.alert("Text copied")
    })
  }

  const createShareButtonId = () => "share-button"
  const generateActionPanel = (onShare) => {
    const container = document.createElement("div")
    container.classList.add("action-panel")

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
      const href = generateLink(BASE_URL, answer)
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
    range(ALPHABET_KEYS.length).forEach(row => {
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
      range(rowLetters.length).forEach(letter => {
        const letterValue = rowLetters[letter]
        const key = document.createElement("button")
        key.id = createKeyId(letterValue)
        key.classList.add("keyboard-key")
        key.innerText = letterValue
        key.addEventListener("click", function () {
          onClickLetter(letterValue)
        })
        keyRow.appendChild(key)
      })
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
    })
    return keyboard
  }

  const updateKeyboard = (mapping) => {
    mapping.forEach((options, letterValue) => {
      const keyId = createKeyId(letterValue)
      const key = document.getElementById(keyId)
      key.classList.add(...options.map(option => OPTIONS_TO_CLASS[option]))
    })
  }

  const positionIsSettable = letter => letter < WORD_LENGTH
  const positionIsClearable = letter => letter > 0
  const currentPositionIsSettable = () => positionIsSettable(currentLetter)
  const previousPositionIsClearable = () => positionIsClearable(currentLetter)

  const enterLetter = (state, letter) => {
    if (!currentPositionIsSettable()) { return }
    setStateAtCurrentCell(state.boardState, letter)
    updateBoard(state)
  }

  const checkCurrentGuess = (state) => {
    if (currentLine >= MAX_GUESS_COUNT) { return }
    if (!lineIsValid(WORD_LENGTH, currentLine)) { return }
    checkLine(state, ANSWER, WORD_LENGTH)
    updateBoard(state)
  }

  const removePreviousLetter = (state) => {
    if (!previousPositionIsClearable()) { return }
    clearStateAtPrevious(state.boardState)
    updateBoard(state)
  }

  const onClickLetter = state => letter => {
    if (hasGuessedCorrectly) { return }
    enterLetter(state, letter)
  }
  const onClickEnter = state => () => {
    if (hasGuessedCorrectly) { return }
    checkCurrentGuess(state)
  }
  const onClickBackspace = state => () => {
    if (hasGuessedCorrectly) { return }
    removePreviousLetter(state)
  }

  const container = document.getElementById(CONTAINER_ID)
  const state = {boardState, optionState, letterOptionState}
  if (IS_ANSWER_VALID) {
    container.appendChild(generateBoard(WORD_LENGTH, MAX_GUESS_COUNT))
    container.appendChild(generateKeyboard(
      onClickLetter(state),
      onClickEnter(state),
      onClickBackspace(state),
    ))
  }
  container.appendChild(generateActionPanel(onShare(state)))
})
