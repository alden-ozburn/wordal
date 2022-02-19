document.addEventListener("DOMContentLoaded", function () {
  const ACCEPTED_WORDS = window.WORDAL_DATA
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

  const saveStateByKey = (key, state) => {
    localStorage.setItem(key, JSON.stringify({
      ...state,
      letterOptionState: Object.fromEntries(state.letterOptionState.entries())
    }))
  }
  const loadStateByKey = key => {
    const loadedState = localStorage.getItem(key)
    return loadedState ? JSON.parse(loadedState) : {}
  }

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

  const ACCEPTED_WORD_MAP = new Map([[5, ACCEPTED_WORDS]])
  const ACCEPTED_WORDS_LIST_DATA = ACCEPTED_WORD_MAP.get(WORD_LENGTH)
  const ACCEPTED_WORDS_LIST = ACCEPTED_WORDS_LIST_DATA ? ACCEPTED_WORDS_LIST_DATA.concat(ANSWER) : null

  const saveState = state => saveStateByKey(ENCODED_ANSWER, state)
  const loadState = () => loadStateByKey(ENCODED_ANSWER)

  let loadedState = loadState()
  if (
    loadedState &&
    loadedState.currentPositionState &&
    loadedState.currentPositionState.hasGuessedCorrectly
  ) {
    const message = "You have already solved this puzzle, would you like to clear it and play again?"
    const clearLoadedState = window.confirm(message)
    if (clearLoadedState) {
      loadedState = {}
    }
  }

  const CONTAINER_ID = "wordal"
  const IS_ANSWER_VALID = answerIsValid(ANSWER)
  const currentPositionState = loadedState.currentPositionState || {
    hasGuessedCorrectly: false,
    currentLine: 0,
    currentLetter: 0,
  }

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
    setStateAtCell(state, currentPositionState.currentLine, currentPositionState.currentLetter, value)
    currentPositionState.currentLetter++
  }
  const clearStateAtPrevious = (state) => {
    clearStateAt(state, currentPositionState.currentLine, currentPositionState.currentLetter - 1)
    currentPositionState.currentLetter--
  }
  const setStateAtLine = (state, row, values) =>
    columnRange.forEach(column => setStateAtCell(state, row, column, values[column]))
  const setStateAtCurrentLine = (state, values) => setStateAtLine(state, currentPositionState.currentLine, values)

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

  const boardState = loadedState.boardState || createState()
  const optionState = loadedState.optionState || createState()
  const letterOptionState = new Map(Object.entries(loadedState.letterOptionState || {}))
  const state = {
    boardState,
    optionState,
    letterOptionState,
    currentPositionState,
  }
  loadState(state)

  const createLineId = row => `line-${row}`
  const createCellId = (row, column) => `cell-${row}-${column}`
  const getCell = (row, column) => document.getElementById(createCellId(row, column))
  const getCellValue = (cell) => cell.innerText.toLowerCase()
  const setCellValue = (cell, value) => cell.innerText = value
  const setCellClassName = (cell, className) =>
    !cell.classList.contains("checked") && cell.classList.add(className)

  const updateBoard = state => {
    saveState(state)
    const {boardState, optionState} = state
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
    currentPositionState.hasGuessedCorrectly = true
    showShareButton()
  }
  const isAcceptedGuess = guess => {
    if (!ACCEPTED_WORDS_LIST) return true
    return ACCEPTED_WORDS_LIST.includes(guess)
  }
  const checkLine = (state, answer) => {
    const guess = getGuessFromLine(state.boardState, currentPositionState.currentLine)
    if (!isAcceptedGuess(guess)) {
      window.alert("Invalid word")
      return
    }
    const result = getResult(answer, guess)
    console.log(resultToEmoji(result))
    if (resultIsCorrect(result)) {
      onCorrectGuess()
    }
    setStateAtCurrentLine(state.optionState, result)
    updateLetterOptionMapping(state.letterOptionState, guess, result)
    updateKeyboard(state.letterOptionState)
    currentPositionState.currentLine++
    currentPositionState.currentLetter = 0
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
    const encodedAnswer = encodeAnswer(answer.toLowerCase())
    const searchParams = new URLSearchParams()
    searchParams.set(QUERY_PARAM_ANSWER_KEY, encodedAnswer)
    const queryString = searchParams.toString()
    return `${baseURL}?${queryString}`
  }

  const onShare = state => () => {
    if (!currentPositionState.hasGuessedCorrectly) { return }
    const emoji = state.optionState.slice(0, currentPositionState.currentLine)
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
    field.placeholder = "answer"
    field.classList.add("field")

    const linkButton = document.createElement("button")
    linkButton.innerText = "generate"
    linkButton.classList.add("button")
    linkButton.addEventListener("click", function () {
      const answer = field.value
      if (!answer) {
        window.alert("No answer specified")
        return
      }
      if (!!/[^a-z]/i.test(answer)) {
        window.alert("Answer can only contain alphabetic character")
      }
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
    if (!currentPositionState.hasGuessedCorrectly) {
      shareButton.classList.add("hidden")
    }
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
        key.classList.add("keyboard-key", "letter")
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
  const currentPositionIsSettable = () => positionIsSettable(currentPositionState.currentLetter)
  const previousPositionIsClearable = () => positionIsClearable(currentPositionState.currentLetter)

  const enterLetter = (state, letter) => {
    if (!currentPositionIsSettable()) { return }
    setStateAtCurrentCell(state.boardState, letter)
    updateBoard(state)
  }

  const checkCurrentGuess = (state) => {
    if (currentPositionState.currentLine >= MAX_GUESS_COUNT) { return }
    if (!lineIsValid(WORD_LENGTH, currentPositionState.currentLine)) { return }
    checkLine(state, ANSWER, WORD_LENGTH)
    updateBoard(state)
  }

  const removePreviousLetter = (state) => {
    if (!previousPositionIsClearable()) { return }
    clearStateAtPrevious(state.boardState)
    updateBoard(state)
  }

  const onClickLetter = state => letter => {
    if (currentPositionState.hasGuessedCorrectly) { return }
    enterLetter(state, letter)
  }
  const onClickEnter = state => () => {
    if (currentPositionState.hasGuessedCorrectly) { return }
    checkCurrentGuess(state)
  }
  const onClickBackspace = state => () => {
    if (currentPositionState.hasGuessedCorrectly) { return }
    removePreviousLetter(state)
  }

  const container = document.getElementById(CONTAINER_ID)
  if (IS_ANSWER_VALID) {
    container.appendChild(generateBoard(WORD_LENGTH, MAX_GUESS_COUNT))
    container.appendChild(generateKeyboard(
      onClickLetter(state),
      onClickEnter(state),
      onClickBackspace(state),
    ))
  }
  updateBoard(state)
  updateKeyboard(state.letterOptionState)
  container.appendChild(generateActionPanel(onShare(state)))
})
