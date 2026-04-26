import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './textarea'
import { Field, FieldLabel, FieldDescription, FieldError } from '@/design-system/components/Field/field'

const meta: Meta<typeof Textarea> = {
  title: 'Design System/Components/Textarea/展示',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  args: {
    placeholder: '請輸入多行文字...',
  },
  render: (args) => (
    <div className="max-w-md">
      <Textarea {...args} />
    </div>
  ),
}

export const Modes: Story = {
  name: '三種 mode',
  render: () => (
    <div className="max-w-md flex flex-col gap-4">
      <div>
        <p className="text-caption text-fg-muted mb-1">edit</p>
        <Textarea placeholder="可編輯" defaultValue="內容範例" />
      </div>
      <div>
        <p className="text-caption text-fg-muted mb-1">readonly</p>
        <Textarea mode="readonly" defaultValue="唯讀內容，可閱讀但不可修改" />
      </div>
      <div>
        <p className="text-caption text-fg-muted mb-1">disabled</p>
        <Textarea mode="disabled" defaultValue="停用內容，灰化" />
      </div>
    </div>
  ),
}

export const Error: Story = {
  name: 'Error 狀態',
  render: () => (
    <div className="max-w-md">
      <Textarea error defaultValue="格式不正確的內容" />
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="max-w-md flex flex-col gap-4">
      <div>
        <p className="text-caption text-fg-muted mb-1">sm / md（14px）</p>
        <Textarea size="md" defaultValue="text-body" />
      </div>
      <div>
        <p className="text-caption text-fg-muted mb-1">lg（16px）</p>
        <Textarea size="lg" defaultValue="text-body-lg" />
      </div>
    </div>
  ),
}

export const InField: Story = {
  name: '在 Field 內',
  render: () => (
    <div className="max-w-md flex flex-col gap-4">
      <Field required>
        <FieldLabel>專案說明</FieldLabel>
        <Textarea placeholder="描述這個專案的目的、時程、關鍵議題..." rows={5} />
        <FieldDescription>會顯示在專案列表的摘要欄</FieldDescription>
      </Field>

      <Field invalid>
        <FieldLabel>備註</FieldLabel>
        <Textarea defaultValue="太短了" rows={3} />
        <FieldError>備註至少 20 字</FieldError>
      </Field>

      <Field orientation="horizontal" labelWidth="120px">
        <FieldLabel>補充說明</FieldLabel>
        <Textarea placeholder="橫式 field 內的 textarea" rows={4} />
      </Field>
    </div>
  ),
}
