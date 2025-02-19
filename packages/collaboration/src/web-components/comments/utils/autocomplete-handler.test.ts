import { MOCK_PARTICIPANT_LIST } from "../../../../__mocks__/participants.mock"

import { AutoCompleteHandler } from "./autocomplete-handler"

const createTextArea = () => {
  const textarea = document.createElement('textarea')
  document.body.appendChild(textarea)
  return textarea
}

const sendInputEvent = (input: HTMLTextAreaElement, data: string): InputEvent => {
  const event = new InputEvent('input', { data, inputType: 'insertText' })
  input.dispatchEvent(event)
  return event
}

describe('AutoComplete Handler', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('setInput', () => {
    test('should set input', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()

      const event = sendInputEvent(textarea, 'a')

      autocompleteHandler.setInput(event)

      expect(autocompleteHandler.event).toEqual(event)
      expect(autocompleteHandler.input).toEqual(textarea)
      expect(autocompleteHandler.key).toEqual('a')
      expect(autocompleteHandler.mentions).toEqual([])
    })

    test('should set value', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()

      const input = sendInputEvent(textarea, 'a')
      autocompleteHandler.setInput(input)
      
      autocompleteHandler.setValue('test')
      expect(autocompleteHandler.getValue()).toEqual('test')
    })
  })

  describe('setMentions', () => {
    test('should set mentions', () => {
      const autocompleteHandler = new AutoCompleteHandler()
      const mentions = [{ userId: '1', name: 'name' }]

      autocompleteHandler.setMentions(mentions)

      expect(autocompleteHandler.mentions).toEqual(mentions)
    })
  })

  describe('addMention', () => {
    test('should add mention', () => {
      const autocompleteHandler = new AutoCompleteHandler()
      const mention1 = { userId: '1', name: 'name' }
      const mention2 = { userId: '2', name: 'name' }

      autocompleteHandler.setMentions([mention1])

      autocompleteHandler.addMention(mention2)

      expect(autocompleteHandler.mentions).toEqual([mention1, mention2])
    })

    test('should not add mention if it is duplicated', () => {
      const autocompleteHandler = new AutoCompleteHandler()
      const mention1 = { userId: '1', name: 'name' }
      const mention2 = { userId: '1', name: 'name' }

      autocompleteHandler.setMentions([mention1])

      autocompleteHandler.addMention(mention2)

      expect(autocompleteHandler.mentions).toEqual([mention1])
    })
  })

  describe('clearMentions', () => {
    test('should clear mentions', () => {
      const autocompleteHandler = new AutoCompleteHandler()
      const mentions = [{ userId: '1', name: 'name' }]

      autocompleteHandler.setMentions(mentions)

      autocompleteHandler.clearMentions()

      expect(autocompleteHandler.mentions).toEqual([])
    })
  })

  describe('getMentions', () => {
    test('should return mentions', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()
      const mentions = { userId: '1', name: 'name' }
      const name = `@${mentions.name}`

      const input = sendInputEvent(textarea, name)
      autocompleteHandler.setInput(input)
      textarea.value = `@${mentions.name} lorem ipsum`

      autocompleteHandler.addMention(mentions)

      const result = autocompleteHandler.getMentions(textarea.value)
      expect(result).toEqual([mentions])
    })

    test('should return mentions with duplicated', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()
      const mentions = { userId: '1', name: 'name' }
      const name = `@${mentions.name}`

      const input = sendInputEvent(textarea, name)
      autocompleteHandler.setInput(input)
      textarea.value = `@${mentions.name} lorem ipsum`

      autocompleteHandler.addMention(mentions)
      autocompleteHandler.addMention(mentions)

      const result = autocompleteHandler.getMentions(textarea.value)
      expect(result).toEqual([mentions])
    })

    test('should return empty when deleting a mention', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()
      const mentions = { userId: '1', name: 'name' }
      const name = `@${mentions.name}`

      const input = sendInputEvent(textarea, name)
      autocompleteHandler.setInput(input)
      textarea.value = `@${mentions.name} lorem ipsum`

      autocompleteHandler.addMention(mentions)

      const result = autocompleteHandler.getMentions(textarea.value)
      expect(result).toEqual([mentions])

      textarea.value = `lorem ipsum`
      const event = sendInputEvent(textarea, 'd')
      autocompleteHandler.setInput(event)

      const result2 = autocompleteHandler.getMentions(textarea.value)
      expect(result2).toEqual([])
    })
  })

  describe('getSelectionPosition', () => {
    test('should return selection position', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()
      const mentions = { userId: '1', name: 'name' }
      const name = `@${mentions.name}`

      const input = sendInputEvent(textarea, name)
      autocompleteHandler.setInput(input)
      textarea.value = `@${mentions.name} test name`

      autocompleteHandler.addMention(mentions)

      const result = autocompleteHandler.getSelectionPosition()
      expect(result).toEqual({
        start: 1,
        end: textarea.value.length,
      })
    })
  })

  describe('setCaretPosition', () => {
    test('should set caret position', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()
      const mentions = { userId: '1', name: 'name' }
      const name = `@${mentions.name}`
      const input = sendInputEvent(textarea, name)
      autocompleteHandler.setInput(input)
      textarea.value = `@${mentions.name} test name`
      
      const result = autocompleteHandler.getSelectionPosition()
      expect(result).toEqual({
        start: 1,
        end: textarea.value.length,
      })

      autocompleteHandler.setCaretPosition(4)

      const result2 = autocompleteHandler.getSelectionPosition()

      expect(result2).toEqual({
        start: 1,
        end: 4,
      })
    })
  })

  describe('getLastKeyBeforeCaret', () => {
    test('should return last key before caret', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()
      const mentions = { userId: '1', name: 'name' }
      const name = `@${mentions.name}`
      const input = sendInputEvent(textarea, name)
      autocompleteHandler.setInput(input)
      textarea.value = `abc @${mentions.name} test name`
      
      const result = autocompleteHandler.getLastKeyBeforeCaret(4)
      expect(result).toEqual({
        key: '@',
        keyIndex: -1,
      })
    })
  })

  describe('searchMention', () => {
    test('should return mention', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()
      const mentions = { userId: '1', name: 'name' }
      const name = `@${mentions.name}`
      textarea.value = `abc @${mentions.name} test name`
      const input = sendInputEvent(textarea, name)
      autocompleteHandler.setInput(input)
      
      const result = autocompleteHandler.searchMention(9, 4)
      expect(result).toEqual('name')
    })
  })

  describe('insertMention', () => {
    test('should insert mention', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()
      const mentions = MOCK_PARTICIPANT_LIST[0]
      const input = sendInputEvent(textarea, '')
      autocompleteHandler.setInput(input)
      textarea.value = 'abc test name @'
      
      autocompleteHandler.insertMention(
        textarea.value.length,
        textarea.value.length + mentions.name.length,
        mentions
      )

      const result = textarea.value
      expect(result).toEqual('abc test name @unit-test-participant1-name ')
    })

    test('should\'nt insert mention if it is deletion input', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()
      const mentions = MOCK_PARTICIPANT_LIST[0]
      const input = sendInputEvent(textarea, '')
      autocompleteHandler.setInput(input)
      textarea.value = 'abc test name @'
      
      const event = new InputEvent('input', { data: 'a', inputType: 'deleteContentBackward' })
      autocompleteHandler.setInput(event)

      autocompleteHandler.insertMention(
        textarea.value.length,
        textarea.value.length + mentions.name.length,
        mentions
      )

      const result = textarea.value
      expect(result).toEqual('abc test name @')
    })
  })

  describe('isDeletion', () => {
    test('should return true when deleting', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()
      const event = new InputEvent('input', { data: 'a', inputType: 'deleteContentBackward' })
      autocompleteHandler.setInput(event)
      textarea.value = 'abc test name @'

      const result = autocompleteHandler.isDeletion()
      expect(result).toEqual(true)
    })

    test('should return false when not deleting', () => {
      const textarea = createTextArea()
      const autocompleteHandler = new AutoCompleteHandler()
      const event = new InputEvent('input', { data: 'a', inputType: 'insertText' })
      autocompleteHandler.setInput(event)
      textarea.value = 'abc test name @'

      const result = autocompleteHandler.isDeletion()
      expect(result).toEqual(false)
    })
  })     
})
