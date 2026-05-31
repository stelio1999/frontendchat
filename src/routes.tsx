import { lazy, Suspense } from 'react'
import { RouteObject } from 'react-router-dom'
import LoadingSpinner from './components/common/LoadingSpinner'

// Lazy loading das páginas
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Home = lazy(() => import('./pages/Home'))
const Chats = lazy(() => import('./pages/Chats'))
const Contacts = lazy(() => import('./pages/Contacts'))

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Register />
      </Suspense>
    ),
  },

  
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Home />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/chats" />,
      },
      {
        path: 'chats',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Chats />
          </Suspense>
        ),
      },
      {
        path: 'contacts',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Contacts />
          </Suspense>
        ),
      },
    ],
  },
]

