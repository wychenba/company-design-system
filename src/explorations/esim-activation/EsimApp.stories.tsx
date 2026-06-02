import type { Meta, StoryObj } from '@storybook/react'
import { EsimApp } from './EsimApp'

const meta: Meta<typeof EsimApp> = {
  title: 'Explorations/eSIM 出差開通',
  component: EsimApp,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'ios-gray', values: [{ name: 'ios-gray', value: '#e5e5ea' }] },
  },
}
export default meta
type Story = StoryObj<typeof EsimApp>

export const FullFlow: Story = { name: '完整互動流程' }
