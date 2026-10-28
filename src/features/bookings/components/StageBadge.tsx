import { Badge } from '@/components/ui'
import { STAGE_LABELS } from '@/domain/constants'
import { stageTone } from '@/domain/stage'
import { useLookups } from '@/hooks/useLookups'
import type { BookingStage } from '@/domain/types'

export function StageBadge({ stage }: { stage: string }) {
  const known = stage as BookingStage
  const lookups = useLookups()
  return (
    <Badge tone={stageTone(known)}>
      {lookups.text('stage', stage, STAGE_LABELS[known] ?? stage)}
    </Badge>
  )
}
