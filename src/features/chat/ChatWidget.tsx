import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { api } from '@/api'
import type { ChatTurn } from '@/api/types'
import { useApiMutation } from '@/hooks/useApi'
import { useSettings } from '@/features/catalog/hooks/useCatalog'
import styles from './ChatWidget.module.css'

const GREETING: ChatTurn = {
  role: 'bot',
  text: 'Hello! Ask me about our services, prices, booking, payments or cancellations.',
}

/** A floating help chat. It exists only for a business whose super admin has switched the assistant on. */
export function ChatWidget() {
  const settings = useSettings()
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<ChatTurn[]>([GREETING])
  const [suggestions, setSuggestions] = useState<string[]>([
    'How do I book a service?',
    'How can I pay?',
  ])
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const ask = useApiMutation(api.chat.ask)

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [turns, open])

  if (!settings.data?.features.chatbot) return null

  const send = (message: string) => {
    const question = message.trim()
    if (question === '' || ask.isPending) return
    const history = turns.filter((t) => t !== GREETING)
    setTurns([...turns, { role: 'user', text: question }])
    setText('')
    ask.mutate(
      { message: question, history },
      {
        onSuccess: (r) => {
          setTurns((all) => [...all, { role: 'bot', text: r.reply }])
          setSuggestions(r.suggestions)
        },
        onError: (e) => setTurns((all) => [...all, { role: 'bot', text: e.message }]),
      },
    )
  }

  return (
    <div className={styles.root}>
      {open && (
        <section className={styles.panel} aria-label="Sahjog assistant">
          <header className={styles.head}>
            <span>Sahjog assistant</span>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </header>
          <div className={styles.log} role="log" aria-live="polite">
            {turns.map((t, i) => (
              <p key={i} className={t.role === 'user' ? styles.mine : styles.theirs}>
                {t.text}
              </p>
            ))}
            {ask.isPending && <p className={styles.theirs}>Typing…</p>}
            <div ref={end} />
          </div>
          {suggestions.length > 0 && (
            <div className={styles.chips}>
              {suggestions.slice(0, 3).map((s) => (
                <button key={s} type="button" className={styles.chip} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault()
              send(text)
            }}
          >
            <input
              className={styles.input}
              value={text}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your question"
              aria-label="Your question"
            />
            <button
              type="submit"
              className={styles.send}
              disabled={ask.isPending || text.trim() === ''}
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen(!open)}
        aria-label="Open the Sahjog assistant"
      >
        <MessageCircle size={26} />
      </button>
    </div>
  )
}
