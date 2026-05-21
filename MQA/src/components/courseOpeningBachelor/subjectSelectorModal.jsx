import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import styles from './subjectSelectorModal.module.css'

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')

  return {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  }
}

const normalizeText = (value) => String(value ?? '').trim()

const getResponseList = (data, keyList = []) => {
  if (Array.isArray(data)) return data

  for (const key of keyList) {
    if (Array.isArray(data?.[key])) return data[key]
    if (Array.isArray(data?.data?.[key])) return data.data[key]
    if (Array.isArray(data?.result?.[key])) return data.result[key]
    if (Array.isArray(data?.item?.[key])) return data.item[key]
  }

  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results

  return []
}

const getResponseObject = (data) => {
  if (Array.isArray(data)) return data[0] ?? null
  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) return data.data
  if (data?.item && typeof data.item === 'object') return data.item
  if (data?.result && typeof data.result === 'object' && !Array.isArray(data.result)) return data.result
  if (data?.user && typeof data.user === 'object') return data.user
  if (data?.course && typeof data.course === 'object') return data.course

  return data
}

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail
  const message = error?.response?.data?.message

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message || String(item)).join(', ')
  }

  if (detail && typeof detail === 'object') {
    return detail.message || JSON.stringify(detail)
  }

  return detail || message || fallbackMessage
}

const getDepartmentIdFromUser = (user) => {
  return user?.department?.id ?? user?.department_id ?? user?.departmentId ?? null
}

const getDepartmentNameFromUser = (user) => {
  return (
    user?.department?.department_name ??
    user?.department?.departmentName ??
    user?.department?.department_name_thai ??
    user?.department?.departmentNameThai ??
    user?.department?.name ??
    user?.department_name ??
    user?.departmentName ??
    user?.department_name_thai ??
    user?.departmentNameThai ??
    ''
  )
}

const getDepartmentId = (department) => {
  return department?.id ?? department?.department_id ?? department?.departmentId ?? ''
}

const getDepartmentName = (department) => {
  return (
    department?.department_name ??
    department?.departmentName ??
    department?.department_name_thai ??
    department?.departmentNameThai ??
    department?.major_name ??
    department?.majorName ??
    department?.name ??
    ''
  )
}

const normalizeDepartmentFromApi = (department) => {
  const departmentId = getDepartmentId(department)

  return {
    id: String(departmentId),
    departmentId: String(departmentId),
    departmentName: getDepartmentName(department),
    rawData: department,
  }
}

const getCourseId = (course) => {
  return course?.id ?? course?.course_id ?? course?.courseId ?? ''
}

const getCourseCode = (course) => {
  return course?.course_code ?? course?.courseCode ?? course?.subjectCode ?? ''
}

const getCourseNameThai = (course) => {
  return (
    course?.course_name_th ??
    course?.courseNameTh ??
    course?.course_name_thai ??
    course?.courseNameThai ??
    course?.course_name ??
    course?.courseName ??
    course?.subjectName ??
    ''
  )
}

const getDepartmentIdFromCourse = (course) => {
  return (
    course?.department_id ??
    course?.departmentId ??
    course?.department?.id ??
    course?.department?.department_id ??
    course?.department?.departmentId ??
    course?.major_id ??
    course?.majorId ??
    ''
  )
}

const getDepartmentNameFromCourse = (course) => {
  return (
    course?.department?.department_name ??
    course?.department?.departmentName ??
    course?.department?.department_name_thai ??
    course?.department?.departmentNameThai ??
    course?.department?.name ??
    course?.department_name ??
    course?.departmentName ??
    course?.department_name_thai ??
    course?.departmentNameThai ??
    course?.majorName ??
    course?.major_name ??
    course?.major?.name ??
    course?.major?.major_name ??
    ''
  )
}

const getCreditsText = (course) => {
  const existingCredits =
    course?.credits ??
    course?.credit ??
    course?.credits_snapshot ??
    course?.creditText ??
    ''

  if (existingCredits) {
    return String(existingCredits)
  }

  const total =
    course?.credit_total ??
    course?.creditTotal ??
    course?.total_credit ??
    course?.totalCredit ??
    ''

  const lecture =
    course?.credit_lecture ??
    course?.creditLecture ??
    course?.lecture_credit ??
    course?.lectureCredit ??
    0

  const lab =
    course?.credit_lab ??
    course?.creditLab ??
    course?.lab_credit ??
    course?.labCredit ??
    0

  const selfStudy =
    course?.credit_self_study ??
    course?.creditSelfStudy ??
    course?.self_study_credit ??
    course?.selfStudyCredit ??
    0

  if (total === '' || total === null || total === undefined) {
    return ''
  }

  return `${total}(${lecture}-${lab}-${selfStudy})`
}

const getCategoryName = (course) => {
  return String(
    course?.category?.category_name ??
      course?.category?.categoryName ??
      course?.category_name ??
      course?.categoryName ??
      course?.course_category_name ??
      course?.courseCategoryName ??
      ''
  )
}

const getSubjectLine = (course) => {
  return String(
    course?.subject_line ??
      course?.subjectLine ??
      course?.subject_line_name ??
      course?.subjectLineName ??
      course?.sub_group?.sub_group_name ??
      course?.subGroup?.subGroupName ??
      course?.sub_group_name ??
      course?.subGroupName ??
      ''
  )
}

const getIsFreeElective = (course) => {
  const categoryName = getCategoryName(course)
  return categoryName.includes('เลือกเสรี')
}

const getScienceTrackValue = (course) => {
  const subjectLine = getSubjectLine(course)
  return subjectLine.includes('วิทยาศาสตร์') || subjectLine.includes('วิทย์')
}

const getHumanitiesTrackValue = (course) => {
  const subjectLine = getSubjectLine(course)

  return (
    subjectLine.includes('มนุษยศาสตร์') ||
    subjectLine.includes('สังคมศาสตร์') ||
    subjectLine.includes('มนุษย์') ||
    subjectLine.includes('สังคม')
  )
}

const normalizeSubjectFromApi = (course, departmentNameMap = new Map()) => {
  const courseId = getCourseId(course)
  const departmentId = normalizeText(getDepartmentIdFromCourse(course))
  const departmentNameFromMap = departmentId ? departmentNameMap.get(departmentId) : ''

  return {
    id: String(courseId),
    courseId: String(courseId),
    departmentId,
    majorName: getDepartmentNameFromCourse(course) || departmentNameFromMap || '',
    courseCode: getCourseCode(course),
    courseName: getCourseNameThai(course),
    credits: getCreditsText(course),
    isFreeElective: getIsFreeElective(course),
    scienceTrack: getScienceTrackValue(course),
    humanitiesTrack: getHumanitiesTrackValue(course),
    rawData: course,
  }
}

const fetchDepartmentsFromApi = async (apiUrl, config) => {
  const response = await axios.get(`${apiUrl}/departments/`, config)

  const departmentList = getResponseList(response.data, [
    'departments',
    'items',
    'data',
    'results',
  ])

  return departmentList
    .map((department) => normalizeDepartmentFromApi(department))
    .filter((department) => department.id)
}

const fetchAllCoursesFromApi = async (apiUrl, config) => {
  const pageSize = 100
  let currentPage = 1
  let allCourses = []
  let shouldContinue = true

  while (shouldContinue) {
    const response = await axios.get(`${apiUrl}/course/`, {
      ...config,
      params: {
        page: currentPage,
        size: pageSize,
        limit: pageSize,
      },
    })

    const courseList = getResponseList(response.data, [
      'courses',
      'items',
      'data',
      'results',
    ])

    allCourses = [...allCourses, ...courseList]

    shouldContinue = courseList.length === pageSize
    currentPage += 1
  }

  return allCourses
}

const fetchCourseDetailsFromApi = async (apiUrl, config, courseList) => {
  const detailList = await Promise.all(
    courseList.map(async (course) => {
      const courseId = getCourseId(course)

      if (!courseId) {
        return course
      }

      try {
        const response = await axios.get(`${apiUrl}/course/${courseId}`, config)
        const detailData = getResponseObject(response.data)

        return {
          ...course,
          ...(detailData || {}),
        }
      } catch (error) {
        return course
      }
    })
  )

  return detailList
}

function SubjectSelectorModal({
  open,
  onClose,
  onSelectSubject,
  currentMajorName,
  currentDepartmentId,
}) {
  const apiUrl = import.meta.env.VITE_API_URL

  const [activeTab, setActiveTab] = useState('inMajor')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedExternalDepartmentKey, setSelectedExternalDepartmentKey] = useState('')
  const [currentUserDepartmentId, setCurrentUserDepartmentId] = useState('')
  const [currentUserDepartmentName, setCurrentUserDepartmentName] = useState('')
  const [departmentList, setDepartmentList] = useState([])
  const [subjectList, setSubjectList] = useState([])
  const [isSubjectLoading, setIsSubjectLoading] = useState(false)
  const [subjectErrorMessage, setSubjectErrorMessage] = useState('')

  useEffect(() => {
    if (open) {
      setActiveTab('inMajor')
      setSearchKeyword('')
      setSelectedExternalDepartmentKey('')
      setSubjectErrorMessage('')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const fetchSubjects = async () => {
      setIsSubjectLoading(true)
      setSubjectErrorMessage('')

      try {
        const config = getAuthConfig()

        let userDepartmentId = currentDepartmentId || ''
        let userDepartmentName = currentMajorName || ''

        try {
          const userResponse = await axios.get(`${apiUrl}/auth/me`, config)
          const currentUser = getResponseObject(userResponse.data)

          userDepartmentId =
            userDepartmentId || getDepartmentIdFromUser(currentUser) || ''
          userDepartmentName =
            userDepartmentName || getDepartmentNameFromUser(currentUser) || ''
        } catch (error) {
          console.error('Error fetching current user:', error)
        }

        const userDepartmentIdText = userDepartmentId ? String(userDepartmentId) : ''

        setCurrentUserDepartmentId(userDepartmentIdText)
        setCurrentUserDepartmentName(userDepartmentName || '')

        let nextDepartmentList = []

        try {
          nextDepartmentList = await fetchDepartmentsFromApi(apiUrl, config)
          setDepartmentList(nextDepartmentList)
        } catch (error) {
          console.error('Error fetching departments:', error)
          setDepartmentList([])
        }

        const departmentNameMap = new Map(
          nextDepartmentList.map((department) => [
            String(department.departmentId),
            department.departmentName,
          ])
        )

        const courseResponseList = await fetchAllCoursesFromApi(apiUrl, config)
        const courseDetailList = await fetchCourseDetailsFromApi(
          apiUrl,
          config,
          courseResponseList
        )

        const normalizedSubjectList = courseDetailList
          .map((course) => normalizeSubjectFromApi(course, departmentNameMap))
          .filter((subject) => subject.id)

        setSubjectList(normalizedSubjectList)

        const hasDepartmentIdInSubjectList = normalizedSubjectList.some(
          (subject) => subject.departmentId
        )

        if (!hasDepartmentIdInSubjectList) {
          setSubjectErrorMessage(
            'โหลดรายวิชาได้แล้ว แต่ข้อมูลรายวิชายังไม่มี department_id จึงยังแยกวิชาในสาขา/นอกสาขาไม่ได้'
          )
        }
      } catch (error) {
        console.error('Error fetching course subjects:', error)
        setSubjectErrorMessage(
          getErrorMessage(error, 'ไม่สามารถโหลดรายวิชาจากระบบได้')
        )
      } finally {
        setIsSubjectLoading(false)
      }
    }

    fetchSubjects()
  }, [apiUrl, currentDepartmentId, currentMajorName, open])

  const inMajorSubjects = useMemo(() => {
    if (!currentUserDepartmentId) {
      return subjectList
    }

    const currentDepartmentIdText = String(currentUserDepartmentId)

    const hasDepartmentIdInSubjectList = subjectList.some(
      (subject) => subject.departmentId
    )

    if (!hasDepartmentIdInSubjectList) {
      return subjectList
    }

    return subjectList.filter(
      (subject) => String(subject.departmentId) === currentDepartmentIdText
    )
  }, [currentUserDepartmentId, subjectList])

  const externalMajorSubjects = useMemo(() => {
    if (!currentUserDepartmentId) {
      return []
    }

    const currentDepartmentIdText = String(currentUserDepartmentId)

    return subjectList.filter(
      (subject) =>
        subject.departmentId &&
        String(subject.departmentId) !== currentDepartmentIdText
    )
  }, [currentUserDepartmentId, subjectList])

  const externalMajorOptions = useMemo(() => {
    const uniqueMajorMap = new Map()
    const currentDepartmentIdText = String(currentUserDepartmentId || '')

    departmentList.forEach((department) => {
      const departmentIdText = String(department.departmentId || '')

      if (!departmentIdText || departmentIdText === currentDepartmentIdText) {
        return
      }

      uniqueMajorMap.set(departmentIdText, {
        key: departmentIdText,
        label: department.departmentName || `สาขา ID ${departmentIdText}`,
      })
    })

    externalMajorSubjects.forEach((subject) => {
      const departmentKey = subject.departmentId || subject.majorName

      if (!departmentKey) {
        return
      }

      if (!uniqueMajorMap.has(String(departmentKey))) {
        uniqueMajorMap.set(String(departmentKey), {
          key: String(departmentKey),
          label: subject.majorName || `สาขา ID ${subject.departmentId}`,
        })
      }
    })

    return Array.from(uniqueMajorMap.values())
  }, [currentUserDepartmentId, departmentList, externalMajorSubjects])

  const filteredSubjects = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase()

    if (activeTab === 'inMajor') {
      return inMajorSubjects.filter((subject) => {
        const searchableText =
          `${subject.courseCode} ${subject.courseName} ${subject.majorName}`.toLowerCase()

        return searchableText.includes(normalizedKeyword)
      })
    }

    return externalMajorSubjects.filter((subject) => {
      const searchableText =
        `${subject.courseCode} ${subject.courseName} ${subject.majorName}`.toLowerCase()

      const subjectDepartmentKey = subject.departmentId || subject.majorName

      const matchedMajor = selectedExternalDepartmentKey
        ? String(subjectDepartmentKey) === String(selectedExternalDepartmentKey)
        : true

      return matchedMajor && searchableText.includes(normalizedKeyword)
    })
  }, [
    activeTab,
    externalMajorSubjects,
    inMajorSubjects,
    searchKeyword,
    selectedExternalDepartmentKey,
  ])

  const handleChangeTab = (_, nextTab) => {
    setActiveTab(nextTab)
    setSearchKeyword('')
    setSelectedExternalDepartmentKey('')
  }

  const handleSelectSubject = (subject) => {
    onSelectSubject({
      id: subject.id,
      courseId: subject.courseId || subject.id,
      courseCode: subject.courseCode,
      courseName: subject.courseName,
      credits: subject.credits,
      isFreeElective: subject.isFreeElective,
      scienceTrack: subject.scienceTrack,
      humanitiesTrack: subject.humanitiesTrack,
      majorName: subject.majorName,
      departmentId: subject.departmentId,
      rawData: subject.rawData,
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        className: styles.dialogPaper,
      }}
    >
      <DialogTitle className={styles.dialogTitle}>
        <Typography className={styles.titleText}>เลือกรายวิชา</Typography>

        <IconButton onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={styles.dialogContent}>
        <Tabs
          value={activeTab}
          onChange={handleChangeTab}
          className={styles.tabs}
        >
          <Tab value="inMajor" label="รายวิชาในสาขา" />
          <Tab value="externalMajor" label="รายวิชานอกสาขา" />
        </Tabs>

        <Box className={styles.filterSection}>
          {activeTab === 'inMajor' && (
            <Box className={styles.infoRow}>
              <Typography className={styles.infoLabel}>
                สาขาปัจจุบัน:
              </Typography>
              <Typography className={styles.infoValue}>
                {currentUserDepartmentName || currentMajorName || '-'}
              </Typography>
            </Box>
          )}

          {activeTab === 'externalMajor' && (
            <TextField
              select
              label="เลือกสาขา"
              value={selectedExternalDepartmentKey}
              onChange={(event) =>
                setSelectedExternalDepartmentKey(event.target.value)
              }
              fullWidth
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              {externalMajorOptions.map((major) => (
                <MenuItem key={major.key} value={major.key}>
                  {major.label}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            placeholder="พิมพ์ชื่อวิชา/รหัสวิชา เพื่อค้นหา"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box className={styles.subjectList}>
          {isSubjectLoading ? (
            <Box className={styles.emptyState}>
              <CircularProgress size={32} />
              <Typography className={styles.emptyStateText}>
                กำลังโหลดรายวิชา...
              </Typography>
            </Box>
          ) : subjectErrorMessage ? (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>
                โหลดรายวิชาไม่สำเร็จ
              </Typography>

              <Typography className={styles.emptyStateText}>
                {subjectErrorMessage}
              </Typography>
            </Box>
          ) : filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
              <Box
                key={subject.id}
                component="button"
                type="button"
                className={styles.subjectCard}
                onClick={() => handleSelectSubject(subject)}
              >
                <Box className={styles.subjectCardTop}>
                  <Typography className={styles.subjectCode}>
                    {subject.courseCode || '-'}
                  </Typography>

                  {activeTab === 'externalMajor' && (
                    <Typography className={styles.subjectMajor}>
                      {subject.majorName || `สาขา ID ${subject.departmentId || '-'}`}
                    </Typography>
                  )}
                </Box>

                <Typography className={styles.subjectName}>
                  {subject.courseName || '-'}
                </Typography>

                <Typography className={styles.subjectMeta}>
                  หน่วยกิต {subject.credits || '-'}
                </Typography>
              </Box>
            ))
          ) : (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>
                ไม่พบรายวิชาที่ค้นหา
              </Typography>

              <Typography className={styles.emptyStateText}>
                {activeTab === 'externalMajor'
                  ? 'ไม่พบรายวิชานอกสาขา หรือ API /course/ ยังส่งกลับมาเฉพาะรายวิชาในสาขาของผู้ใช้งาน'
                  : 'ลองเปลี่ยนคำค้นหา หรือเลือกสาขาใหม่อีกครั้ง'}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default SubjectSelectorModal