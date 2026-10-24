import { useCallback, useEffect, useMemo, useState } from 'react'
import * as store from './lib/store'
import { COURSE_MAP } from './data/courses'
import { AppShell } from './components/AppShell'
import { Onboarding } from './components/Onboarding'
import { SchoolHome } from './components/SchoolHome'
import { CourseView } from './components/CourseView'
import { ReviewForm } from './components/ReviewForm'
import { CompareView } from './components/CompareView'
import { ProfileView, SchoolsView } from './components/ProfileView'
import { PlanView } from './components/PlanView'
import { AuthLoading, CarryOverPrompt, SignIn } from './components/SignIn'
import { SampleBanner } from './components/Bits'

export default function App() {
  const [view, setView] = useState('browse')
  const [courseId, setCourseId] = useState(null)
  const [writeCourseId, setWriteCourseId] = useState(null)
  const [version, setVersion] = useState(0)

  // Every write goes through the store, and every write re-renders the app.
  useEffect(() => store.subscribe(() => setVersion((v) => v + 1)), [])

  // Start listening for the signed-in Google account, if accounts are set up.
  useEffect(() => store.initAuth(), [])

  const authState = store.getAuthState()
  const authUser = store.getAuthUser()
  const profile = store.getProfile()
  const mySchools = store.getMySchools()
  const carryOver = store.localCarryOver()
  const school = store.getActiveSchool()
  const samplesOn = store.samplesEnabled()

  const go = useCallback((next, id = null) => {
    setView(next)
    if (next === 'course') setCourseId(id)
    if (next === 'write') setWriteCourseId(id)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const courses = useMemo(() => store.getCourses(school?.id), [school?.id, version])
  const statsByCourse = useMemo(() => store.getStatsByCourse(school?.id), [school?.id, version])
  const compare = store.getCompare()
  const plan = useMemo(() => store.getPlan(school?.id), [school?.id, version])

  // Every hook has to run on every render, including the first-run screens
  // below, so the course detail data is prepared here rather than after them.
  const course = courseId ? store.getCourse(courseId) : null
  const reviews = useMemo(
    () => (courseId && school ? store.getReviews(courseId, school.id) : []),
    [courseId, school?.id, version]
  )

  // --------------------------- signed in, or not yet ---------------------------
  if (store.cloudEnabled()) {
    if (authState === 'loading') return <AuthLoading />
    if (authState === 'signed-out') return <SignIn onSignIn={() => store.signIn()} />
  }

  // ------------------------------- first run -------------------------------
  if (!profile || !school) {
    return (
      <Onboarding
        schools={store.getAllSchools()}
        profile={profile}
        suggested={authUser}
        myschools={mySchools}
        onCreateProfile={(p) => store.saveProfile(p)}
        onAddSchool={(id) => store.addSchool(id)}
        onOpenSchool={(id) => {
          store.setActiveSchool(id)
          go('browse')
        }}
      />
    )
  }

  return (
    <AppShell
      view={view}
      profile={profile}
      school={school}
      mySchools={mySchools}
      compareCount={compare.length}
      onNavigate={(next) => go(next)}
      onSwitchSchool={(id) => {
        store.setActiveSchool(id)
        go('browse')
      }}
    >
      {carryOver && (
        <CarryOverPrompt
          carry={carryOver}
          onImport={() => store.importLocalData()}
          onDismiss={() => store.dismissCarryOver()}
        />
      )}

      {samplesOn && <SampleBanner onOff={() => store.setSamplesEnabled(false)} />}

      {view === 'browse' && (
        <SchoolHome
          school={school}
          courses={courses}
          statsByCourse={statsByCourse}
          compare={compare}
          onToggleCompare={(id) => store.toggleCompare(id)}
          onOpenCourse={(id) => go('course', id)}
          onWriteReview={(id) => go('write', id)}
          onAddSchool={(id) => {
            store.addSchool(id)
            store.setActiveSchool(id)
            go('browse')
          }}
        />
      )}

      {view === 'course' && course && (
        <CourseView
          course={course}
          stats={statsByCourse[course.id] || store.getStats(course.id, school.id)}
          reviews={reviews}
          compared={compare.includes(course.id)}
          onToggleCompare={() => store.toggleCompare(course.id)}
          onBack={() => go('browse')}
          onWrite={(id) => go('write', id || course.id)}
          onOpenCourse={(id) => go('course', id)}
        />
      )}

      {view === 'write' && (
        <ReviewForm
          courses={courses}
          statsByCourse={statsByCourse}
          initialCourseId={writeCourseId}
          profile={profile}
          onSubmit={(input) => {
            const { count } = store.addReview({ ...input, schoolId: school.id })
            return { count }
          }}
          onCancel={() => go(writeCourseId ? 'course' : 'browse', writeCourseId)}
          onOpenCourse={(id) => go('course', id)}
        />
      )}

      {view === 'plan' && (
        <PlanView
          courses={courses}
          courseMap={COURSE_MAP}
          statsByCourse={statsByCourse}
          plan={plan}
          onAdd={(grade, id) => store.addToPlan(grade, id, school.id)}
          onRemove={(grade, id) => store.removeFromPlan(grade, id, school.id)}
          onMove={(id, to) => store.movePlanCourse(id, to, school.id)}
          onClear={() => store.clearPlan(school.id)}
          onOpenCourse={(id) => go('course', id)}
        />
      )}

      {view === 'compare' && (
        <CompareView
          courses={courses}
          statsByCourse={statsByCourse}
          compare={compare}
          onSetCompare={(next) => store.setCompare(next)}
          onOpenCourse={(id) => go('course', id)}
          onBrowse={() => go('browse')}
        />
      )}

      {view === 'you' && (
        <ProfileView
          profile={profile}
          mySchools={mySchools}
          activeSchool={school}
          myReviews={store.getMyReviews()}
          courseName={(id) => store.getCourse(id)?.name || 'Unknown class'}
          samplesOn={samplesOn}
          onSaveProfile={(p) => store.saveProfile(p)}
          onSwitchSchool={(id) => {
            store.setActiveSchool(id)
            go('browse')
          }}
          onRemoveSchool={(id) => store.removeSchool(id)}
          onAddSchools={() => go('schools')}
          onDeleteReview={(id) => store.deleteReview(id)}
          onToggleSamples={(on) => store.setSamplesEnabled(on)}
          onReset={() => store.resetEverything()}
          authUser={authUser}
          onSignOut={() => store.signOut()}
          onOpenCourse={(id) => go('course', id)}
        />
      )}

      {view === 'schools' && (
        <SchoolsView
          schools={store.getAllSchools()}
          mySchools={mySchools}
          activeSchool={school}
          onAdd={(id) => store.addSchool(id)}
          onOpen={(id) => {
            store.setActiveSchool(id)
            go('browse')
          }}
          onBack={() => go('you')}
        />
      )}
    </AppShell>
  )
}
