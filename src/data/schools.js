// ---------------------------------------------------------------------------
// Schools you can add to your account.
//
// Clearpath is one app per school: reviews of a class only mean something next
// to the other classes at the same school. Westlake is the one with a catalog
// loaded. The rest are listed so students at those schools can ask for theirs,
// and so nobody gets a blank search screen.
// ---------------------------------------------------------------------------

export const SCHOOLS = [
  {
    id: 'westlake',
    name: 'Westlake High School',
    short: 'Westlake',
    district: 'Eanes ISD',
    city: 'Austin, TX',
    mascot: 'Chaparrals',
    initials: 'WHS',
    hue: '#0E6B4F',
    catalog: true,
  },
  { id: 'lake-travis', name: 'Lake Travis High School', short: 'Lake Travis', district: 'Lake Travis ISD', city: 'Austin, TX', mascot: 'Cavaliers', initials: 'LT', hue: '#1B3A8F', catalog: false },
  { id: 'austin-high', name: 'Austin High School', short: 'Austin High', district: 'Austin ISD', city: 'Austin, TX', mascot: 'Maroons', initials: 'AHS', hue: '#7A1F33', catalog: false },
  { id: 'anderson', name: 'Anderson High School', short: 'Anderson', district: 'Austin ISD', city: 'Austin, TX', mascot: 'Trojans', initials: 'AND', hue: '#1F4E79', catalog: false },
  { id: 'bowie', name: 'Bowie High School', short: 'Bowie', district: 'Austin ISD', city: 'Austin, TX', mascot: 'Bulldogs', initials: 'BOW', hue: '#2B3A55', catalog: false },
  { id: 'mccallum', name: 'McCallum High School', short: 'McCallum', district: 'Austin ISD', city: 'Austin, TX', mascot: 'Knights', initials: 'MAC', hue: '#5B2E86', catalog: false },
  { id: 'westwood', name: 'Westwood High School', short: 'Westwood', district: 'Round Rock ISD', city: 'Austin, TX', mascot: 'Warriors', initials: 'WW', hue: '#0E5A6B', catalog: false },
  { id: 'round-rock', name: 'Round Rock High School', short: 'Round Rock', district: 'Round Rock ISD', city: 'Round Rock, TX', mascot: 'Dragons', initials: 'RR', hue: '#8A4B10', catalog: false },
  { id: 'cedar-park', name: 'Cedar Park High School', short: 'Cedar Park', district: 'Leander ISD', city: 'Cedar Park, TX', mascot: 'Timberwolves', initials: 'CP', hue: '#2F6B3A', catalog: false },
  { id: 'vandegrift', name: 'Vandegrift High School', short: 'Vandegrift', district: 'Leander ISD', city: 'Austin, TX', mascot: 'Vipers', initials: 'VHS', hue: '#3A2F6B', catalog: false },
  { id: 'dripping-springs', name: 'Dripping Springs High School', short: 'Dripping Springs', district: 'Dripping Springs ISD', city: 'Dripping Springs, TX', mascot: 'Tigers', initials: 'DS', hue: '#9A6B12', catalog: false },
  { id: 'hays', name: 'Hays High School', short: 'Hays', district: 'Hays CISD', city: 'Buda, TX', mascot: 'Rebels', initials: 'HHS', hue: '#1D5C8A', catalog: false },
]

export const SCHOOL_MAP = Object.fromEntries(SCHOOLS.map((s) => [s.id, s]))

export const AVATAR_COLORS = [
  '#4F46E5',
  '#0E9F7E',
  '#D9534A',
  '#C77A2A',
  '#2D8FD5',
  '#B94BC4',
  '#2FA3A8',
  '#7A6FD4',
]
