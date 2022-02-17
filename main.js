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

  const WORD_LENGTH = 5
  const MAX_GUESS_COUNT = 6

  const QUERY_PARAM_ANSWER_KEY = "answer"
  const ENCODED_ANSWER = (new URLSearchParams(window.location.search)).get(QUERY_PARAM_ANSWER_KEY)
  const DECODED_ANSWER = window.atob(ENCODED_ANSWER)

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
  const createFieldId = (row, column) => `field-${row}-${column}`
  const createCell = (row, column) => {
    const cell = document.createElement("div")
    cell.id = createCellId(row, column)
    cell.classList.add("cell")
    const field = document.createElement("input")
    field.id = createFieldId(row, column)
    field.type = "text"
    field.maxLength = 1
    field.classList.add("field")
    cell.appendChild(field)
    return cell
  }

  const fieldsInLine = (wordLength, row) => {
    const fields = []
    for (let column = 0; column < wordLength; column++) {
      fields.push(document.getElementById(createFieldId(row, column)))
    }
    return fields
  }
  const fieldsToGuess = fields => fields.map(field => field.value).join("")

  const lineIsValid = (wordLength, row) => {
    const fields = fieldsInLine(wordLength, row)
    return fields.every(field => field.value.length === 1)
  }

  let currentLine = 0
  const checkLine = (answer, wordLength) => {
    const fields = fieldsInLine(wordLength, currentLine)
    const guess = fieldsToGuess(fields)
    const result = checkWord(answer.toLowerCase(), guess.toLowerCase())
    console.log(resultToEmoji(result))
    fields.forEach((field, index) => {
      field.parentElement.classList.add(OPTIONS_TO_CLASS[result[index]])
    })
    currentLine++
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

  const generateCheckButton = (wordLength) => {
    const container = document.createElement("div")
    container.classList.add("check-button-container")
    const button = document.createElement("button")
    button.innerText = "Check"
    button.classList.add("check-button")
    button.addEventListener("click", function () {
      if (currentLine >= MAX_GUESS_COUNT) { return }
      if (!lineIsValid(WORD_LENGTH, currentLine)) { return }
      checkLine(DECODED_ANSWER, wordLength)
    })
    container.appendChild(button)
    return container
  }

  const getBaseUrl = () => window.location.href.split("?")[0]
  const generateLink = answer => {
    const encodedAnswer = window.btoa(answer)
    const baseUrl = getBaseUrl()
    const searchParams = new URLSearchParams()
    searchParams.set("answer", encodedAnswer)
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
    button.innerText = "Copy"
    button.classList.add("button")
    button.addEventListener("click", function () {
      const answer = field.value
      const href = generateLink(answer)
      link.innerText = href
      link.href = href
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

  const CONTAINER_ID = "wordal"
  const container = document.getElementById(CONTAINER_ID)
  container.appendChild(generateBoard(WORD_LENGTH, MAX_GUESS_COUNT))
  container.appendChild(generateCheckButton(WORD_LENGTH))
  container.appendChild(generateLinkGenerator())
})
