// Utility function to get the display name of a team (Hebrew with fallback to English)
export function getTeamDisplayName(team: { name: string; hebrewName?: string | null } | null | undefined): string {
  if (!team) return 'קבוצה לא ידועה'
  return team.hebrewName || team.name
}
