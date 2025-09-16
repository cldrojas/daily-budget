export default function DailyBudgetApp() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const {
    budget,
    accounts,
    transactions,
    dailyAllowance,
    remainingToday,
    progress,
    setupBudget,
    addTransaction,
    updateTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    isSetup,
    clearData,
    transferFunds,
    updateConfig,
    getRemainingDays,
    removeTransaction
  } = useBudget()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-bold">{t('appName')}</h1>
          <div className="flex items-center space-x-2">
            <LanguageCurrencySelector />
            <Button
              variant="default"
              size="default"
              onClick={() => console.log(JSON.stringify(budget, null, 2))}
              title={'Debug log'}
            >TEST?</Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:py-10 space-y-8">
        {!isSetup ? (
          <SetupForm onSetup={setupBudget} />
        ) : (
          <>
            <DailyBudgetStatus
              dailyAllowance={dailyAllowance}
              remainingToday={remainingToday}
              progress={progress}
              accounts={accounts}
              remainingDays={getRemainingDays()}
            />

            <div className="mt-6">
              <ConfigForm
                budget={budget}
                onUpdateConfig={updateConfig}
                onClearData={clearData}
              />
            </div>

            <Tabs defaultValue="accounts">
              <TabsList className="grid w-full grid-cols-4">
                {/* TODO: add a way to reorder tabs (drag&drop) */}
                <TabsTrigger value="accounts">{t('accounts')}</TabsTrigger>
                <TabsTrigger value="expenses">{t('expenses')}</TabsTrigger>
                <TabsTrigger value="transfer">{t('transfer')}</TabsTrigger>
                <TabsTrigger value="history">{t('history')}</TabsTrigger>
              </TabsList>
              <TabsContent
                value="expenses"
                className="mt-6"
              >
                <TransactionList
                  transactions={transactions}
                  onDelete={removeTransaction}
                  openTransactionModal={(transactionId: string) => {
                    const transaction = transactions.find(t => t.id === transactionId)
                    setEditingTransaction(transaction || null)
                    setIsTransactionModalOpen(true)
                  }}
                />
              </TabsContent>
              <TabsContent
                value="transfer"
                className="mt-6"
              >
                <TransferForm
                  accounts={accounts}
                  onTransfer={transferFunds}
                />
              </TabsContent>
              <TabsContent
                value="accounts"
                className="mt-6"
              >
                <AccountsList
                  accounts={accounts}
                  onAddAccount={addAccount}
                  onUpdateAccount={updateAccount}
                  onDeleteAccount={deleteAccount}
                />
              </TabsContent>
              <TabsContent
                value="history"
                className="mt-6"
              >
                <TransactionHistory transactions={transactions} />
              </TabsContent>
            </Tabs>

            {/* Floating Action Button for adding expenses */}
            <Button
              className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
              onClick={() => {
                setEditingTransaction(null)
                setIsTransactionModalOpen(true)
              }}
              title={t('addExpense')}
            >
              <Plus className="h-6 w-6" />
            </Button>

            <AddButton />

            {/* Expense Modal */}
            <TransactionModal
              isOpen={isTransactionModalOpen}
              onClose={() => {
                setIsTransactionModalOpen(false)
                setEditingTransaction(null)
              }}
              onAddTransaction={addTransaction}
              onUpdateTransaction={updateTransaction}
              accounts={accounts}
              remainingToday={remainingToday}
              transaction={editingTransaction}
            />
          </>
        )}
      </main>
    </div>
  )
}