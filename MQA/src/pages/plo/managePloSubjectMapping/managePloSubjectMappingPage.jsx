import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
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
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DeviceHubRoundedIcon from '@mui/icons-material/DeviceHubRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import styles from './managePloSubjectMappingPage.module.css'

const fallbackMajor = {
  id: 93,
  majorCode: '93',
  majorNameTh: 'เทคโนโลยีมัลติมีเดีย',
  curriculumNameTh: 'หลักสูตรเทคโนโลยีอุตสาหกรรม',
}

const subjectMasterList = [
  {
    id: '15-03-007',
    subjectCode: '15-03-007',
    subjectName: 'เทคโนโลยีสารสนเทศในยุคดิจิทัล',
  },
  {
    id: '15-05-026',
    subjectCode: '15-05-026',
    subjectName: 'โลกของการทำงานและกระแสการเปลี่ยนแปลง',
  },
  {
    id: '15-06-027',
    subjectCode: '15-06-027',
    subjectName: 'ความเป็นพลเมืองไทยและพลเมืองโลก',
  },
  {
    id: '15-03-011',
    subjectCode: '15-03-011',
    subjectName: 'ผู้ประกอบการดิจิทัล',
  },
  {
    id: '15-03-012',
    subjectCode: '15-03-012',
    subjectName:
      'ทักษะทางคณิตศาสตร์เพื่อเตรียมสอบบรรจุข้าราชการและหน่วยงานที่เกี่ยวข้อง',
  },
  {
    id: '15-05-023',
    subjectCode: '15-05-023',
    subjectName: 'ความฉลาดทางดิจิทัล',
  },
  {
    id: '15-03-005',
    subjectCode: '15-03-005',
    subjectName: 'ผู้ประกอบการนวัตกรรม',
  },
  {
    id: '15-03-014',
    subjectCode: '15-03-014',
    subjectName: 'การพัฒนาศักยภาพเพื่อมุ่งสู่การเป็นผู้ประกอบการมือใหม่',
  },
]

const ploSectionList = [
  {
    id: 1,
    code: 'PLO1',
    title:
      'เสริมสร้างความเป็นมนุษย์ให้พร้อมสำหรับโลกในปัจจุบันและอนาคต เพื่อให้เป็นบุคคลผู้ใฝ่รู้และมีทักษะที่จำเป็นสำหรับศตวรรษที่ 21',
    subPloItems: [
      {
        id: '1.1',
        code: '1.1',
        description:
          'มีความรู้หลักของการใช้ชีวิต มีทักษะการเรียนรู้และนวัตกรรม ได้แก่ มีความคิดสร้างสรรค์ แก้ปัญหาเป็น ใส่ใจนวัตกรรม สื่อสารดี มีวิจารณญาณ เต็มใจร่วมมือ',
      },
      {
        id: '1.2',
        code: '1.2',
        description:
          'มีความรู้ ทักษะ และจริยธรรมในการใช้ระบบสารสนเทศ สื่อ เทคโนโลยี ได้แก่ มีการอัปเดตข้อมูลข่าวสาร รอบรู้เทคโนโลยีสารสนเทศ รู้เท่าทันสื่อ ฉลาดสื่อสาร',
      },
      {
        id: '1.3',
        code: '1.3',
        description:
          'มีความรู้ในการใช้ทักษะชีวิตและอาชีพ ได้แก่ มีความยืดหยุ่น เรียนรู้วัฒนธรรม รู้จักปรับตัว มีความเป็นผู้นำ ริเริ่มสิ่งใหม่ รับผิดชอบหน้าที่ ใส่ใจดูแลตัวเอง',
      },
    ],
  },
  {
    id: 2,
    code: 'PLO2',
    title:
      'เป็นผู้ตระหนักรู้ถึงการบูรณาการศาสตร์ต่าง ๆ ในการพัฒนาหรือแก้ไขปัญหา เป็นผู้ที่สามารถสร้างโอกาสและคุณค่าให้ตนเองและสังคม รู้เท่าทันการเปลี่ยนแปลงของสังคมและของโลก',
    subPloItems: [
      {
        id: '2.1',
        code: '2.1',
        description:
          'มีการแสวงหาและรวบรวมความรู้นวัตกรรม โดยการสำรวจ การจัดจำแนก การจัดการและการสังเคราะห์ความคิดและข้อมูลสารสนเทศ เพื่อประเมินประสบการณ์และแก้ปัญหา',
      },
      {
        id: '2.2',
        code: '2.2',
        description:
          'สามารถใช้เหตุผลในการแยกแยะเชื่อมั่นและรู้คุณค่าในตนเองและผู้อื่น',
      },
    ],
  },
  {
    id: 3,
    code: 'PLO3',
    title:
      'เป็นบุคคลที่ดำรงตนเป็นพลเมืองที่เข้มแข็ง มีจริยธรรมและยึดมั่นในสิ่งที่ถูกต้อง รู้คุณค่าและรักษาชาติกำเนิด ร่วมมือรวมพลังเพื่อสร้างสรรค์และพัฒนาสังคมอย่างยั่งยืน',
    subPloItems: [
      {
        id: '3.1',
        code: '3.1',
        description:
          'รู้จักการตัดสินใจตามหลักนิติธรรม เสริมสร้างแรงบันดาลใจ เพื่อให้มีชีวิตอยู่อย่างมีเป้าหมาย',
      },
      {
        id: '3.2',
        code: '3.2',
        description:
          'รู้หลักธรรมาภิบาล ปลูกฝังจิตสาธารณะ รู้จักการพึ่งพาตนเอง มีความซื่อสัตย์ มีวินัย มีคุณธรรมจริยธรรม รับผิดชอบต่อหน้าที่ของตนเองและสังคม',
      },
    ],
  },
  {
    id: 4,
    code: 'PLO4',
    title:
      'เป็นบุคคลที่สามารถสื่อสารได้อย่างมีประสิทธิภาพทั้งในการพูด การฟัง การอ่าน การเขียน และเลือกใช้รูปแบบการนำเสนอที่เหมาะสมสำหรับกลุ่มบุคคลที่แตกต่างกันได้',
    subPloItems: [
      {
        id: '4.1',
        code: '4.1',
        description:
          'สามารถสื่อสารได้อย่างมีประสิทธิภาพทั้งในการพูด การฟัง การอ่าน การเขียน และจรรยาบรรณในการสื่อสารโดยยึดหลักความถูกต้อง ครบถ้วน ไม่บิดเบือนข้อมูล',
      },
      {
        id: '4.2',
        code: '4.2',
        description:
          'เลือกใช้รูปแบบการนำเสนอที่เหมาะสมสำหรับกลุ่มบุคคลที่แตกต่างกันได้',
      },
    ],
  },
  {
    id: 5,
    code: 'PLO5',
    title:
      'อธิบายหลักการออกแบบเบื้องต้นและมีความรู้และแนวคิดด้านศิลปะ เทคโนโลยีดิจิทัล รวมถึงความเป็นผู้ประกอบการ',
    subPloItems: [
      {
        id: '5.1',
        code: '5.1',
        description:
          'อธิบายหลักการออกแบบเบื้องต้นและมีความรู้และแนวคิดด้านศิลปะ เทคโนโลยีดิจิทัล การสร้างคอนเทนต์ แอนิเมชันและเกม รวมถึงความเป็นผู้ประกอบการ',
      },
      {
        id: '5.2',
        code: '5.2',
        description: 'อธิบายหลักการสร้างคอนเทนต์',
      },
      {
        id: '5.3',
        code: '5.3',
        description: 'อธิบายหลักการสร้างแอนิเมชันและเกม',
      },
      {
        id: '5.4',
        code: '5.4',
        description: 'อธิบายหลักการเป็นผู้ประกอบการสื่อดิจิทัล',
      },
    ],
  },
  {
    id: 6,
    code: 'PLO6',
    title:
      'ผู้เรียนสามารถประยุกต์ใช้ซอฟต์แวร์และเครื่องมือต่าง ๆ เพื่อใช้ในการสร้างสรรค์สื่อดิจิทัล เพื่อสื่อสารต่อกลุ่มเป้าหมายได้อย่างเหมาะสมและมีความรับผิดชอบต่อสื่อดิจิทัลที่สร้างขึ้น',
    subPloItems: [
      {
        id: '6.1',
        code: '6.1',
        description: 'ประยุกต์ใช้ซอฟต์แวร์ในการผลิตสื่อดิจิทัล',
      },
      {
        id: '6.2',
        code: '6.2',
        description: 'ประยุกต์ใช้เครื่องมือในการผลิตสื่อดิจิทัล',
      },
      {
        id: '6.3',
        code: '6.3',
        description: 'แสวงหาความรู้และเครื่องมือใหม่ในการผลิตสื่อดิจิทัล',
      },
    ],
  },
  {
    id: 7,
    code: 'PLO7',
    title:
      'ผู้เรียนสามารถออกแบบและสร้างสรรค์สื่อดิจิทัลได้ โดยไม่ขัดต่อกฎ กติกา ของวิชาชีพ',
    subPloItems: [
      {
        id: '7.1',
        code: '7.1',
        description: 'สร้างสรรค์ผลงานที่ไม่ขัดต่อกฎ กติกา ของวิชาชีพและสังคม',
      },
      {
        id: '7.2',
        code: '7.2',
        description: 'ไม่คัดลอกผลงานของผู้อื่นและละเมิดทรัพย์สินทางปัญญา',
      },
      {
        id: '7.3',
        code: '7.3',
        description: 'ผลงานสามารถเผยแพร่และชี้นำสังคมไปในทิศทางที่ดี',
      },
    ],
  },
  {
    id: 8,
    code: 'PLO8',
    title:
      'ผู้เรียนสามารถนำเสนอผลงานการออกแบบและสร้างสรรค์สื่อดิจิทัลได้ตรงตามความต้องการของกลุ่มเป้าหมายหรือผู้ประกอบการ อย่างซื่อสัตย์ต่อวิชาชีพ',
    subPloItems: [
      {
        id: '8.1',
        code: '8.1',
        description: 'มีบุคลิกลักษณะที่มีความน่าเชื่อถือ เชื่อมั่นในตัวเอง',
      },
      {
        id: '8.2',
        code: '8.2',
        description: 'นำเสนอผลงานได้อย่างสร้างสรรค์และตรงตามวัตถุประสงค์',
      },
      {
        id: '8.3',
        code: '8.3',
        description:
          'มีทักษะการใช้เครื่องมือและเทคโนโลยีสื่อดิจิทัลได้อย่างเชี่ยวชาญในการนำเสนอผลงาน',
      },
    ],
  },
]

const initialLinkedSubjectMap = {
  '1.1': ['15-03-007', '15-05-026', '15-06-027'],
  '1.2': ['15-03-011', '15-03-012', '15-05-023'],
  '1.3': ['15-03-005', '15-03-014'],
  '2.1': ['15-03-007'],
  '2.2': ['15-05-026'],
  '3.1': ['15-06-027'],
  '3.2': ['15-03-011'],
  '4.1': ['15-03-007'],
  '4.2': ['15-05-023'],
  '5.1': ['15-03-011'],
  '5.2': ['15-03-007'],
  '5.3': ['15-03-014'],
  '5.4': ['15-03-005'],
  '6.1': ['15-03-007'],
  '6.2': ['15-05-023'],
  '6.3': [],
  '7.1': ['15-03-011'],
  '7.2': ['15-03-014'],
  '7.3': [],
  '8.1': [],
  '8.2': ['15-03-007'],
  '8.3': ['15-05-023'],
}

function getSubPloIdsByPloId(ploId) {
  const targetPlo = ploSectionList.find((ploItem) => ploItem.id === ploId)
  return targetPlo ? targetPlo.subPloItems.map((subPloItem) => subPloItem.id) : []
}

function ManagePloSubjectMappingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentMajor = location.state?.major ?? fallbackMajor

  const [selectedPloId, setSelectedPloId] = useState(1)
  const [expandedSubPloIds, setExpandedSubPloIds] = useState(['1.1'])
  const [linkedSubjectMap, setLinkedSubjectMap] = useState(initialLinkedSubjectMap)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeSubPlo, setActiveSubPlo] = useState(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [subjectSearchKeyword, setSubjectSearchKeyword] = useState('')

  const selectedPlo = useMemo(() => {
    return ploSectionList.find((ploItem) => ploItem.id === selectedPloId) ?? ploSectionList[0]
  }, [selectedPloId])

  const totalLinkedCount = useMemo(() => {
    return Object.values(linkedSubjectMap).reduce(
      (total, currentSubjectIds) => total + currentSubjectIds.length,
      0
    )
  }, [linkedSubjectMap])

  const filteredAvailableSubjectList = useMemo(() => {
    if (!activeSubPlo) return []

    const linkedSubjectIds = linkedSubjectMap[activeSubPlo.id] ?? []
    const normalizedKeyword = subjectSearchKeyword.trim().toLowerCase()

    const availableSubjects = subjectMasterList.filter(
      (subjectItem) => !linkedSubjectIds.includes(subjectItem.id)
    )

    if (!normalizedKeyword) {
      return availableSubjects
    }

    return availableSubjects.filter((subjectItem) => {
      return (
        subjectItem.subjectCode.toLowerCase().includes(normalizedKeyword) ||
        subjectItem.subjectName.toLowerCase().includes(normalizedKeyword)
      )
    })
  }, [activeSubPlo, linkedSubjectMap, subjectSearchKeyword])

  const handleBack = () => {
    navigate(-1)
  }

  const handleSelectPlo = (ploId) => {
    setSelectedPloId(ploId)
    const firstSubPloId = getSubPloIdsByPloId(ploId)[0]
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
    setExpandedSubPloIds(selectedPlo.subPloItems.map((subPloItem) => subPloItem.id))
  }

  const handleCollapseAll = () => {
    setExpandedSubPloIds([])
  }

  const handleOpenAddDialog = (subPloItem) => {
    setActiveSubPlo(subPloItem)
    setSelectedSubjectId('')
    setSubjectSearchKeyword('')
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setActiveSubPlo(null)
    setSelectedSubjectId('')
    setSubjectSearchKeyword('')
  }

  const handleAddSubjectToSubPlo = () => {
    if (!activeSubPlo || !selectedSubjectId) {
      return
    }

    setLinkedSubjectMap((previousMap) => {
      const currentSubjectIds = previousMap[activeSubPlo.id] ?? []

      if (currentSubjectIds.includes(selectedSubjectId)) {
        return previousMap
      }

      return {
        ...previousMap,
        [activeSubPlo.id]: [...currentSubjectIds, selectedSubjectId],
      }
    })

    handleCloseDialog()
  }

  const handleRemoveSubjectFromSubPlo = (subPloId, subjectId) => {
    const isConfirmed = window.confirm(
      'ต้องการลบวิชานี้ออกจาก Sub-PLO นี้ใช่หรือไม่'
    )

    if (!isConfirmed) {
      return
    }

    setLinkedSubjectMap((previousMap) => ({
      ...previousMap,
      [subPloId]: (previousMap[subPloId] ?? []).filter(
        (currentSubjectId) => currentSubjectId !== subjectId
      ),
    }))
  }

  const getSubjectById = (subjectId) => {
    return (
      subjectMasterList.find((subjectItem) => subjectItem.id === subjectId) ?? null
    )
  }

  const getPloLinkedCount = (ploId) => {
    const currentPlo = ploSectionList.find((ploItem) => ploItem.id === ploId)
    if (!currentPlo) return 0

    return currentPlo.subPloItems.reduce((total, subPloItem) => {
      return total + (linkedSubjectMap[subPloItem.id] ?? []).length
    }, 0)
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
              ทางด้านขวา ตอนนี้เป็น mock data สำหรับออกแบบภาพรวมก่อนเชื่อม API
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
              {currentMajor.majorNameTh}
            </Typography>

            <Typography className={styles.majorSummaryMeta}>
              รหัสสาขา #{currentMajor.majorCode} · {currentMajor.curriculumNameTh}
            </Typography>
          </Box>
        </Box>

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
              {selectedPlo.subPloItems.map((subPloItem) => {
                const linkedSubjectIds = linkedSubjectMap[subPloItem.id] ?? []
                const linkedSubjectList = linkedSubjectIds
                  .map((subjectId) => getSubjectById(subjectId))
                  .filter(Boolean)

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
                                    label={subjectItem.subjectCode}
                                    className={styles.linkedSubjectCodeChip}
                                  />

                                  <IconButton
                                    className={styles.removeSubjectButton}
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
                                    {subjectItem.subjectName}
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
              })}
            </Box>
          </Box>
        </Box>
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
                  const isSelected = selectedSubjectId === subjectItem.id

                  return (
                    <button
                      key={subjectItem.id}
                      type="button"
                      className={`${styles.dialogSubjectItem} ${isSelected ? styles.dialogSubjectItemSelected : ''}`}
                      onClick={() => setSelectedSubjectId(subjectItem.id)}
                    >
                      <Chip
                        label={subjectItem.subjectCode}
                        className={styles.dialogSubjectChip}
                      />

                      <Typography className={styles.dialogSubjectName}>
                        {subjectItem.subjectName}
                      </Typography>
                    </button>
                  )
                })}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ padding: '0 24px 20px' }}>
          <Button onClick={handleCloseDialog}>ยกเลิก</Button>
          <Button
            variant="contained"
            onClick={handleAddSubjectToSubPlo}
            disabled={!selectedSubjectId}
          >
            เพิ่มวิชา
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManagePloSubjectMappingPage