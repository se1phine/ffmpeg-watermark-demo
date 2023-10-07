export function sliderValueToVideoTime(duration: number, sliderValue: number) {
  return Math.round(duration * sliderValue / 100)
}