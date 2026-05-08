// Society building data — Siddha Galaxia Phase 2.
// 9 towers, 13 floors per tower, 9 units per floor (101–109, 201–209, … 1301–1309).

export const TOWERS = [
  'Atlas',
  'Bianca',
  'Capella',
  'Cygnus',
  'Europa',
  'Mynsa',
  'Ophelia',
  'Orion',
  'Phoenix',
]

export const UNIT_NUMBERS = (() => {
  const units = []
  for (let floor = 1; floor <= 13; floor += 1) {
    for (let unit = 1; unit <= 9; unit += 1) {
      units.push(`${floor}${String(unit).padStart(2, '0')}`)
    }
  }
  return units
})()

// Group units by floor for nicer dropdown UX (optional helper).
export const UNIT_NUMBERS_BY_FLOOR = Array.from({ length: 13 }, (_, i) => {
  const floor = i + 1
  return {
    floor,
    units: Array.from({ length: 9 }, (_, j) => `${floor}${String(j + 1).padStart(2, '0')}`),
  }
})
