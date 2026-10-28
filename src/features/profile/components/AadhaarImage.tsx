import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/api'
import { Button } from '@/components/ui'
import { imageProblem } from '@/domain/validators'
import { useApiQuery } from '@/hooks/useApi'
import shared from '@/styles/shared.module.css'

/**
 * The Aadhaar card picture. It is not a public file: it is fetched with the person's own sign-in and shown from memory,
 * so it never has an address anyone else could open.
 */
export function AadhaarImage({
  uploaded,
  busy,
  onPick,
}: {
  uploaded: boolean
  busy: boolean
  onPick: (file: File) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const image = useApiQuery(['profile', 'aadhaar-photo'], api.auth.aadhaarPhoto, {
    enabled: uploaded,
    staleTime: Infinity,
  })
  // The address of the picture in memory: made while rendering, released when the picture changes or the page closes.
  const url = useMemo(
    () => (image.data ? URL.createObjectURL(image.data) : undefined),
    [image.data],
  )
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url])

  return (
    <div className={shared.stackTight}>
      <p className={shared.small} style={{ fontWeight: 600 }}>
        Aadhaar card image
      </p>
      {uploaded && url && (
        <img
          src={url}
          alt="Your Aadhaar card"
          style={{
            maxWidth: 320,
            width: '100%',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}
        />
      )}
      {uploaded && !url && image.isError && (
        <p className={shared.small} style={{ color: 'var(--color-danger)' }}>
          {image.error.message}
        </p>
      )}
      <div>
        <Button variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}>
          {uploaded ? 'Replace image' : 'Upload image'}
        </Button>
        <p className={`${shared.muted} ${shared.small}`} style={{ marginTop: 6 }}>
          A clear photo of the front of the card. JPG, PNG or WEBP, up to 5 MB. Only you can see it.
        </p>
        {problem && (
          <p role="alert" className={shared.small} style={{ color: 'var(--color-danger)' }}>
            {problem}
          </p>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          const message = imageProblem(file, 5)
          setProblem(message)
          if (!message) onPick(file)
        }}
      />
    </div>
  )
}
