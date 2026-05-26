import { HistoryIcon, LucideProps } from 'lucide-react'
import { TabsTrigger } from './ui/tabs'
import { ForwardRefExoticComponent, RefAttributes } from 'react'

interface CustomTabTriggerProps {
  title: string
  logo?: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >
  value: string
}

export const CustomTabTrigger = ({
  title,
  logo,
  value
}: CustomTabTriggerProps) => {
  return (
    <TabsTrigger
      className="gap-2 min-h-full"
      value={value}
    >
      {logo && <HistoryIcon size={16}></HistoryIcon>}
      {/** TODO: customize passing down lucide icons */}
      {title}
    </TabsTrigger>
  )
}
