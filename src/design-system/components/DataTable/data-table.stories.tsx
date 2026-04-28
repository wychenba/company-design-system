import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { createColumnHelper } from '@tanstack/react-table'
import { Pencil, Trash2, MoreVertical, Search, Filter, Eye, Download } from 'lucide-react'
import { DataTable } from './data-table'
import { Button } from '@/design-system/components/Button/button'
import { Empty } from '@/design-system/components/Empty/empty'
import { Input } from '@/design-system/components/Input/input'
import { BulkActionBar } from '@/design-system/components/BulkActionBar/bulk-action-bar'
import { Alert } from '@/design-system/components/Alert/alert'
import './column-types' // ColumnMeta declaration merging

// ── Sample Data ──────────────────────────────────────────────────────────────

interface Product {
  sku: string
  name: string
  category: string
  stock: string
  seller: { name: string; avatarUrl: string }
  updatedAt: string
  price?: number
  note?: string
}

const sampleData: Product[] = [
  { sku: 'PRD-001', name: 'Wireless Bluetooth Headphones', category: 'Electronics', stock: 'In stock', seller: { name: 'Alice Wonderland Wang', avatarUrl: 'https://i.pravatar.cc/40?u=alice' }, updatedAt: '2025/03/12', price: 2490 },
  { sku: 'PRD-002', name: 'Ergonomic Office Chair with Lumbar Support', category: 'Furniture', stock: 'Low stock', seller: { name: 'Bob Christopher Chen', avatarUrl: 'https://i.pravatar.cc/40?u=bob' }, updatedAt: '2025/03/14', price: 8900 },
  { sku: 'PRD-003', name: 'Organic Green Tea 100 Bags', category: 'Food', stock: 'In stock', seller: { name: 'Carol Liu', avatarUrl: 'https://i.pravatar.cc/40?u=carol' }, updatedAt: '2025/03/15', price: 350 },
  { sku: 'PRD-004', name: 'USB-C Hub 7-in-1 Adapter', category: 'Electronics', stock: 'Out of stock', seller: { name: 'Alexander Hamilton Zhang', avatarUrl: 'https://i.pravatar.cc/40?u=alex' }, updatedAt: '2025/03/16', price: 1290 },
  { sku: 'PRD-005', name: 'Stainless Steel Water Bottle 750ml', category: 'Lifestyle', stock: 'In stock', seller: { name: 'David Wu', avatarUrl: 'https://i.pravatar.cc/40?u=david' }, updatedAt: '2025/03/18', price: 680 },
  { sku: 'PRD-006', name: 'Mechanical Keyboard with Cherry MX Brown Switches and RGB Backlight', category: 'Electronics', stock: 'In stock', seller: { name: 'Elizabeth Montgomery Johnson', avatarUrl: 'https://i.pravatar.cc/40?u=elizabeth' }, updatedAt: '2025/03/20', price: 3200 },
]

const dataWithNotes: Product[] = sampleData.map((p, i) => ({
  ...p,
  note: i % 2 === 0
    ? 'This product requires special packaging for international shipping. Please verify customs documentation before dispatch.'
    : 'Standard delivery.',
}))

function generateLargeData(count: number): Product[] {
  const categories = ['Electronics', 'Furniture', 'Food', 'Lifestyle']
  const stocks = ['In stock', 'Low stock', 'Out of stock', 'Pre-order']
  const sellers = [
    { name: 'Alice Wang', avatarUrl: 'https://i.pravatar.cc/40?u=alice' },
    { name: 'Bob Chen', avatarUrl: 'https://i.pravatar.cc/40?u=bob' },
    { name: 'Carol Liu', avatarUrl: 'https://i.pravatar.cc/40?u=carol' },
    { name: 'David Wu', avatarUrl: 'https://i.pravatar.cc/40?u=david' },
  ]
  return Array.from({ length: count }, (_, i) => ({
    sku: `PRD-${String(i + 1).padStart(4, '0')}`,
    name: `Product item ${i + 1} — ${categories[i % 4]}`,
    category: categories[i % 4],
    stock: stocks[i % 4],
    seller: sellers[i % 4],
    updatedAt: `2025/03/${String(1 + (i % 28)).padStart(2, '0')}`,
    price: Math.round(100 + Math.random() * 9900),
  }))
}

// ── Column Definitions ───────────────────────────────────────────────────────

const col = createColumnHelper<Product>()

const baseColumns = [
  col.accessor('sku', { header: 'SKU', size: 100, minSize: 80, meta: { type: 'string' } }),
  col.accessor('name', { header: 'Product', size: 280, minSize: 120, meta: { type: 'string' } }),
  col.accessor('category', { header: 'Category', size: 120, meta: { type: 'select' } }),
  col.accessor('stock', { header: 'Stock', size: 110, meta: { type: 'select' } }),
  col.accessor('seller', { header: 'Seller', size: 150, meta: { type: 'person' } }),
  col.accessor('updatedAt', { header: 'Updated', size: 120, meta: { type: 'date' } }),
]

const columnsWithPrice = [
  ...baseColumns,
  col.accessor('price', {
    header: 'Price',
    size: 120,
    meta: { type: 'currency', prefix: '$' },
  }),
]

const columnsWithNote = [
  col.accessor('sku', { header: 'SKU', size: 100, meta: { type: 'string' } }),
  col.accessor('name', { header: 'Product', size: 200, meta: { type: 'string' } }),
  col.accessor('note', {
    header: 'Note',
    size: 300,
    meta: { type: 'string', wrap: true },
  }),
  col.accessor('category', { header: 'Category', size: 120, meta: { type: 'select' } }),
  col.accessor('seller', { header: 'Seller', size: 150, meta: { type: 'person' } }),
]

// ── Stories ───────────────────────────────────────────────────────────────────

const meta: Meta<typeof DataTable> = {
  title: 'Design System/Components/DataTable/展示',
  component: DataTable as any,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '基於 TanStack Table 的資料表格，支援虛擬捲動、排序、多種尺寸。',
      },
    },
  },
}

export default meta
type Story = StoryObj

/* ── Column Types ── */
export const ColumnTypes: Story = {
  name: 'Column Types',
  render: () => {
    interface TypeDemo {
      name: string
      quantity: number
      price: number
      date: string
      active: boolean
      status: string
      tags: string[]
      seller: { name: string; avatarUrl: string }
      url: string
    }

    const typeCol = createColumnHelper<TypeDemo>()
    const statusOptions = [
      { value: 'in_stock', label: 'In stock' },
      { value: 'low_stock', label: 'Low stock' },
      { value: 'out_of_stock', label: 'Out of stock' },
    ]
    const tagOptions = [
      { value: 'electronics', label: 'Electronics' },
      { value: 'lifestyle', label: 'Lifestyle' },
      { value: 'food', label: 'Food' },
    ]
    const typeCols = [
      typeCol.accessor('name', { header: 'Text', size: 160, meta: { type: 'string' } }),
      typeCol.accessor('quantity', { header: 'Number', size: 90, meta: { type: 'number' } }),
      typeCol.accessor('price', { header: 'Currency', size: 100, meta: { type: 'currency', prefix: '$' } }),
      typeCol.accessor('date', { header: 'Date', size: 110, meta: { type: 'date' } }),
      typeCol.accessor('active', { header: 'Boolean', size: 80, meta: { type: 'boolean' } }),
      typeCol.accessor('status', { header: 'Select', size: 110, meta: { type: 'select', options: statusOptions } }),
      typeCol.accessor('tags', { header: 'MultiSelect', size: 180, meta: { type: 'multiSelect', options: tagOptions } }),
      typeCol.accessor('seller', { header: 'Person', size: 140, meta: { type: 'person' } }),
      typeCol.accessor('url', { header: 'Link', size: 160, meta: { type: 'url' } }),
    ]
    const typeData: TypeDemo[] = [
      { name: 'Wireless Headphones', quantity: 142, price: 2490, date: '2025-03-12', active: true, status: 'in_stock', tags: ['electronics', 'lifestyle'], seller: { name: 'Alice Wang', avatarUrl: 'https://i.pravatar.cc/40?u=alice' }, url: 'https://example.com/headphones' },
      { name: 'Office Chair', quantity: 38, price: 8900, date: '2025-03-14', active: false, status: 'low_stock', tags: ['lifestyle'], seller: { name: 'Bob Chen', avatarUrl: 'https://i.pravatar.cc/40?u=bob' }, url: 'https://example.com/chair' },
      { name: 'Green Tea 100 Bags', quantity: 520, price: 350, date: '2025-03-15', active: true, status: 'in_stock', tags: ['food', 'lifestyle', 'electronics'], seller: { name: 'Carol Liu', avatarUrl: 'https://i.pravatar.cc/40?u=carol' }, url: 'https://example.com/tea' },
    ]

    return (
      <div>
        <p className="text-caption text-fg-muted mb-3">所有 9 種 column type 的自動渲染——指定 meta.type 即可，不需要自訂 cell renderer</p>
        <DataTable columns={typeCols} data={typeData} height="auto" />
      </div>
    )
  },
}

/* ── 三種尺寸 ── */
export const AllSizes: Story = {
  name: '尺寸',
  render: () => (
    <div className="flex flex-col gap-8">
      {(['sm', 'md', 'lg'] as const).map(size => (
        <div key={size}>
          <h3 className="text-body font-bold text-foreground mb-2">size="{size}"</h3>
          <DataTable columns={baseColumns} data={sampleData.slice(0, 3)} size={size} height="auto" />
        </div>
      ))}
    </div>
  ),
}

/* ── 數字靠右對齊 ── */
export const NumberAlignment: Story = {
  name: '數字靠右對齊',
  render: () => (
    <DataTable columns={columnsWithPrice} data={sampleData} height="auto" />
  ),
}

/* ── 行高模式 — autoRowHeight prop(每 row 內容驅動高度) ── */
export const RowAutoHeight: Story = {
  name: 'Row 行高 — autoRowHeight',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">固定行高（預設）</h3>
        <p className="text-caption text-fg-muted mb-3">所有內容垂直置中，文字截斷</p>
        <DataTable columns={baseColumns} data={sampleData} height="auto" />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">自動行高（autoRowHeight）</h3>
        <p className="text-caption text-fg-muted mb-3">內容頂部對齊，wrap 欄位可撐高 row</p>
        <DataTable columns={columnsWithNote} data={dataWithNotes} height="auto" autoRowHeight />
      </div>
    </div>
  ),
}

/* ── Empty State ── */
export const EmptyState: Story = {
  name: '空狀態',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">預設空狀態</h3>
        <DataTable columns={baseColumns} data={[]} />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">自訂空狀態</h3>
        <DataTable
          columns={baseColumns}
          data={[]}
          emptyState={
            <Empty title="尚無商品" description="點擊上方「新增」開始建立" />
          }
        />
      </div>
    </div>
  ),
}

/* ── Container 高度模式 — height prop(table 容器約束) ── */
// Bordered showcase retired — anatomy.BorderedProp 已 canonical 涵蓋(prop table + 何時用 false 的 rationale + 對照),showcase 純重複
export const ContainerHeight: Story = {
  name: 'Container 高度 — height prop',
  render: () => {
    const manyRows = React.useMemo(() => generateLargeData(50), [])
    return (
      <div className="flex flex-col gap-10">
        <div>
          <h3 className="text-body font-bold text-foreground mb-1">無約束</h3>
          <p className="text-caption text-fg-muted mb-3">height="auto"，table 高度完全取決於內容，不出現捲軸</p>
          <DataTable columns={baseColumns} data={sampleData} height="auto" />
        </div>

        <div>
          <h3 className="text-body font-bold text-foreground mb-1">有約束</h3>
          <p className="text-caption text-fg-muted mb-3">height="300px"，兩張 table 在同樣的高度上限內。資料少時只佔內容高度，資料多時撐到上限後出現捲軸</p>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-footnote text-fg-muted mb-3">3 筆資料</p>
              <DataTable columns={baseColumns} data={sampleData.slice(0, 3)} height="300px" />
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-footnote text-fg-muted mb-3">50 筆資料</p>
              <DataTable columns={baseColumns} data={manyRows} height="300px" />
            </div>
          </div>
        </div>
      </div>
    )
  },
}

/* ── Row Actions ── */
export const RowActions: Story = {
  name: 'Row Actions',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">Row Actions（常駐）</h3>
        <p className="text-caption text-fg-muted mb-3">actions 在獨立的右側固定欄位，常駐顯示。full-height 分隔線標示 frozen 邊界。</p>
        <DataTable
          columns={baseColumns}
          data={sampleData}
          height="auto"
          rowActions={() => (
            <>
              <Button variant="text" size="xs" iconOnly startIcon={Pencil} aria-label="編輯" />
              <Button variant="text" size="xs" iconOnly startIcon={Trash2} aria-label="刪除" />
            </>
          )}
        />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">3+ actions：MoreVertical 收納</h3>
        <p className="text-caption text-fg-muted mb-3">前 1-2 個高頻 action inline + MoreVertical dropdown</p>
        <DataTable
          columns={baseColumns}
          data={sampleData.slice(0, 3)}
          height="auto"
          rowActions={() => (
            <>
              <Button variant="text" size="xs" iconOnly startIcon={Pencil} aria-label="編輯" />
              <Button variant="text" size="xs" iconOnly startIcon={MoreVertical} aria-label="更多操作" />
            </>
          )}
        />
      </div>
    </div>
  ),
}

/* ── Pinned Columns ── */
export const PinnedColumns: Story = {
  name: 'Pinned Columns',
  render: () => {
    const manyRows = React.useMemo(() => generateLargeData(50), [])
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="text-body font-bold text-foreground mb-2">Left pinned + Row Actions（水平捲動）</h3>
          <p className="text-caption text-fg-muted mb-3">SKU 固定左側，actions 固定右側，中間水平捲動。</p>
          <div style={{ maxWidth: 700 }}>
            <DataTable
              columns={columnsWithPrice}
              data={sampleData}
              height="auto"
              pinnedLeftColumns={['sku']}
              rowActions={() => (
                <>
                  <Button variant="text" size="xs" iconOnly startIcon={Pencil} aria-label="編輯" />
                  <Button variant="text" size="xs" iconOnly startIcon={MoreVertical} aria-label="更多操作" />
                </>
              )}
            />
          </div>
        </div>
        <div>
          <h3 className="text-body font-bold text-foreground mb-2">垂直捲動 + Pinned + Row Actions</h3>
          <p className="text-caption text-fg-muted mb-3">header 固定頂部，SKU 固定左側，actions 固定右側，50 筆資料垂直捲動。</p>
          <div style={{ maxWidth: 700 }}>
            <DataTable
              columns={columnsWithPrice}
              data={manyRows}
              height="300px"
              pinnedLeftColumns={['sku']}
              rowActions={() => (
                <>
                  <Button variant="text" size="xs" iconOnly startIcon={Pencil} aria-label="編輯" />
                  <Button variant="text" size="xs" iconOnly startIcon={MoreVertical} aria-label="更多操作" />
                </>
              )}
            />
          </div>
        </div>
      </div>
    )
  },
}

/* ── Inline Edit（視覺模式）── */
export const InlineEdit: Story = {
  name: 'Inline Edit',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">Inline Edit 模式</h3>
        <p className="text-caption text-fg-muted mb-3">Cell 間有垂直分隔線，select 類欄位顯示 ChevronDown / Calendar 指示器。</p>
        <DataTable
          columns={columnsWithPrice}
          data={sampleData}
          height="auto"
          inlineEdit
          rowActions={() => (
            <>
              <Button variant="text" size="xs" iconOnly startIcon={MoreVertical} aria-label="更多操作" />
            </>
          )}
        />
      </div>
    </div>
  ),
}

/* ── 虛擬捲動（大量資料）── */
export const VirtualScroll: Story = {
  name: '虛擬捲動',
  render: () => {
    const largeData = React.useMemo(() => generateLargeData(10000), [])
    return (
      <DataTable
        columns={columnsWithPrice}
        data={largeData}
        height="500px"
        overscan={10}
      />
    )
  },
}

/* ── L2 Selection — DataTable + BulkActionBar inline composition(canonical) ──
   保留 toolbar 功能(filter / sort / search 在選取期間仍可用)— 對齊 Linear / Notion /
   Apple Mail / iOS Files / 你 ref 圖 additive 派 */
export const WithBulkActions: Story = {
  name: 'L2 Selection — 含 BulkActionBar(canonical)',
  render: () => {
    const [selection, setSelection] = React.useState<string[]>([])
    const [allSelected, setAllSelected] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const TOTAL = 5370
    const filteredData = React.useMemo(
      () => search ? sampleData.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())) : sampleData,
      [search]
    )
    const VISIBLE = filteredData.length
    const showHint = !allSelected
      ? selection.length === VISIBLE && VISIBLE > 0 && TOTAL > VISIBLE
      : true

    return (
      // 父層:純 composition area,填滿 parent 寬高(無 outer chrome)
      // 各元件獨立並排,各自 own padding canonical 自然對齊
      <div className="flex flex-col w-full h-[600px]">
        {/* Toolbar — 獨立元件,自帶 px-loose py-tight */}
        <div className="flex items-center gap-2 px-[var(--layout-space-loose)] py-[var(--layout-space-tight)] border-b border-divider bg-canvas">
          <div className="flex-1 max-w-sm">
            <Input
              size="sm"
              placeholder="搜尋商品 / SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startIcon={Search}
            />
          </div>
          <Button variant="text" size="sm" iconOnly startIcon={Filter} aria-label="篩選" />
          <Button variant="text" size="sm" iconOnly startIcon={Eye} aria-label="欄位顯示" />
          <Button variant="primary" size="sm">+ 新增商品</Button>
          <Button variant="text" size="sm" iconOnly startIcon={MoreVertical} aria-label="更多" />
        </div>

        {/* DataTable — 獨立元件,height="100%" + flex-1 撐滿剩餘空間 */}
        <DataTable
          columns={baseColumns}
          data={filteredData}
          height="100%"
          bordered={false}
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          getRowId={(row) => row.sku}
          className="flex-1 min-h-0"
        />

        {/* Alert hint banner — 獨立元件,placement=fixed 自帶 loose px(對齊周圍元素)*/}
        {showHint && (
          <Alert
            variant="info"
            placement="fixed"
            dismissible={false}
            title={
              allSelected ? (
                <>
                  已選取全部 {TOTAL} 個項目。{' '}
                  <button
                    type="button"
                    onClick={() => { setSelection([]); setAllSelected(false) }}
                    className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    清除選取項目
                  </button>
                </>
              ) : (
                <>
                  已選取本頁全部 {selection.length} 個。{' '}
                  <button
                    type="button"
                    onClick={() => setAllSelected(true)}
                    className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    點此選取全部 {TOTAL} 個項目
                  </button>
                </>
              )
            }
          />
        )}

        {/* BulkActionBar — 獨立元件,自帶 px-loose py-tight */}
        {selection.length > 0 && (
          <BulkActionBar
            className="border-t border-divider"
            selection={selection}
            onClear={() => { setSelection([]); setAllSelected(false) }}
            actions={
              <>
                <Button variant="tertiary" size="sm" startIcon={Download}>下載</Button>
                <Button variant="tertiary" size="sm" startIcon={Trash2} danger>移除</Button>
              </>
            }
          />
        )}
      </div>
    )
  },
}

/* ── L2 Selection — Shift-click + 鍵盤(Cmd+A / Esc)── */
export const SelectionKeyboardAndShift: Story = {
  name: 'L2 Selection — Shift-click 區間 + 鍵盤(Cmd+A / Esc)',
  render: () => {
    const [selection, setSelection] = React.useState<string[]>([])
    const data = generateLargeData(15)
    return (
      <div className="flex flex-col gap-2 max-w-4xl">
        <p className="text-caption text-fg-muted">
          試試:點第一 row checkbox → <kbd>Shift</kbd>+點第五 row → 1-5 全選 ·
          整 table 點任意 row 後按 <kbd>Cmd/Ctrl+A</kbd> 全選 · 按 <kbd>Esc</kbd> 清除 ·
          checkbox focus 時按 <kbd>Space</kbd> 帶 <kbd>Shift</kbd> 也能擴選。
        </p>
        <div className="text-caption font-mono text-fg-muted">selection: {JSON.stringify(selection)}</div>
        <DataTable
          columns={baseColumns}
          data={data}
          height="400px"
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          getRowId={(row) => row.sku}
        />
      </div>
    )
  },
}

/* ── L2 Selection — Single mode(每次只選一個)── */
export const SelectionSingleMode: Story = {
  name: 'L2 Selection — Single mode',
  render: () => {
    const [selection, setSelection] = React.useState<string[]>([])
    return (
      <div className="flex flex-col gap-2 max-w-4xl">
        <p className="text-caption text-fg-muted">
          <code>selectable=&quot;single&quot;</code>:每次只選一個,點新 row 自動清舊 row。
          視覺用 <strong>Radio</strong>(對齊 Material DataGrid / Polaris IndexTable 共識),
          header checkbox 抑制(single 沒「全選」概念)。
        </p>
        <div className="text-caption font-mono text-fg-muted">selected: {selection[0] ?? '(none)'}</div>
        <DataTable
          columns={baseColumns}
          data={sampleData}
          height="auto"
          selectable="single"
          selection={selection}
          onSelectionChange={setSelection}
          getRowId={(row) => row.sku}
        />
      </div>
    )
  },
}

/* ── L2 Selection — disabled rows + filter 互動 ── */
export const SelectionDisabledRows: Story = {
  name: 'L2 Selection — Disabled rows(只 disable checkbox)',
  render: () => {
    const [selection, setSelection] = React.useState<string[]>([])
    return (
      <div className="flex flex-col gap-2 max-w-4xl">
        <p className="text-caption text-fg-muted">
          Out of stock 商品不可選 — 只 disable checkbox,row 內容正常 render(對齊 spec L2 五)。
        </p>
        <DataTable
          columns={baseColumns}
          data={sampleData}
          height="auto"
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          getRowId={(row) => row.sku}
          isRowSelectable={(row) => row.stock !== 'Out of stock'}
        />
      </div>
    )
  },
}
