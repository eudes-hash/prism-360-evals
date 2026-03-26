import type { DriveStep } from 'driver.js'

export const GUIDE_TOUR_SAMPLE_VIDEO_URL =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

export const getGuideTourSteps = (): DriveStep[] => [
  {
    element: '[data-tour="view-mode"]',
    popover: {
      title: 'View Mode',
      description:
        'Choose how to inspect the media. Use Spherical for 360 review and switch modes when you need alternative validation angles.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="show-grid-button"]',
    popover: {
      title: 'Show Grid',
      description:
        'Grid helps verify 360 seam continuity and spatial orientation (front/right/back/left) while reviewing realism and camera stitching.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="guide-tour-button"]',
    popover: {
      title: 'Guide Tour',
      description:
        'This button restarts the guided walkthrough any time for onboarding or refresher training.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="viewer-area"]',
    popover: {
      title: '360 Viewer',
      description:
        'Drag to inspect full context before validating question/answer. Always confirm the action is visible and verifiable in the video.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="event-launcher"]',
    popover: {
      title: 'Event Tagger',
      description:
        'Capture event ranges with start/end time and camera orientation. This is useful for temporal counting and auditable evidence.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="event-set-start"]',
    popover: {
      title: 'Set Start',
      description: 'Marks when an event starts while saving the current camera view and center coordinate.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="event-set-end"]',
    popover: {
      title: 'Set End',
      description: 'Marks when that same event ends. Range shortcuts appear later as interactive timeline layers.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="timeline-layer"]',
    popover: {
      title: 'Timeline Event Layers',
      description:
        'Click a range to jump to that event start and restore camera context. Use this for fast re-checking before final validation.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="taxonomy-open"]',
    popover: {
      title: 'Taxonomy Form',
      description:
        'Open the QA form used to validate realism, 360 status, question validity, answer validity, and temporal rules.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="taxonomy-task-sync"]',
    popover: {
      title: 'Sync Task Context',
      description:
        'Sync pulls Task ID, prompt, and answer from Feather to keep your validations aligned with the active task.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="taxonomy-video-validity"]',
    popover: {
      title: 'Video Validity Section',
      description:
        'Apply realism and 360 continuity checks first. Mark NO only when issues truly block reliable evidence from the scene.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="taxonomy-question-validity"]',
    popover: {
      title: 'Question Validity + Fix',
      description:
        'When invalid, provide precise justification and a corrected question. Fix should remain context-bound and logically answerable.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="taxonomy-answer-validity"]',
    popover: {
      title: 'Answer Validity',
      description:
        'Answer must match video evidence and the final question. If question is invalid, answer must also be invalid until fixed.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="taxonomy-temporal-counting"]',
    popover: {
      title: 'Temporal Counting Rules',
      description:
        'Temporal tasks require precise timestamps. For temporal fix questions, register at least two events with exact timing.',
      side: 'left',
      align: 'start',
    },
  },
]
