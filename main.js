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
    const initialPass = answer.split("").map((char, index) => {
      const charGuess = guess[index]
      if (char === charGuess) return OPTIONS.CORRECT
      else if (answer.includes(charGuess)) return null
      else return OPTIONS.ABSENT
    })
    if (!initialPass.includes(null)) return initialPass
    return initialPass.map((result, index) => {
      const charGuess = guess[index]
      if (result !== null) return result
      const charIndices = answer.split("")
        .map((char, index) => ({isEqual: char === charGuess, index}))
        .filter(({isEqual}) => isEqual)
        .map(({index}) => index)
      const containsCharNotGuessed = !charIndices.every(index => initialPass[index] === OPTIONS.CORRECT)
      if (answer.includes(charGuess) && containsCharNotGuessed) return OPTIONS.PRESENT
      else return OPTIONS.ABSENT
    })

  }

  const resultToText = (result) => {
    return result.map(option => OPTIONS_TO_TEXT[option])
  }

  const content = resultToText(checkWord("agora", "arose"))
  console.log(content)

  const CONTAINER_ID = "wordal"
  const container = document.getElementById(CONTAINER_ID)
  container.innerHTML = content
})
