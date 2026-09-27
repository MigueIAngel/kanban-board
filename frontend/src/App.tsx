import { Route, Routes } from 'react-router'
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { AuthPage } from './pages/AuthPage'
import { BoardPage } from './pages/BoardPage'
import { BoardsPage } from './pages/BoardsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<BoardsPage />} />
          <Route path="/boards/:boardId" element={<BoardPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
