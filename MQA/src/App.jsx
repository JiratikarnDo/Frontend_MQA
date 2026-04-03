import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/login/loginPage'
import Mqa3Insert1Page from './pages/mqa3/mqa3Insert1/mqa3Insert1Page'
import Mqa3Insert2Page from './pages/mqa3/mqa3Insert2/mqa3Insert2Page'
import Mqa3Insert3Page from './pages/mqa3/mqa3Insert3/mqa3Insert3Page'
import Mqa3Insert4Page from './pages/mqa3/mqa3Insert4/mqa3Insert4Page'
import Mqa3Insert5Page from './pages/mqa3/mqa3Insert5/mqa3Insert5Page'
/*MQA5 Pages*/
import Mqa5Insert1Page from './pages/mqa5/mqa5Insert1/mqa5Insert1Page'
import Mqa5Insert2Page from './pages/mqa5/mqa5Insert2/mqa5Insert2Page'
import Mqa5Insert3Page from './pages/mqa5/mqa5Insert3/mqa5Insert3Page'
import Mqa5Insert4Page from './pages/mqa5/mqa5Insert4/mqa5Insert4Page'




function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/mqa3Insert-1" element={<Mqa3Insert1Page />} />
      <Route path="/mqa3Insert-2" element={<Mqa3Insert2Page />} />
      <Route path="/mqa3Insert-3" element={<Mqa3Insert3Page />} />
      <Route path="/mqa3Insert-4" element={<Mqa3Insert4Page />} />
      <Route path="/mqa3Insert-5" element={<Mqa3Insert5Page />} />
      /*MQA5 Pages*/
      <Route path="/mqa5Insert-1" element={<Mqa5Insert1Page />} />
      <Route path="/mqa5Insert-2" element={<Mqa5Insert2Page />} />
      <Route path="/mqa5Insert-3" element={<Mqa5Insert3Page />} />
      <Route path="/mqa5Insert-4" element={<Mqa5Insert4Page />} />
    </Routes>
  )
}

export default App