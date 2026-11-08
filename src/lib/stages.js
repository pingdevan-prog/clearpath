// ---------------------------------------------------------------------------
// Review stages. Every review clears a little more of the path for the
// students picking classes after you, so the stages are steps along a trail.
// Counted across every school you review at.
// ---------------------------------------------------------------------------

export const STAGES = [
  {
    at: 1,
    name: 'Scout',
    icon: 'steps',
    hue: '#12A37F',
    blurb: 'Your first review is out there. Someone picking classes just got a real answer.',
  },
  {
    at: 3,
    name: 'Pathfinder',
    icon: 'map',
    hue: '#2F7BEA',
    blurb: 'Three classes mapped. People can see the path before they walk it.',
  },
  {
    at: 8,
    name: 'Trail Guide',
    icon: 'flag',
    hue: '#8A6CF0',
    blurb: 'Eight reviews. Underclassmen are building their schedules on what you wrote.',
  },
  {
    at: 15,
    name: 'Navigator',
    icon: 'compass',
    hue: '#E08A1E',
    blurb: 'Fifteen classes. You know this catalog better than almost anyone.',
  },
  {
    at: 25,
    name: 'Trailblazer',
    icon: 'mountain',
    hue: '#E0457B',
    blurb: 'Twenty five reviews. You have cleared the path for everyone behind you.',
  },
]

/** Index of the stage you have reached with this many reviews, or -1 before the first. */
export function stageIndex(count) {
  let i = -1
  STAGES.forEach((s, j) => {
    if (count >= s.at) i = j
  })
  return i
}

/** The stage a new review just carried you into, or null if it did not cross one. */
export function stageCrossed(before, after) {
  const a = stageIndex(before)
  const b = stageIndex(after)
  return b > a ? STAGES[b] : null
}
