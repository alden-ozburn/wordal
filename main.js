document.addEventListener("DOMContentLoaded", function () {
  const PRESENT = "PRESENT"
  const CORRECT = "CORRECT"
  const ABSENT = "ABSENT"
  const OPTIONS = Object.freeze({
    PRESENT,
    CORRECT,
    ABSENT,
  })
  const OPTIONS_TO_TEXT = Object.freeze({
    PRESENT: "Y",
    CORRECT: "G",
    ABSENT: "B",
  })

  const WORD_LENGTH = 5

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

  const resultToText = (result) => {
    return result.map(option => OPTIONS_TO_TEXT[option])
  }

  const content = resultToText(checkWord("agora", "arose")).join() // GYGBB
  console.log(content)

  const CONTAINER_ID = "wordal"
  const container = document.getElementById(CONTAINER_ID)
  container.innerHTML = content
})
