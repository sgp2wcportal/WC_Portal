import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'

import { useAuthStore } from './store/authStore'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { MarqueeBanner } from './components/MarqueeBanner'
import { MobileNavDrawer } from './components/MobileNavDrawer'
import { PrivateRoute, RoleRoute } from './components/PrivateRoute'

import { LoginPage } from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import { ProfilePage } from './pages/ProfilePage'
import { DashboardPage } from './pages/DashboardPage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import { DonationsPage } from './pages/DonationsPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { CouponsPage } from './pages/CouponsPage'
import { EventsPage } from './pages/EventsPage'
import { TreasuryPage } from './pages/TreasuryPage'
import { ContactsPage } from './pages/ContactsPage'
import { CulturalEventsPage } from './pages/CulturalEventsPage'

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
  >
    {children}
  </motion.div>
)

const AnimatedRoutes = () => {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignUpPage /></PageTransition>} />
        <Route
          path="/profile"
          element={<PrivateRoute><PageTransition><ProfilePage /></PageTransition></PrivateRoute>}
        />
        <Route
          path="/dashboard"
          element={<PrivateRoute><PageTransition><DashboardPage /></PageTransition></PrivateRoute>}
        />
        <Route
          path="/announcements"
          element={<PrivateRoute><PageTransition><AnnouncementsPage /></PageTransition></PrivateRoute>}
        />
        <Route
          path="/subscriptions"
          element={<PrivateRoute><PageTransition><SubscriptionsPage /></PageTransition></PrivateRoute>}
        />
        <Route
          path="/donations"
          element={<PrivateRoute><PageTransition><DonationsPage /></PageTransition></PrivateRoute>}
        />
        <Route
          path="/expenses"
          element={<RoleRoute requiredRoles={['admin', 'generic']}><PageTransition><ExpensesPage /></PageTransition></RoleRoute>}
        />
        <Route
          path="/coupons"
          element={<PrivateRoute><PageTransition><CouponsPage /></PageTransition></PrivateRoute>}
        />
        <Route
          path="/events"
          element={<PrivateRoute><PageTransition><EventsPage /></PageTransition></PrivateRoute>}
        />
        <Route
          path="/treasury"
          element={<RoleRoute requiredRoles={['admin', 'generic']}><PageTransition><TreasuryPage /></PageTransition></RoleRoute>}
        />
        <Route
          path="/contacts"
          element={<PrivateRoute><PageTransition><ContactsPage /></PageTransition></PrivateRoute>}
        />
        <Route
          path="/cultural"
          element={<PrivateRoute><PageTransition><CulturalEventsPage /></PageTransition></PrivateRoute>}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const [navOpen, setNavOpen] = useState(false)

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {isAuthenticated && <Header onMenuOpen={() => setNavOpen(true)} />}
        {isAuthenticated && <MarqueeBanner />}
        <div className="flex flex-1">
          {isAuthenticated && <Sidebar />}
          {/* pb-16 reserves space for the bottom nav on mobile */}
          <main className="flex-1 min-w-0 pb-16 md:pb-0">
            <AnimatedRoutes />
          </main>
        </div>
        {isAuthenticated && <BottomNav onMenuOpen={() => setNavOpen(true)} />}
        {isAuthenticated && <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />}
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '14px',
            padding: '12px 16px',
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            background: 'white',
            color: '#1C1917',
            border: '1px solid #CFFAFE',
            boxShadow: '0 20px 60px -25px rgba(6,182,212,.22)',
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#ECFDF5' },
          },
          error: {
            iconTheme: { primary: '#E11D48', secondary: '#FFE4E6' },
          },
        }}
      />
    </Router>
  )
}

export default App
