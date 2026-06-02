import React from 'react'
import ReactDOM from 'react-dom/client'
import './globals.css'
import { TooltipProvider } from '@/design-system/components/Tooltip/tooltip'
import { EsimApp } from './explorations/esim-activation/EsimApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={500} skipDelayDuration={300}>
      <EsimApp />
    </TooltipProvider>
  </React.StrictMode>,
)
