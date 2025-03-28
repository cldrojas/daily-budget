import { BudgetTracker } from "@/components/budget-tracker"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Daily Budget Tracker</h1>
        <ThemeToggle />
      </div>
      <BudgetTracker />
    </main>
  )
}

