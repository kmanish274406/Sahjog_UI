import { Badge } from '@/components/ui'
import { STAGE_LABELS } from '@/domain/constants'
import { stageTone } from '@/domain/stage'
import type { BookingStage } from '@/domain/types'

export function StageBadge({ stage }: { stage: string }) {
  const known = stage as BookingStage
  return <Badge tone={stageTone(known)}>{STAGE_LABELS[known] ?? stage}</Badge>
}
