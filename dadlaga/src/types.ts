export type Mode = 'choropleth' | 'distinct';

export interface ViewershipItem {
  aimag_slug: string;
  views: number;
  per_1000: number;
}

export interface ViewershipResponse {
  date: string;
  metric: 'views' | 'per_1000';
  data: ViewershipItem[];
}
