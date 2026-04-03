export const STATUS_LABELS = {
  'preparation': 'Preparación',
  'kickoff': 'Kickoff',
  'active': 'Activo',
  'finished': 'Finalizado',
  'archived': 'Archivado'
} as const;

export type ProjectStatus = keyof typeof STATUS_LABELS;

export const STATUS_COLORS = {
  'preparation': 'slate',
  'kickoff': 'orange',
  'active': 'keppel',
  'finished': 'celadon',
  'archived': 'slate'
} as const;
