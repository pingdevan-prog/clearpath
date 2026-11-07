import westlakeLogo from '../assets/schools/westlake.webp'
import lakeTravisLogo from '../assets/schools/lake-travis.webp'
import austinHighLogo from '../assets/schools/austin-high.webp'
import andersonLogo from '../assets/schools/anderson.webp'
import bowieLogo from '../assets/schools/bowie.svg'
import mccallumLogo from '../assets/schools/mccallum.svg'
import westwoodLogo from '../assets/schools/westwood.webp'
import roundRockLogo from '../assets/schools/round-rock.webp'
import cedarParkLogo from '../assets/schools/cedar-park.webp'
import vandegriftLogo from '../assets/schools/vandegrift.webp'
import drippingSpringsLogo from '../assets/schools/dripping-springs.webp'
import haysLogo from '../assets/schools/hays.webp'

// ---------------------------------------------------------------------------
// Schools you can add to your account.
//
// Clearpath is one app per school: reviews of a class only mean something next
// to the other classes at the same school. Westlake is the one with a catalog
// loaded. The rest are listed so students at those schools can ask for theirs,
// and so nobody gets a blank search screen.
// ---------------------------------------------------------------------------

// Each school's own mark, saved from its website and shrunk to a few kilobytes
// so the single-file build can carry all of them. Full colour marks sit on a
// white tile. The four schools that publish a white-only mark
// get a tile in their school colour, the way their own sites show it.
export const SCHOOLS = [
  {
    id: 'westlake',
    name: 'Westlake High School',
    short: 'Westlake',
    district: 'Eanes ISD',
    city: 'Austin, TX',
    mascot: 'Chaparrals',
    initials: 'WHS',
    hue: '#203090',
    logo: westlakeLogo,
    catalog: true,
  },
  { id: 'lake-travis', name: 'Lake Travis High School', short: 'Lake Travis', district: 'Lake Travis ISD', city: 'Austin, TX', mascot: 'Cavaliers', initials: 'LT', hue: '#D22630', logo: lakeTravisLogo, logoOnColour: true, catalog: false },
  { id: 'austin-high', name: 'Austin High School', short: 'Austin High', district: 'Austin ISD', city: 'Austin, TX', mascot: 'Maroons', initials: 'AHS', hue: '#4D0006', logo: austinHighLogo, logoOnColour: true, catalog: false },
  { id: 'anderson', name: 'Anderson High School', short: 'Anderson', district: 'Austin ISD', city: 'Austin, TX', mascot: 'Trojans', initials: 'AND', hue: '#2B5597', logo: andersonLogo, logoOnColour: true, catalog: false },
  { id: 'bowie', name: 'Bowie High School', short: 'Bowie', district: 'Austin ISD', city: 'Austin, TX', mascot: 'Bulldogs', initials: 'BOW', hue: '#CF0A2C', logo: bowieLogo, catalog: false },
  { id: 'mccallum', name: 'McCallum High School', short: 'McCallum', district: 'Austin ISD', city: 'Austin, TX', mascot: 'Knights', initials: 'MAC', hue: '#2E4EA2', logo: mccallumLogo, logoOnColour: true, catalog: false },
  { id: 'westwood', name: 'Westwood High School', short: 'Westwood', district: 'Round Rock ISD', city: 'Austin, TX', mascot: 'Warriors', initials: 'WW', hue: '#B06020', logo: westwoodLogo, catalog: false },
  { id: 'round-rock', name: 'Round Rock High School', short: 'Round Rock', district: 'Round Rock ISD', city: 'Round Rock, TX', mascot: 'Dragons', initials: 'RR', hue: '#6B0F1A', logo: roundRockLogo, catalog: false },
  { id: 'cedar-park', name: 'Cedar Park High School', short: 'Cedar Park', district: 'Leander ISD', city: 'Cedar Park, TX', mascot: 'Timberwolves', initials: 'CP', hue: '#005030', logo: cedarParkLogo, catalog: false },
  { id: 'vandegrift', name: 'Vandegrift High School', short: 'Vandegrift', district: 'Leander ISD', city: 'Austin, TX', mascot: 'Vipers', initials: 'VHS', hue: '#1F2A44', logo: vandegriftLogo, catalog: false },
  { id: 'dripping-springs', name: 'Dripping Springs High School', short: 'Dripping Springs', district: 'Dripping Springs ISD', city: 'Dripping Springs, TX', mascot: 'Tigers', initials: 'DS', hue: '#5A1220', logo: drippingSpringsLogo, catalog: false },
  { id: 'hays', name: 'Hays High School', short: 'Hays', district: 'Hays CISD', city: 'Buda, TX', mascot: 'Hawks', initials: 'HHS', hue: '#C01020', logo: haysLogo, catalog: false },
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
