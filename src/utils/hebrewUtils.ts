// Hebrew translations for match stages and other UI elements

export function getStageDisplayName(stage: string): string {
  const stageMap: Record<string, string> = {
    'GROUP_STAGE': 'שלב בתים',
    'ROUND_OF_32': 'שמינית גמר',
    'ROUND_OF_16': 'שמינית גמר',
    'QUARTER_FINAL': 'רבע גמר',
    'SEMI_FINAL': 'חצי גמר',
    'THIRD_PLACE': 'משחק על המקום השלישי',
    'FINAL': 'גמר'
  }
  
  return stageMap[stage] || stage.replace(/_/g, ' ')
}

export function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    'SCHEDULED': 'מתוכנן',
    'LIVE': 'חי',
    'FINISHED': 'הסתיים',
    'POSTPONED': 'נדחה',
    'CANCELLED': 'בוטל'
  }
  
  return statusMap[status] || status
}

export function getPositionDisplayName(position: string): string {
  const positionMap: Record<string, string> = {
    'Goalkeeper': 'שוער',
    'Defender': 'מגן',
    'Midfielder': 'קשר',
    'Forward': 'חלוץ',
    'Attacker': 'תוקף'
  }
  
  return positionMap[position] || position
}
