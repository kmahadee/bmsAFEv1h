export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: string;
  status: 'completed' | 'current' | 'pending';
  badgeClass: string;
}
