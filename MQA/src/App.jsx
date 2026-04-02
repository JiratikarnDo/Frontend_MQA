import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/login/loginPage'
import Mqa3Insert1Page from './pages/mqa3/mqa3Insert1/mqa3Insert1Page'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/mqa3Insert-1" element={<Mqa3Insert1Page />} />
    </Routes>
  )
}

export default App