interface Axis { x: number; y: number; z: number }

/** Screen coordinates: X right, Y down, Z away. Remove screen roll before
 * measuring depth angles: an ear-to-shoulder tilt must not amplify yaw/pitch. */
export function poseFromAxes(right: Axis, down: Axis) {
  const horizontal = Math.hypot(right.x, right.y);
  const roll = Math.atan2(right.y, right.x);
  const yaw = Math.atan2(right.z, horizontal);
  const vertical = -Math.sin(roll)*down.x + Math.cos(roll)*down.y;
  const pitch = Math.atan2(down.z/Math.max(.15, Math.cos(yaw)), vertical);
  return { yaw, pitch };
}
