export interface R_DataEntry {
  video_year: number,
  video_month: number,
  video_date: number,
  percent_green: number,
  percent_yellow: number,
  percent_red: number,
  mean_green: number | null,
  mean_yellow: number | null,
  mean_red: number | null,
  std_green: number | null,
  std_yellow: number | null,
  std_red: number | null,
  mode_green: number | null,
  mode_yellow: number | null,
  mode_red: number | null,
  count_videos: number
}


