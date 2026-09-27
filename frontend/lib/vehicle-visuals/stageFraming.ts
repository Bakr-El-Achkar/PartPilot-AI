/** Fit a rotating exterior model's bounding sphere inside the stage. */
export function getExteriorCameraDistance(
  radius: number,
  aspect: number,
  verticalFovDegrees: number,
): number {
  const halfVertical = (verticalFovDegrees * Math.PI) / 360;
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * Math.max(aspect, 0.1));
  return Math.max(
    radius / Math.tan(halfVertical),
    radius / Math.tan(halfHorizontal),
  ) * 1.12;
}
