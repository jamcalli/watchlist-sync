import type { ReactNode } from 'react'
import Nav from '@/components/nav'

interface WindowedLayoutProps {
  children: ReactNode
}

export default function WindowedLayout({ children }: WindowedLayoutProps) {
  return (
    <div className="outline-border dark:outline-darkBorder grid h-[800px] max-h-[100dvh] w-[95%] max-w-6xl grid-cols-[100px_auto] rounded-base shadow-[10px_10px_0_0_#000] outline outline-4 w600:grid-cols-[70px_auto] w500:grid-cols-1 portrait:w-full portrait:grid-cols-1 portrait:h-[100dvh]">
      <header className="border-r-border dark:border-r-darkBorder relative flex items-center justify-center rounded-l-base border-r-4 bg-main w500:hidden portrait:rounded-none portrait:border-r-0 portrait:border-b-4 portrait:h-[50px] portrait:border-b-border dark:portrait:border-b-darkBorder portrait:absolute portrait:w-full portrait:z-10">
        <h1 className="-rotate-90 whitespace-nowrap text-[40px] font-bold tracking-[4px] smallHeight:text-[30px] smallHeight:tracking-[2px] w600:text-[30px] w600:tracking-[2px] portrait:rotate-0 portrait:text-[30px] portrait:tracking-[2px]">
          <span className="text-text inline-block">Pulsarr</span>
        </h1>
      </header>
      <main className="dark:bg-darkBg relative flex h-[800px] max-h-[100dvh] flex-col rounded-br-base rounded-tr-base bg-bg font-semibold portrait:h-[100dvh] portrait:max-h-[100dvh] portrait:rounded-none">
        <Nav />
        <div className="main h-full max-h-[750px] overflow-y-auto portrait:max-h-[calc(100dvh-150px)] portrait:mt-0">
          {children}
        </div>
      </main>
    </div>
  )
}