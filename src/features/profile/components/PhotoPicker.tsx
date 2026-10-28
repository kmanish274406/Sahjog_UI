import { useRef, useState } from 'react'
import { assetUrl } from '@/api/http'
import { Avatar, Button } from '@/components/ui'
import { imageProblem } from '@/domain/validators'
import shared from '@/styles/shared.module.css'

/** The profile picture with a way to replace it. Checks the file before it is sent; the API checks it again. */
export function PhotoPicker({
  name,
  photo,
  busy,
  onPick,
}: {
  name: string
  photo: string
  busy: boolean
  onPick: (file: File) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [problem, setProblem] = useState<string | null>(null)

  return (
    <div className={shared.row} style={{ gap: 16, alignItems: 'center' }}>
      <Avatar name={name} size={72} src={assetUrl(photo)} />
      <div>
        <Button variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}>
          {photo ? 'Change photo' : 'Add a photo'}
        </Button>
        <p className={`${shared.muted} ${shared.small}`} style={{ marginTop: 6 }}>
          JPG, PNG or WEBP, up to 3 MB.
        </p>
        {problem && (
          <p role="alert" className={shared.small} style={{ color: 'var(--color-danger)' }}>
            {problem}
          </p>
        )}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            const message = imageProblem(file, 3)
            setProblem(message)
            if (!message) onPick(file)
          }}
        />
      </div>
    </div>
  )
}
