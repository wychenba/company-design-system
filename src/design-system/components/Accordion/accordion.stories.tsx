import type { Meta, StoryObj } from '@storybook/react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './accordion'

const meta: Meta<typeof Accordion> = {
  title: 'Design System/Components/Accordion/展示',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '垂直堆疊、可收合的多區塊容器——適合 FAQ、設定分組、進階選項可隱藏等情境。基於 Radix Accordion,視覺套用本 DS token。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Accordion>

// ── Default — 最 minimal 結構展示 ─────────

export const Default: Story = {
  name: '預設',
  render: () => (
    <div className="max-w-[480px]">
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>第一個區塊</AccordionTrigger>
          <AccordionContent>展開內容區。</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>第二個區塊</AccordionTrigger>
          <AccordionContent>另一段內容。</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

// ── States — closed / open / disabled 並列 ─────────

export const States: Story = {
  name: '狀態',
  render: () => (
    <div className="max-w-[480px]">
      <Accordion type="multiple" defaultValue={['shipping']}>
        <AccordionItem value="account">
          <AccordionTrigger>付款方式如何更新?</AccordionTrigger>
          <AccordionContent>帳戶設定 → 付款 → 新增信用卡。支援 Visa / Mastercard / JCB。</AccordionContent>
        </AccordionItem>
        <AccordionItem value="shipping">
          <AccordionTrigger>國際運費如何計算?</AccordionTrigger>
          <AccordionContent>依目的地、重量、體積三項計算。亞太區一律免運(滿 NTD 2,000),其他地區依物流商報價。</AccordionContent>
        </AccordionItem>
        <AccordionItem value="enterprise" disabled>
          <AccordionTrigger>企業方案客製化(僅企業帳戶可用)</AccordionTrigger>
          <AccordionContent>升級企業方案後解鎖。請聯絡業務:enterprise@example.com</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

// ── FAQ(single + collapsible)——Stripe / Notion 類說明頁 ─────────

export const FAQ: Story = {
  name: 'FAQ 常見問題',
  render: () => (
    <div className="max-w-[640px]">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>如何更改我的訂閱方案?</AccordionTrigger>
          <AccordionContent>
            你可以在「設定 → 帳單」頁面升級或降級方案。升級立即生效,按比例計費;降級於下一個帳單週期生效,目前週期維持原方案。
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>企業方案支援 SSO 嗎?</AccordionTrigger>
          <AccordionContent>
            企業方案支援 SAML 2.0 單一登入,整合 Okta、Azure AD、Google Workspace 等主流 IdP。詳細設定步驟請參考企業管理員文件。
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>資料可以匯出嗎?</AccordionTrigger>
          <AccordionContent>
            可以。所有方案皆支援 CSV / JSON 匯出;企業方案另支援 API 批次匯出與 webhook 即時同步。
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>取消訂閱後資料會保留多久?</AccordionTrigger>
          <AccordionContent>
            取消後資料保留 90 天供復用。期滿後永久刪除,請於期限內匯出。企業方案可延長保留期至 180 天。
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

// ── Settings sections(multiple)——Jira / Linear 類設定頁 ──────────

export const SettingsSections: Story = {
  name: '設定分組',
  render: () => (
    <div className="max-w-[640px]">
      <Accordion type="multiple" defaultValue={['notifications']}>
        <AccordionItem value="general">
          <AccordionTrigger>一般設定</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2 text-body text-fg-secondary">
              <p>工作區名稱:Acme Design Team</p>
              <p>時區:台北(UTC+8)</p>
              <p>預設語言:繁體中文</p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="notifications">
          <AccordionTrigger>通知偏好</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2 text-body text-fg-secondary">
              <p>Email 每日摘要:開啟</p>
              <p>桌面即時通知:關閉</p>
              <p>@提及我時:立即通知</p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="security">
          <AccordionTrigger>安全與登入</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2 text-body text-fg-secondary">
              <p>兩步驟驗證:已啟用(Authenticator)</p>
              <p>登入工作階段:3 個裝置</p>
              <p>最近登入:2 小時前(Chrome on macOS)</p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="billing">
          <AccordionTrigger>帳單與付款</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2 text-body text-fg-secondary">
              <p>目前方案:Team(月付 NT$480 / 每位使用者)</p>
              <p>下次扣款:2026/05/19</p>
              <p>付款方式:Visa **** 4242</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

// ── 進階選項可隱藏 ───────────────────────────────────────────────

export const AdvancedOptions: Story = {
  name: '進階選項可隱藏',
  render: () => (
    <div className="max-w-[640px] flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-body font-medium text-foreground">專案名稱</label>
        <input
          className="h-field-md border border-border rounded-md px-3 text-body"
          defaultValue="Q2 發布計畫"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-body font-medium text-foreground">專案描述</label>
        <input
          className="h-field-md border border-border rounded-md px-3 text-body"
          placeholder="一句話描述此專案"
        />
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced">
          <AccordionTrigger>進階選項</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-body text-foreground">專案識別碼(選填)</label>
                <input
                  className="h-field-md border border-border rounded-md px-3 text-body font-mono"
                  placeholder="例:Q2-RELEASE"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-body text-foreground">預設檢視模式</label>
                <input
                  className="h-field-md border border-border rounded-md px-3 text-body"
                  defaultValue="看板"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}
