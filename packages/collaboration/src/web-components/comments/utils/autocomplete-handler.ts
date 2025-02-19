import { ParticipantByGroupApi } from '../../../common/types/participant.types';
import { CommentMention } from '../../../components/comments/types';

export class AutoCompleteHandler {
  constructor () {
    this.input = null
    this.mentions = []
  }

  private readonly keys = ['@']
  event: InputEvent
  input: HTMLTextAreaElement
  key: string
  mentions: CommentMention[]

  setInput (event: InputEvent) {
    this.event = event
    this.input = event.target as HTMLTextAreaElement

    this.key = event.data
  }

  getMentions(input, mentions: CommentMention[]= []) {
    if (mentions.length > 0) {
      this.mentions = mentions
    }

    return this.mentions.filter((mention) => {
      const hasParticipantName = (mention, input) => input.includes(mention.name);

      return hasParticipantName(mention, input);
    });
  }

  setMentions (mentions) {
    this.mentions = mentions
  }

  addMention (mention: { userId: string, name: string }) {
    const isDuplicated = this.mentions.some((m) => m.userId === mention.userId);
    if (!isDuplicated) {
      this.mentions.push(mention);
    }
  }

  clearMentions () {
    this.mentions = []
  }

  getSelectionPosition () {
    const caretIndex = this.getSelectionStart()
    const keyData = this.getLastKeyBeforeCaret(caretIndex)
    const keyIndex = keyData?.keyIndex ?? -1

    return {
      start: keyIndex + 1,
      end: caretIndex,
    }
  }

  getSelectionStart () {
    return this.input?.selectionStart
  }

  setCaretPosition (index) {
    this.input.selectionEnd = index
  }

  getValue () {
    return this.input?.value
  }

  setValue (value) {
    this.input.value = value
  }

  getLastKeyBeforeCaret (caretIndex) {
    const [keyData] = this.keys.map(key => ({
      key,
      keyIndex: this.getValue().lastIndexOf(key, caretIndex - 1),
    })).sort((a, b) => b.keyIndex - a.keyIndex)
    return keyData
  }

  searchMention (caretIndex, keyIndex) {
    if (keyIndex !== -1) {
      const searchText = this.getValue().substring(keyIndex + 1, caretIndex)

      return searchText
    }
    
    return null
  }

  isDeletion (): boolean {
    return this.event.inputType === 'deleteContentBackward' || this.event.inputType === 'deleteContentForward' || this.event.inputType === 'deleteWordBackward'
  }

  insertMention (start: number, end: number, participant: ParticipantByGroupApi) {
    if (this.isDeletion()) {
      return
    }

    const { id, name } = participant
    const text = `${this.getValue().slice(0, start) + name} ${this.getValue().slice(end, this.getValue().length)}`

    this.setValue(text)
    this.input.focus()

    this.addMention({
      userId: id,
      name
    })

    this.setCaretPosition(start + name.length + 1)
  }
}
