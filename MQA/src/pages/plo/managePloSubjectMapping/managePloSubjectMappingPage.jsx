import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DeviceHubRoundedIcon from '@mui/icons-material/DeviceHubRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import styles from './managePloSubjectMappingPage.module.css'

const ploMasterList = [
  {
    id: 1,
    code: 'PLO1',
    title:
      'เสริมสร้างความเป็นมนุษย์ให้พร้อมสำหรับโลกในปัจจุบันและอนาคต เพื่อให้เป็นบุคคลผู้ใฝ่รู้และมีทักษะที่จำเป็นสำหรับศตวรรษที่ 21',
  },
  {
    id: 2,
    code: 'PLO2',
    title:
      'เป็นผู้ตระหนักรู้ถึงการบูรณาการศาสตร์ต่าง ๆ ในการพัฒนาหรือแก้ไขปัญหา เป็นผู้ที่สามารถสร้างโอกาสและคุณค่าให้ตนเองและสังคม รู้เท่าทันการเปลี่ยนแปลงของสังคมและของโลก',
  },
  {
    id: 3,
    code: 'PLO3',
    title:
      'เป็นบุคคลที่ดำรงตนเป็นพลเมืองที่เข้มแข็ง มีจริยธรรมและยึดมั่นในสิ่งที่ถูกต้อง รู้คุณค่าและรักษาชาติกำเนิด ร่วมมือรวมพลังเพื่อสร้างสรรค์และพัฒนาสังคมอย่างยั่งยืน',
  },
  {
    id: 4,
    code: 'PLO4',
    title:
      'เป็นบุคคลที่สามารถสื่อสารได้อย่างมีประสิทธิภาพทั้งในการพูด การฟัง การอ่าน การเขียน และเลือกใช้รูปแบบการนำเสนอที่เหมาะสมสำหรับกลุ่มบุคคลที่แตกต่างกันได้',
  },
  {
    id: 5,
    code: 'PLO5',
    title:
      'อธิบายหลักการออกแบบเบื้องต้นและมีความรู้และแนวคิดด้านศิลปะ เทคโนโลยีดิจิทัล รวมถึงความเป็นผู้ประกอบการ',
  },
  {
    id: 6,
    code: 'PLO6',
    title:
      'ผู้เรียนสามารถประยุกต์ใช้ซอฟต์แวร์และเครื่องมือต่าง ๆ เพื่อใช้ในการสร้างสรรค์สื่อดิจิทัล เพื่อสื่อสารต่อกลุ่มเป้าหมายได้อย่างเหมาะสมและมีความรับผิดชอบต่อสื่อดิจิทัลที่สร้างขึ้น',
  },
  {
    id: 7,
    code: 'PLO7',
    title:
      'ผู้เรียนสามารถออกแบบและสร้างสรรค์สื่อดิจิทัลได้ โดยไม่ขัดต่อกฎ กติกา ของวิชาชีพ',
  },
  {
    id: 8,
    code: 'PLO8',
    title:
      'ผู้เรียนสามารถนำเสนอผลงานการออกแบบและสร้างสรรค์สื่อดิจิทัลได้ตรงตามความต้องการของกลุ่มเป้าหมายหรือผู้ประกอบการ อย่างซื่อสัตย์ต่อวิชาชีพ',
  },
]

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

const getResponseList = (data, keyList = []) => {
  if (Array.isArray(data)) return data

  for (const key of keyList) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  return []
}

const getResponseObject = (data) => {
  if (Array.isArray(data)) {
    return data[0] ?? null
  }

  if (data?.data && typeof data.data === 'object') {
    return data.data
  }

  if (data?.item && typeof data.item === 'object') {
    return data.item
  }

  if (data?.result && typeof data.result === 'object') {
    return data.result
  }

  if (data?.course && typeof data.course === 'object') {
    return data.course
  }

  return data
}

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail
  const message = error?.response?.data?.message

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(', ')
  }

  return detail || message || fallbackMessage
}

const getCourseId = (course) => {
  return course.id ?? course.course_id ?? course.courseId ?? ''
}

const getDepartmentId = (course) => {
  return (
    course.department_id ??
    course.departmentId ??
    course.department?.id ??
    course.department?.department_id ??
    course.department?.departmentId ??
    ''
  )
}

const getCourseCode = (course) => {
  return course.course_code ?? course.courseCode ?? course.subjectCode ?? ''
}

const getCourseNameThai = (course) => {
  return (
    course.course_name_th ??
    course.courseNameTh ??
    course.course_name_thai ??
    course.courseNameThai ??
    course.subjectName ??
    ''
  )
}

const getSelectedDepartmentId = (major) => {
  return (
    major?.department_id ??
    major?.departmentId ??
    major?.id ??
    major?.rawData?.id ??
    major?.rawData?.department_id ??
    major?.rawData?.departmentId ??
    null
  )
}

const getMajorName = (major) => {
  return (
    major?.majorNameTh ??
    major?.department_name ??
    major?.departmentName ??
    major?.name_th ??
    major?.nameTh ??
    major?.rawData?.department_name ??
    major?.rawData?.departmentName ??
    major?.rawData?.name ??
    'ยังไม่ได้เลือกสาขา'
  )
}

const getMajorCode = (major, selectedDepartmentId) => {
  return (
    major?.majorCode ??
    major?.department_code ??
    major?.departmentCode ??
    major?.rawData?.external_id ??
    major?.rawData?.department_code ??
    major?.rawData?.departmentCode ??
    selectedDepartmentId ??
    '-'
  )
}

const getCurriculumName = (major) => {
  return (
    major?.curriculumNameTh ??
    major?.curriculum_name_th ??
    major?.curriculumName ??
    major?.rawData?.curriculumNameTh ??
    major?.rawData?.curriculum_name_th ??
    major?.rawData?.curriculumName ??
    'ยังไม่ได้ระบุหลักสูตร'
  )
}

const normalizeCourseFromApi = (course) => {
  return {
    id: String(getCourseId(course)),
    subjectCode: getCourseCode(course),
    subjectName: getCourseNameThai(course),
    departmentId: getDepartmentId(course),
    rawData: course,
  }
}

const normalizeCourseIdOnly = (courseId) => {
  return {
    id: String(courseId),
    subjectCode: '',
    subjectName: '',
    departmentId: '',
    rawData: null,
  }
}

const normalizeSubPloFromApi = (subPlo) => {
  const courseList = getResponseList(subPlo, [
    'courses',
    'course_list',
    'courseList',
  ])

  const courseIdList = getResponseList(subPlo, [
    'course_ids',
    'courseIds',
    'course_id_list',
  ])

  const normalizedCourses =
    courseList.length > 0
      ? courseList.map((course) => normalizeCourseFromApi(course))
      : courseIdList.map((courseId) => normalizeCourseIdOnly(courseId))

  return {
    id: subPlo.id,
    code: subPlo.sub_plo_code ?? subPlo.subPloCode ?? '',
    description:
      subPlo.sub_plo_name_thai ??
      subPlo.subPloNameThai ??
      subPlo.description ??
      '',
    ploId: subPlo.plo_id ?? subPlo.ploId ?? '',
    courses: normalizedCourses,
    rawData: subPlo,
  }
}

const sortSubPloItems = (subPloItems) => {
  return [...subPloItems].sort((firstItem, secondItem) => {
    const [firstMain, firstSub] = String(firstItem.code).split('.').map(Number)
    const [secondMain, secondSub] = String(secondItem.code)
      .split('.')
      .map(Number)

    if (
      Number.isNaN(firstMain) ||
      Number.isNaN(firstSub) ||
      Number.isNaN(secondMain) ||
      Number.isNaN(secondSub)
    ) {
      return String(firstItem.code).localeCompare(String(secondItem.code))
    }

    if (firstMain !== secondMain) {
      return firstMain - secondMain
    }

    return firstSub - secondSub
  })
}

const buildPloSectionList = (subPloList) => {
  return ploMasterList.map((ploItem) => {
    const subPloItems = subPloList
      .filter((subPloItem) => Number(subPloItem.ploId) === Number(ploItem.id))
      .map((subPloItem) => ({
        id: subPloItem.id,
        code: subPloItem.code,
        description: subPloItem.description,
        courses: subPloItem.courses,
        rawData: subPloItem.rawData,
      }))

    return {
      ...ploItem,
      subPloItems: sortSubPloItems(subPloItems),
    }
  })
}

const buildLinkedSubjectMap = (subPloList) => {
  return subPloList.reduce((currentMap, subPloItem) => {
    currentMap[subPloItem.id] = subPloItem.courses
      .map((course) => course.id)
      .filter(
        (courseId) =>
          courseId !== '' && courseId !== null && courseId !== undefined
      )
      .map((courseId) => String(courseId))

    return currentMap
  }, {})
}

const filterSubPloListByAllowedCourseIds = (subPloList, allowedCourseIdSet) => {
  return subPloList.map((subPloItem) => ({
    ...subPloItem,
    courses: subPloItem.courses.filter((courseItem) =>
      allowedCourseIdSet.has(String(courseItem.id))
    ),
  }))
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

        return detailData || course
      } catch (error) {
        return course
      }
    })
  )

  return detailList
}

const fetchSubPloDetailsFromApi = async (apiUrl, config, subPloList) => {
  const detailList = await Promise.all(
    subPloList.map(async (subPlo) => {
      const subPloId = subPlo.id ?? subPlo.sub_plo_id ?? subPlo.subPloId

      if (!subPloId) {
        return subPlo
      }

      try {
        const response = await axios.get(
          `${apiUrl}/plo/sub-plos/${subPloId}`,
          config
        )

        const detailData = getResponseObject(response.data)

        return detailData || subPlo
      } catch (error) {
        console.error(`Error fetching Sub-PLO detail ID ${subPloId}:`, error)
        return subPlo
      }
    })
  )

  return detailList
}

const getSubPloIdsByPloId = (ploSectionList, ploId) => {
  const targetPlo = ploSectionList.find((ploItem) => ploItem.id === ploId)
  return targetPlo ? targetPlo.subPloItems.map((subPloItem) => subPloItem.id) : []
}

const getNumberCourseIds = (subjectIds) => {
  return subjectIds
    .map((subjectId) => Number(subjectId))
    .filter((subjectId) => !Number.isNaN(subjectId))
}

function ManagePloSubjectMappingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL
  const currentMajor = location.state?.major ?? null
  const selectedDepartmentId = getSelectedDepartmentId(currentMajor)

  const [selectedPloId, setSelectedPloId] = useState(1)
  const [expandedSubPloIds, setExpandedSubPloIds] = useState([])
  const [linkedSubjectMap, setLinkedSubjectMap] = useState({})
  const [allLinkedSubjectMap, setAllLinkedSubjectMap] = useState({})
  const [subjectMasterList, setSubjectMasterList] = useState([])
  const [subPloList, setSubPloList] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeSubPlo, setActiveSubPlo] = useState(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [subjectSearchKeyword, setSubjectSearchKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingMapping, setIsSavingMapping] = useState(false)
  const [removingSubjectKey, setRemovingSubjectKey] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const ploSectionList = useMemo(() => {
    return buildPloSectionList(subPloList)
  }, [subPloList])

  const selectedPlo = useMemo(() => {
    return (
      ploSectionList.find((ploItem) => ploItem.id === selectedPloId) ??
      ploSectionList[0]
    )
  }, [ploSectionList, selectedPloId])

  const totalLinkedCount = useMemo(() => {
    return Object.values(linkedSubjectMap).reduce(
      (total, currentSubjectIds) => total + currentSubjectIds.length,
      0
    )
  }, [linkedSubjectMap])

  const subjectLookupMap = useMemo(() => {
    const lookupMap = new Map()

    subjectMasterList.forEach((subjectItem) => {
      if (
        subjectItem.id !== '' &&
        subjectItem.id !== null &&
        subjectItem.id !== undefined
      ) {
        lookupMap.set(String(subjectItem.id), subjectItem)
      }
    })

    subPloList.forEach((subPloItem) => {
      subPloItem.courses.forEach((courseItem) => {
        if (
          courseItem.id !== '' &&
          courseItem.id !== null &&
          courseItem.id !== undefined
        ) {
          const courseIdText = String(courseItem.id)

          if (!lookupMap.has(courseIdText)) {
            lookupMap.set(courseIdText, courseItem)
          }
        }
      })
    })

    return lookupMap
  }, [subjectMasterList, subPloList])

  const filteredAvailableSubjectList = useMemo(() => {
    if (!activeSubPlo) return []

    const linkedSubjectIds = (linkedSubjectMap[activeSubPlo.id] ?? []).map(
      (subjectId) => String(subjectId)
    )

    const normalizedKeyword = subjectSearchKeyword.trim().toLowerCase()

    const subjectListWithLinkedStatus = subjectMasterList.map((subjectItem) => ({
      ...subjectItem,
      isAlreadyLinked: linkedSubjectIds.includes(String(subjectItem.id)),
    }))

    if (!normalizedKeyword) {
      return subjectListWithLinkedStatus
    }

    return subjectListWithLinkedStatus.filter((subjectItem) => {
      return (
        String(subjectItem.subjectCode)
          .toLowerCase()
          .includes(normalizedKeyword) ||
        String(subjectItem.subjectName).toLowerCase().includes(normalizedKeyword)
      )
    })
  }, [activeSubPlo, linkedSubjectMap, subjectMasterList, subjectSearchKeyword])

  const getSubjectById = useCallback(
    (subjectId) => {
      const subjectItem = subjectLookupMap.get(String(subjectId))

      if (subjectItem) {
        return subjectItem
      }

      return {
        id: String(subjectId),
        subjectCode: `ID ${subjectId}`,
        subjectName: 'ไม่พบข้อมูลรายวิชาในรายการรายวิชา',
      }
    },
    [subjectLookupMap]
  )

  const getPloLinkedCount = useCallback(
    (ploId) => {
      const currentPlo = ploSectionList.find((ploItem) => ploItem.id === ploId)
      if (!currentPlo) return 0

      return currentPlo.subPloItems.reduce((total, subPloItem) => {
        return total + (linkedSubjectMap[subPloItem.id] ?? []).length
      }, 0)
    },
    [linkedSubjectMap, ploSectionList]
  )

  const fetchMappingData = useCallback(
    async (shouldShowLoading = true) => {
      if (shouldShowLoading) {
        setIsLoading(true)
      }

      setErrorMessage('')

      try {
        const config = getAuthConfig()

        const courseResponseList = await fetchAllCoursesFromApi(apiUrl, config)
        const courseDetailList = await fetchCourseDetailsFromApi(
          apiUrl,
          config,
          courseResponseList
        )

        const normalizedCourseList = courseDetailList.map((course) =>
          normalizeCourseFromApi(course)
        )

        const selectedDepartmentIdText = String(selectedDepartmentId || '')

        const courseListInSelectedDepartment = selectedDepartmentId
          ? normalizedCourseList.filter(
              (course) => String(course.departmentId) === selectedDepartmentIdText
            )
          : normalizedCourseList

        const allowedCourseIdSet = new Set(
          courseListInSelectedDepartment.map((course) => String(course.id))
        )

        setSubjectMasterList(courseListInSelectedDepartment)

        const subPloResponse = await axios.get(`${apiUrl}/plo/sub-plos`, {
          ...config,
          params: {
            page: 1,
            limit: 500,
          },
        })

        const subPloResponseList = getResponseList(subPloResponse.data, [
          'items',
          'data',
          'sub_plos',
          'subPlos',
          'results',
        ])

        const subPloDetailList = await fetchSubPloDetailsFromApi(
          apiUrl,
          config,
          subPloResponseList
        )

        const normalizedSubPloList = subPloDetailList.map((subPlo) =>
          normalizeSubPloFromApi(subPlo)
        )

        const allLinkedMap = buildLinkedSubjectMap(normalizedSubPloList)
        const filteredSubPloList = filterSubPloListByAllowedCourseIds(
          normalizedSubPloList,
          allowedCourseIdSet
        )

        setAllLinkedSubjectMap(allLinkedMap)
        setSubPloList(filteredSubPloList)
        setLinkedSubjectMap(buildLinkedSubjectMap(filteredSubPloList))

        const latestPloSectionList = buildPloSectionList(filteredSubPloList)

        const firstPloWithSubPlo = latestPloSectionList.find(
          (ploItem) => ploItem.subPloItems.length > 0
        )

        if (firstPloWithSubPlo) {
          setSelectedPloId((previousPloId) => {
            const currentPloStillHasSubPlo = latestPloSectionList.find(
              (ploItem) => ploItem.id === previousPloId
            )?.subPloItems.length

            return currentPloStillHasSubPlo
              ? previousPloId
              : firstPloWithSubPlo.id
          })

          setExpandedSubPloIds((previousIds) => {
            if (previousIds.length > 0) return previousIds
            return [firstPloWithSubPlo.subPloItems[0].id]
          })
        } else {
          setExpandedSubPloIds([])
        }
      } catch (error) {
        console.error('Error fetching PLO subject mapping data:', error)
        setErrorMessage(
          getErrorMessage(
            error,
            'ไม่สามารถโหลดข้อมูลความเชื่อมโยงระหว่าง Sub-PLO กับรายวิชาได้'
          )
        )
      } finally {
        if (shouldShowLoading) {
          setIsLoading(false)
        }
      }
    },
    [apiUrl, selectedDepartmentId]
  )

  useEffect(() => {
    fetchMappingData()
  }, [fetchMappingData])

  const handleBack = () => {
    navigate(-1)
  }

  const handleSelectPlo = (ploId) => {
    setSelectedPloId(ploId)
    const firstSubPloId = getSubPloIdsByPloId(ploSectionList, ploId)[0]
    setExpandedSubPloIds(firstSubPloId ? [firstSubPloId] : [])
  }

  const handleToggleSubPlo = (subPloId) => {
    const isExpanded = expandedSubPloIds.includes(subPloId)

    if (isExpanded) {
      setExpandedSubPloIds((previousIds) =>
        previousIds.filter((currentId) => currentId !== subPloId)
      )
      return
    }

    setExpandedSubPloIds((previousIds) => [...previousIds, subPloId])
  }

  const handleExpandAll = () => {
    setExpandedSubPloIds(
      selectedPlo.subPloItems.map((subPloItem) => subPloItem.id)
    )
  }

  const handleCollapseAll = () => {
    setExpandedSubPloIds([])
  }

  const handleOpenAddDialog = (subPloItem) => {
    setActiveSubPlo(subPloItem)
    setSelectedSubjectId('')
    setSubjectSearchKeyword('')
    setErrorMessage('')
    setSuccessMessage('')
    setDialogOpen(true)
  }

  const resetDialogState = () => {
    setDialogOpen(false)
    setActiveSubPlo(null)
    setSelectedSubjectId('')
    setSubjectSearchKeyword('')
  }

  const handleCloseDialog = () => {
    if (isSavingMapping) return

    resetDialogState()
  }

  const handleAddSubjectToSubPlo = async () => {
    if (!activeSubPlo || !selectedSubjectId) {
      return
    }

    const currentVisibleSubjectIds = (linkedSubjectMap[activeSubPlo.id] ?? []).map(
      (subjectId) => String(subjectId)
    )

    const currentAllSubjectIds = (
      allLinkedSubjectMap[activeSubPlo.id] ?? currentVisibleSubjectIds
    ).map((subjectId) => String(subjectId))

    const selectedSubjectIdText = String(selectedSubjectId)

    if (currentVisibleSubjectIds.includes(selectedSubjectIdText)) {
      window.alert('วิชานี้ถูกเพิ่มอยู่แล้วใน Sub-PLO นี้')
      return
    }

    const nextSubjectIds = currentAllSubjectIds.includes(selectedSubjectIdText)
      ? currentAllSubjectIds
      : [...currentAllSubjectIds, selectedSubjectIdText]

    setIsSavingMapping(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await axios.post(
        `${apiUrl}/plo/sub-plos/${activeSubPlo.id}/assign-courses`,
        getNumberCourseIds(nextSubjectIds),
        getAuthConfig()
      )

      await fetchMappingData(false)

      setExpandedSubPloIds((previousIds) =>
        previousIds.includes(activeSubPlo.id)
          ? previousIds
          : [...previousIds, activeSubPlo.id]
      )

      setSuccessMessage('เพิ่มรายวิชาเข้า Sub-PLO สำเร็จ')
      resetDialogState()
    } catch (error) {
      console.error('Error assigning course to Sub-PLO:', error)
      setErrorMessage(
        getErrorMessage(error, 'ไม่สามารถเพิ่มรายวิชาเข้า Sub-PLO ได้')
      )
    } finally {
      setIsSavingMapping(false)
    }
  }

  const handleRemoveSubjectFromSubPlo = async (subPloId, subjectId) => {
    const isConfirmed = window.confirm(
      'ต้องการลบวิชานี้ออกจาก Sub-PLO นี้ใช่หรือไม่'
    )

    if (!isConfirmed) {
      return
    }

    setRemovingSubjectKey(`${subPloId}-${subjectId}`)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await axios.delete(
        `${apiUrl}/plo/sub-plos/${subPloId}/courses/${subjectId}`,
        getAuthConfig()
      )

      await fetchMappingData(false)

      setExpandedSubPloIds((previousIds) =>
        previousIds.includes(subPloId) ? previousIds : [...previousIds, subPloId]
      )

      setSuccessMessage('ลบรายวิชาออกจาก Sub-PLO สำเร็จ')
    } catch (error) {
      console.error('Error removing course from Sub-PLO:', error)
      setErrorMessage(
        getErrorMessage(error, 'ไม่สามารถลบรายวิชาออกจาก Sub-PLO ได้')
      )
    } finally {
      setRemovingSubjectKey('')
    }
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box className={styles.headerLeft}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              className={styles.backButton}
              onClick={handleBack}
            >
              กลับ
            </Button>

            <Typography className={styles.pageTitle}>
              จัดการความเชื่อมโยงผลลัพธ์การเรียนรู้กับรายวิชาในหลักสูตร
            </Typography>

            <Typography className={styles.pageDescription}>
              เลือก PLO ทางด้านซ้าย แล้วจัดการรายวิชาที่เชื่อมอยู่ในแต่ละ Sub-PLO
              ทางด้านขวา ข้อมูล Sub-PLO และรายวิชาถูกดึงจาก API ของระบบ
            </Typography>
          </Box>

          <Box className={styles.pageStatus}>
            <Typography className={styles.pageStatusLabel}>
              จำนวนความเชื่อมโยงทั้งหมด
            </Typography>

            <Typography className={styles.pageStatusValue}>
              {totalLinkedCount}
            </Typography>
          </Box>
        </Box>

        <Box className={styles.majorSummaryCard}>
          <Box className={styles.majorSummaryIcon}>
            <DeviceHubRoundedIcon />
          </Box>

          <Box className={styles.majorSummaryText}>
            <Typography className={styles.majorSummaryTitle}>
              สาขาที่กำลังจัดการ
            </Typography>

            <Typography className={styles.majorSummaryName}>
              {getMajorName(currentMajor)}
            </Typography>

            <Typography className={styles.majorSummaryMeta}>
              รหัสสาขา #{getMajorCode(currentMajor, selectedDepartmentId)} ·{' '}
              {getCurriculumName(currentMajor)}
            </Typography>
          </Box>
        </Box>

        {errorMessage && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ marginBottom: 2 }}>
            {successMessage}
          </Alert>
        )}

        {isLoading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', padding: '48px' }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box className={styles.layoutGrid}>
            <Box className={styles.sidebarPanel}>
              <Box className={styles.sidebarHeader}>
                <Typography className={styles.sidebarTitle}>
                  รายการ PLO หลัก
                </Typography>

                <Typography className={styles.sidebarDescription}>
                  เลือกหัวข้อใหญ่ที่ต้องการจัดการ
                </Typography>
              </Box>

              <Box className={styles.ploNavList}>
                {ploSectionList.map((ploItem) => {
                  const isActive = ploItem.id === selectedPloId
                  const linkedCount = getPloLinkedCount(ploItem.id)

                  return (
                    <button
                      key={ploItem.id}
                      type="button"
                      className={`${styles.ploNavButton} ${isActive ? styles.ploNavButtonActive : ''}`}
                      onClick={() => handleSelectPlo(ploItem.id)}
                    >
                      <Box className={styles.ploNavTop}>
                        <Chip
                          label={ploItem.code}
                          className={styles.ploNavChip}
                        />

                        <Chip
                          label={`${linkedCount} วิชา`}
                          className={styles.ploNavCountChip}
                        />
                      </Box>

                      <Typography className={styles.ploNavTitle}>
                        {ploItem.title}
                      </Typography>
                    </button>
                  )
                })}
              </Box>
            </Box>

            <Box className={styles.detailPanel}>
              <Box className={styles.detailHeader}>
                <Box className={styles.detailHeaderLeft}>
                  <Chip
                    label={selectedPlo.code}
                    className={styles.detailPloChip}
                  />

                  <Typography className={styles.detailTitle}>
                    {selectedPlo.title}
                  </Typography>

                  <Typography className={styles.detailDescription}>
                    จัดการรายวิชาที่เชื่อมกับ Sub-PLO ภายใต้ {selectedPlo.code}
                  </Typography>
                </Box>

                <Box className={styles.detailHeaderActions}>
                  <Button
                    variant="outlined"
                    className={styles.secondaryButton}
                    onClick={handleExpandAll}
                  >
                    แสดงทั้งหมด
                  </Button>

                  <Button
                    variant="outlined"
                    className={styles.secondaryButton}
                    onClick={handleCollapseAll}
                  >
                    ย่อทั้งหมด
                  </Button>
                </Box>
              </Box>

              <Box className={styles.subPloList}>
                {selectedPlo.subPloItems.length === 0 ? (
                  <Box className={styles.emptyLinkedState}>
                    <Typography className={styles.emptyLinkedStateText}>
                      ยังไม่มี Sub-PLO ภายใต้ {selectedPlo.code}
                    </Typography>
                  </Box>
                ) : (
                  selectedPlo.subPloItems.map((subPloItem) => {
                    const linkedSubjectIds = linkedSubjectMap[subPloItem.id] ?? []
                    const linkedSubjectList = linkedSubjectIds.map((subjectId) =>
                      getSubjectById(subjectId)
                    )

                    const isExpanded = expandedSubPloIds.includes(subPloItem.id)

                    return (
                      <Box key={subPloItem.id} className={styles.subPloCard}>
                        <Box className={styles.subPloHeader}>
                          <Box className={styles.subPloHeadLeft}>
                            <Box className={styles.subPloMetaRow}>
                              <Chip
                                label={`Sub-PLO ${subPloItem.code}`}
                                className={styles.subPloCodeChip}
                              />

                              <Chip
                                label={`${linkedSubjectList.length} วิชา`}
                                className={styles.subPloCountChip}
                              />
                            </Box>

                            <Typography className={styles.subPloDescriptionText}>
                              {subPloItem.description}
                            </Typography>
                          </Box>

                          <Box className={styles.subPloActionRow}>
                            <Button
                              variant="contained"
                              startIcon={<PlaylistAddRoundedIcon />}
                              className={styles.addSubjectButton}
                              onClick={() => handleOpenAddDialog(subPloItem)}
                            >
                              เพิ่มวิชา
                            </Button>

                            <IconButton
                              className={styles.expandButton}
                              onClick={() => handleToggleSubPlo(subPloItem.id)}
                            >
                              {isExpanded ? (
                                <KeyboardArrowUpRoundedIcon />
                              ) : (
                                <KeyboardArrowDownRoundedIcon />
                              )}
                            </IconButton>
                          </Box>
                        </Box>

                        {isExpanded && (
                          <Box className={styles.linkedSubjectBlock}>
                            <Typography className={styles.linkedSubjectLabel}>
                              รายวิชาที่เชื่อมโยงกับหัวข้อนี้
                            </Typography>

                            {linkedSubjectList.length === 0 ? (
                              <Box className={styles.emptyLinkedState}>
                                <Typography className={styles.emptyLinkedStateText}>
                                  ยังไม่มีรายวิชาที่ถูกเพิ่มใน Sub-PLO นี้
                                </Typography>
                              </Box>
                            ) : (
                              <Box className={styles.subjectGrid}>
                                {linkedSubjectList.map((subjectItem) => (
                                  <Box
                                    key={`${subPloItem.id}-${subjectItem.id}`}
                                    className={styles.linkedSubjectCard}
                                  >
                                    <Box className={styles.linkedSubjectTop}>
                                      <Chip
                                        label={subjectItem.subjectCode || '-'}
                                        className={styles.linkedSubjectCodeChip}
                                      />

                                      <IconButton
                                        className={styles.removeSubjectButton}
                                        disabled={
                                          removingSubjectKey ===
                                          `${subPloItem.id}-${subjectItem.id}`
                                        }
                                        onClick={() =>
                                          handleRemoveSubjectFromSubPlo(
                                            subPloItem.id,
                                            subjectItem.id
                                          )
                                        }
                                      >
                                        <DeleteOutlineRoundedIcon />
                                      </IconButton>
                                    </Box>

                                    <Box className={styles.linkedSubjectBody}>
                                      <MenuBookRoundedIcon
                                        className={styles.linkedSubjectIcon}
                                      />

                                      <Typography className={styles.linkedSubjectName}>
                                        {subjectItem.subjectName || '-'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    )
                  })
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>เพิ่มวิชาเข้า Sub-PLO</DialogTitle>

        <DialogContent>
          <Box className={styles.dialogForm}>
            <Typography className={styles.dialogHint}>
              {activeSubPlo
                ? `กำลังเพิ่มวิชาให้ Sub-PLO ${activeSubPlo.code}`
                : '-'}
            </Typography>

            <TextField
              fullWidth
              placeholder="ค้นหาด้วยรหัสวิชาหรือชื่อวิชา..."
              value={subjectSearchKeyword}
              onChange={(event) => setSubjectSearchKeyword(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon className={styles.searchIcon} />
                  </InputAdornment>
                ),
              }}
            />

            {filteredAvailableSubjectList.length === 0 ? (
              <Box className={styles.dialogEmptyState}>
                <Typography className={styles.dialogEmptyStateText}>
                  ไม่พบรายวิชาที่เพิ่มได้ใน Sub-PLO นี้
                </Typography>
              </Box>
            ) : (
              <Box className={styles.dialogSubjectList}>
                {filteredAvailableSubjectList.map((subjectItem) => {
                  const isSelected =
                    String(selectedSubjectId) === String(subjectItem.id)
                  const isAlreadyLinked = subjectItem.isAlreadyLinked

                  return (
                    <button
                      key={subjectItem.id}
                      type="button"
                      disabled={isAlreadyLinked}
                      className={`${styles.dialogSubjectItem} ${isSelected ? styles.dialogSubjectItemSelected : ''}`}
                      onClick={() => {
                        if (isAlreadyLinked) {
                          return
                        }

                        setSelectedSubjectId(subjectItem.id)
                      }}
                    >
                      <Chip
                        label={subjectItem.subjectCode || '-'}
                        className={styles.dialogSubjectChip}
                      />

                      <Typography className={styles.dialogSubjectName}>
                        {subjectItem.subjectName || '-'}
                      </Typography>

                      {isAlreadyLinked && (
                        <Chip
                          label="เพิ่มอยู่แล้ว"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </button>
                  )
                })}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ padding: '0 24px 20px' }}>
          <Button onClick={handleCloseDialog} disabled={isSavingMapping}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSubjectToSubPlo}
            disabled={!selectedSubjectId || isSavingMapping}
          >
            {isSavingMapping ? 'กำลังเพิ่ม...' : 'เพิ่มวิชา'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManagePloSubjectMappingPage