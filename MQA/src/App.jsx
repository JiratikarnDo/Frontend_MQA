import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/login/loginPage'
import AppLayout from './components/layout/appLayout/appLayout'
{/* MQA3 Pages */}
import Mqa3Insert1Page from './pages/mqa3/mqa3Insert1/mqa3Insert1Page'
import Mqa3Insert2Page from './pages/mqa3/mqa3Insert2/mqa3Insert2Page'
import Mqa3Insert3Page from './pages/mqa3/mqa3Insert3/mqa3Insert3Page'
import Mqa3Insert4Page from './pages/mqa3/mqa3Insert4/mqa3Insert4Page'
import Mqa3Insert5Page from './pages/mqa3/mqa3Insert5/mqa3Insert5Page'
{/* MQA5 Pages */}
import Mqa5Insert1Page from './pages/mqa5/mqa5Insert1/mqa5Insert1Page'
import Mqa5Insert2Page from './pages/mqa5/mqa5Insert2/mqa5Insert2Page'
import Mqa5Insert3Page from './pages/mqa5/mqa5Insert3/mqa5Insert3Page'
import Mqa5Insert4Page from './pages/mqa5/mqa5Insert4/mqa5Insert4Page'
{/* เจ้าหน้าที่ */}
import SelectDegreePage from './pages/curriculum/selectDegree/selectDegreePage'
import AddSubjectPage from './pages/curriculum/addSubject/addSubjectPage'
import ManageMajorPage from './pages/curriculum/manageMajor/manageMajorPage'
import ManageDeadlinePage from './pages/deadline/manageDeadlinePage'
import ManageSubPloPage from './pages/plo/manageSubPlo/manageSubPloPage'
import ManagePloSubjectMappingPage from './pages/plo/managePloSubjectMapping/managePloSubjectMappingPage'
import ManageDocumentCheckPage from './pages/documentCheck/manageDocumentCheckPage'
{/* หัวหน้าสาขา */}
import CourseOpeningBachelorPage from './pages/courseOpeningBachelor/courseOpeningBachelorPage'
import CourseOpeningMasterPage from './pages/courseOpeningMaster/courseOpeningMasterPage'
import CourseOpeningDoctoralPage from './pages/courseOpeningDoctoral/courseOpeningDoctoralPage'
import CourseOpeningRequestListPage from './pages/courseOpeningRequestList/courseOpeningRequestListPage'
import CourseManagementPage from './pages/courseManagement/courseManagementPage'
{/* มคอ */}
import MyAssignedCoursesPage from './pages/myAssignedCourses/myAssignedCoursesPage'
import MqaOverviewPage from './pages/mqaOverview/mqaOverviewPage'
{/* คณะบดี */}
import DeanMajorSelectPage from './pages/dean/deanMajorSelect/deanMajorSelectPage'
import DeanCourseOpeningReviewListPage from './pages/dean/deanCourseOpeningReviewList/deanCourseOpeningReviewListPage'
function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/mqa3Insert-1" element={<Mqa3Insert1Page />} />
        <Route path="/mqa3Insert-2" element={<Mqa3Insert2Page />} />
        <Route path="/mqa3Insert-3" element={<Mqa3Insert3Page />} />
        <Route path="/mqa3Insert-4" element={<Mqa3Insert4Page />} />
        <Route path="/mqa3Insert-5" element={<Mqa3Insert5Page />} />
        {/* MQA5 Pages */}
        <Route path="/mqa5Insert-1" element={<Mqa5Insert1Page />} />
        <Route path="/mqa5Insert-2" element={<Mqa5Insert2Page />} />
        <Route path="/mqa5Insert-3" element={<Mqa5Insert3Page />} />
        <Route path="/mqa5Insert-4" element={<Mqa5Insert4Page />} />
        {/* เจ้าหน้าที่ */}
        <Route path="/selectDegree" element={<SelectDegreePage />} />
        <Route path="/addSubject" element={<AddSubjectPage />} />
        <Route path="/manageMajor" element={<ManageMajorPage />} />
        <Route path="/manageDeadline" element={<ManageDeadlinePage />} />
        <Route path="/manageSubPlo" element={<ManageSubPloPage />} />
        <Route path="/managePloSubjectMapping" element={<ManagePloSubjectMappingPage />} />
        <Route path="/manageDocumentCheck" element={<ManageDocumentCheckPage />} />
        {/* หัวหน้าสาขา */}
        <Route path="/courseOpeningBachelor" element={<CourseOpeningBachelorPage />} />
        <Route path="/courseOpeningMaster" element={<CourseOpeningMasterPage />} />
        <Route path="/courseOpeningDoctoral" element={<CourseOpeningDoctoralPage />} />
        <Route path="/courseOpeningRequestList" element={<CourseOpeningRequestListPage />} />
        <Route path="/courseManagement" element={<CourseManagementPage />} />
        {/* มคอ */}
        <Route path="/myAssignedCourses" element={<MyAssignedCoursesPage />} />
        <Route path="/mqaOverview" element={<MqaOverviewPage />} />
        {/* คณะบดี */}
        <Route path="/deanMajorSelect" element={<DeanMajorSelectPage />} />
        <Route path="/deanCourseOpeningReviewList" element={<DeanCourseOpeningReviewListPage />} />
      </Route>
    </Routes>
  )
}

export default App