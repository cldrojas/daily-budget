'use client'

import { createContext, useContext, useState, type ReactNode, useEffect } from 'react'

// Define available languages
export type Language = 'en' | 'es'

// Define translations
export const translations = {
  en: {
    // General
    appName: 'Saldo Cero',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    youSure: 'Are you sure?',
    undoable: 'This action can’t be undone.',
    confirm: 'Yes, continue',

    // Setup
    setupTitle: 'Set Up Your Budget',
    setupDescription: 'Enter your starting amount and end date to calculate your daily budget.',
    startingAmount: 'Starting Amount',
    endDate: 'End Date',
    startTracking: 'Start Now',

    // Dashboard
    dailyBudget: 'Daily Budget',
    budgetForToday: 'Today’s available budget',
    dailyAllowance: 'Daily Allowance',
    remainingToday: 'Remaining Today',
    progress: 'Progress',
    totalBudget: 'Total Budget',
    remainingDays: 'Days Remaining',
    days: 'days',

    // Config
    budgetConfiguration: 'Budget Settings',
    updateBudgetSettings: 'Update Budget',
    modifyBudgetConfig: 'Adjust your budget details',
    updateSettings: 'Save Changes',
    clearData: 'Clear All Data',
    exportData: 'Export Data',
    cancel: 'Cancel',

    // Tabs
    expenses: 'Expenses',
    transfer: 'Transfer',
    accounts: 'Accounts',
    history: 'History',
    income: 'Income',

    // Transaction Form
    addIncome: 'Add Income',
    addIncomeDescription: 'Record a new income',
    addExpense: 'Add Expense',
    addExpenseDescription: 'Record a new expense',
    editTransaction: 'Edit Transaction',
    editTransactionDescription: 'Modify transaction details',
    updateTransaction: 'Update Transaction',
    amount: 'Amount',
    description: 'Description',
    account: 'Account',
    selectAccount: 'Select an account',
    expenseExceedsWarning: 'This expense exceeds today’s budget.',
    whatExpenseFor: 'What’s this expense for?',
    unnamedExpense: 'Unnamed Expense',
    recentExpenses: 'Recent Expenses',
    recentExpensesDescription: 'Your latest recorded expenses',
    noExpenses: 'No expenses yet',
    transactionType: 'Transaction Type',
    whatIncomeFor: 'What is this income for?',

    // Delete Transaction
    adjustmentDescription: 'Balance adjustment',
    deleteTransactionTitle: 'Delete transaction',
    deleteTransactionQuestion: 'What should happen to the balance?',
    deleteAndRefund: 'Delete and refund',
    deleteAndRefundDescription: 'Removes the transaction and returns the money to the account',
    deleteKeepBalance: 'Delete, keep balance',
    deleteKeepBalanceDescription: 'Removes the transaction without changing the balance',

    // Transfer Form
    transferFunds: 'Transfer Funds',
    transferDescription: 'Move money between your accounts',
    fromAccount: 'From',
    toAccount: 'To',
    selectSourceAccount: 'Choose source account',
    selectDestinationAccount: 'Choose destination account',
    whatTransferFor: 'Reason for transfer',

    // Accounts
    addNewAccount: 'Add New Account',
    createNewAccount: 'Create an account to organize your money',
    accountName: 'Account Name',
    accountType: 'Account Type',
    selectAccountType: 'Select type',
    createAccount: 'Create Account',
    editAccount: 'Edit Account',
    editAccountDescription: 'Change the name and icon of your account',
    accountIcon: 'Account Icon',
    accountNamePlaceholder: 'Enter a name',
    saveChanges: 'Save Changes',
    accountUpdated: 'Account Updated',
    accountUpdatedDescription: '{name} was updated successfully.',
    deleteAccount: 'Delete Account',
    deleteAccountConfirmation: "Delete '{name}'? This can’t be undone.",
    deleteAccountBalance: '{balance} will be moved to your {savings} account.',
    delete: 'Delete',
    accountDeleted: 'Account Deleted',
    accountDeletedDescription: '{name} has been deleted.',

    // Account Types
    daily: 'Daily Budget',
    savings: 'Savings',
    investment: 'Investment',
    expense: 'Expense',

    // Transaction History
    transactionHistory: 'Transaction History',
    transactionDescription: 'All your recent activity',
    date: 'Date',
    noTransactions: 'No transactions yet',

    // Toasts
    expenseAdded: 'Expense Added',
    expenseAddedDescription: '{amount} was added.',
    incomeAdded: 'Income Added',
    incomeAddedDescription: '{amount} was added.',
    transactionUpdated: 'Transaction Updated',
    transactionUpdatedDescription: '{amount} was updated.',
    invalidAmount: 'Invalid Amount',
    invalidAmountDescription: 'Please enter a valid number',
    accountAdded: 'Account Created',
    accountAddedDescription: 'The {name} account is now active.',
    invalidAccountName: 'Invalid Name',
    invalidAccountNameDescription: 'Please enter a valid name',
    missingAccounts: 'Accounts Missing',
    missingAccountsDescription: 'Please select both source and destination accounts',
    invalidTransfer: 'Invalid Transfer',
    invalidTransferDescription: 'Can’t transfer to the same account',
    insufficientFunds: 'Not Enough Funds',
    insufficientFundsDescription: 'Balance too low in {account}',
    transferComplete: 'Transfer Complete',
    transferCompleteDescription: '{amount} moved successfully.',
    missingInformation: 'Missing Information',
    missingInformationDescription: 'Please complete all fields',
    configUpdated: 'Budget Updated',
    configUpdatedDescription: 'Your settings were saved.',

    // Import
    import: 'Import',
    importDescription: 'Import bank transactions from your email',
    importTransactions: 'Import Transactions',
    connectGmail: 'Connect Gmail',
    disconnectGmail: 'Disconnect Gmail',
    syncEmails: 'Sync Emails',
    syncing: 'Syncing...',
    importPending: 'Pending',
    importApproved: 'Approved',
    importRejected: 'Rejected',
    importUnparsed: 'Unparsed',
    approveAll: 'Approve All',
    rejectAll: 'Reject All',
    noPendingTransactions: 'No pending transactions to review',
    importStats: 'Import Statistics',
    transactionsImported: 'Transactions Imported',
    lastSync: 'Last Sync',
    never: 'Never',
    importAccount: 'Account',
    importDescriptionLabel: 'Description',
    importAmount: 'Amount',
    importDate: 'Date',
    importSource: 'Source',
    importEdit: 'Edit',
    importApprove: 'Approve',
    importReject: 'Reject',
    importEditTitle: 'Edit Transaction',
    importSaveChanges: 'Save Changes',
    importOriginal: 'Original',
    selectTargetAccount: 'Select target account',
    gmailNotConnected: 'Gmail not connected',
    gmailConnectDescription: 'Connect your Gmail account to import bank transactions automatically.',
    gmailConnected: 'Gmail connected',
    gmailConnectedDescription: 'Your Gmail account is connected and ready to sync.',
    importNoEmails: 'No matching emails found',
    importNoEmailsDescription: 'No bank transaction emails found for the selected period.',
    importApprovedToast: 'Transaction approved',
    importApprovedDescription: 'The transaction has been added to your accounts.',
    importRejectedToast: 'Transaction rejected',
    importRejectedDescription: 'The transaction has been discarded.',
    importEditedToast: 'Transaction updated',
    importEditedDescription: 'The transaction details have been updated.',
    importEditModalDescription: 'Review and edit the transaction before approving',
    importSyncNow: 'Sync now',
    importBackToBudget: 'Back to Budget',

    // New import keys
    gmailReconnect: 'Reconnect',
    importActive: 'Active',
    importExpired: 'Expired',
    sessionExpiredReconnect: 'Session expired. Reconnect to continue.',
    processingEmails: 'Processing {current} of {total} emails...',
    searchingEmails: 'Searching for bank notifications...',
    importNoNewTransactions: 'No new transactions',
    importUpToDate: 'Everything is up to date!',
    importNoTransactions: 'No transactions imported yet',
    importSyncPrompt: 'Click "Sync Now" to fetch your latest bank notifications.',
    allBanks: 'All banks',
    unknown: 'Unknown',
    importCouldNotParse: 'Could not parse',
    importConfidence: 'Confidence',
    importEditBeforeApprove: 'Edit before approving',
    importEditAndApprove: 'Edit & Approve',
    importRawEmail: 'Raw email',
    importAmountInCents: 'Amount (in cents)',
    importCentsHint: 'Enter amount in cents (e.g., 1500 = $15.00)',
    importSaveAndApprove: 'Save & Approve',
    importNoApprovedTransactions: 'No approved transactions',
    importNoRejectedTransactions: 'No rejected transactions',
    importNoUnparsedTransactions: 'No unparsed transactions',

    // Date picker
    pickDate: 'Pick a date'
  }, es: {
    // General
    appName: 'Saldo Cero',
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    youSure: '¿Estás seguro?',
    undoable: 'Esta acción no se puede deshacer.',
    confirm: 'Sí, continuar',

    // Setup
    setupTitle: 'Configura tu presupuesto',
    setupDescription: 'Ingresa tu monto inicial y fecha final para calcular tu presupuesto diario.',
    startingAmount: 'Monto inicial',
    endDate: 'Fecha final',
    startTracking: 'Comenzar ahora',

    // Dashboard
    dailyBudget: 'Presupuesto Diario',
    budgetForToday: 'Presupuesto disponible hoy',
    dailyAllowance: 'Asignación diaria',
    remainingToday: 'Disponible hoy',
    progress: 'Progreso',
    totalBudget: 'Presupuesto total',
    remainingDays: 'Días restantes',
    days: 'días',

    // Config
    budgetConfiguration: 'Configuración de presupuesto',
    updateBudgetSettings: 'Actualizar presupuesto',
    modifyBudgetConfig: 'Ajusta los detalles de tu presupuesto',
    updateSettings: 'Guardar cambios',
    clearData: 'Borrar todos los datos',
    exportData: 'Exportar datos',
    cancel: 'Cancelar',

    // Tabs
    expenses: 'Gastos',
    transfer: 'Transferencias',
    accounts: 'Cuentas',
    history: 'Historial',
    income: 'Ingresos',

    // Transaction Form
    addIncome: 'Agregar ingreso',
    addIncomeDescription: 'Registra un nuevo ingreso',
    addExpense: 'Agregar gasto',
    addExpenseDescription: 'Registra un nuevo gasto',
    editTransaction: 'Editar transacción',
    editTransactionDescription: 'Modificar detalles de la transacción',
    updateTransaction: 'Actualizar transacción',
    amount: 'Monto',
    description: 'Descripción',
    account: 'Cuenta',
    selectAccount: 'Selecciona una cuenta',
    expenseExceedsWarning: 'Este gasto excede tu presupuesto diario.',
    whatExpenseFor: '¿Para qué es este gasto?',
    whatIncomeFor: '¿Para qué es este ingreso?',
    unnamedExpense: 'Gasto sin nombre',
    recentExpenses: 'Gastos recientes',
    recentExpensesDescription: 'Tus gastos más recientes',
    noExpenses: 'Aún no hay gastos',
    transactionType: 'Tipo de transacción',

    // Delete Transaction
    adjustmentDescription: 'Ajuste de saldo',
    deleteTransactionTitle: 'Eliminar transacción',
    deleteTransactionQuestion: '¿Qué hacer con el saldo?',
    deleteAndRefund: 'Eliminar y devolver',
    deleteAndRefundDescription: 'Elimina la transacción y devuelve el dinero a la cuenta',
    deleteKeepBalance: 'Eliminar, mantener saldo',
    deleteKeepBalanceDescription: 'Elimina la transacción sin modificar el saldo',

    // Transfer Form
    transferFunds: 'Transferir fondos',
    transferDescription: 'Mueve dinero entre tus cuentas',
    fromAccount: 'Desde',
    toAccount: 'Hacia',
    selectSourceAccount: 'Elige cuenta de origen',
    selectDestinationAccount: 'Elige cuenta de destino',
    whatTransferFor: 'Motivo de la transferencia',

    // Accounts
    addNewAccount: 'Agregar nueva cuenta',
    createNewAccount: 'Crea una cuenta para organizar tu dinero',
    accountName: 'Nombre de cuenta',
    accountType: 'Tipo de cuenta',
    selectAccountType: 'Selecciona tipo',
    createAccount: 'Crear cuenta',
    editAccount: 'Editar cuenta',
    editAccountDescription: 'Modifica el nombre e ícono de la cuenta',
    accountIcon: 'Ícono de cuenta',
    accountNamePlaceholder: 'Escribe un nombre',
    saveChanges: 'Guardar cambios',
    accountUpdated: 'Cuenta actualizada',
    accountUpdatedDescription: 'La cuenta {name} fue actualizada con éxito.',
    deleteAccount: 'Eliminar cuenta',
    deleteAccountConfirmation: "¿Eliminar '{name}'? Esta acción no se puede deshacer.",
    deleteAccountBalance: '{balance} se transferirá a tu cuenta de {savings}.',
    delete: 'Eliminar',
    accountDeleted: 'Cuenta eliminada',
    accountDeletedDescription: 'La cuenta {name} ha sido eliminada.',

    // Account Types
    daily: 'Presupuesto diario',
    savings: 'Ahorros',
    investment: 'Inversión',
    expense: 'Gasto',

    // Transaction History
    transactionHistory: 'Historial de transacciones',
    transactionDescription: 'Tu actividad financiera reciente',
    date: 'Fecha',
    noTransactions: 'Aún no hay transacciones',

    // Toasts
    expenseAdded: 'Gasto registrado',
    expenseAddedDescription: '{amount} fue agregado.',
    incomeAdded: 'Ingreso registrado',
    incomeAddedDescription: '{amount} fue registrado.',
    transactionUpdated: 'Transacción actualizada',
    transactionUpdatedDescription: '{amount} fue actualizado.',
    invalidAmount: 'Monto inválido',
    invalidAmountDescription: 'Por favor ingresa un número válido',
    accountAdded: 'Cuenta creada',
    accountAddedDescription: 'La cuenta {name} ya está activa.',
    invalidAccountName: 'Nombre inválido',
    invalidAccountNameDescription: 'Ingresa un nombre válido',
    missingAccounts: 'Faltan cuentas',
    missingAccountsDescription: 'Selecciona cuenta origen y destino',
    invalidTransfer: 'Transferencia inválida',
    invalidTransferDescription: 'No puedes transferir a la misma cuenta',
    insufficientFunds: 'Fondos insuficientes',
    insufficientFundsDescription: 'Saldo insuficiente en {account}',
    transferComplete: 'Transferencia completada',
    transferCompleteDescription: '{amount} se transfirió correctamente.',
    missingInformation: 'Falta información',
    missingInformationDescription: 'Completa todos los campos requeridos',
    configUpdated: 'Presupuesto actualizado',
    configUpdatedDescription: 'Los cambios se guardaron correctamente.',

    // Import
    import: 'Importar',
    importDescription: 'Importa transacciones bancarias desde tu correo',
    importTransactions: 'Importar transacciones',
    connectGmail: 'Conectar Gmail',
    disconnectGmail: 'Desconectar Gmail',
    syncEmails: 'Sincronizar correos',
    syncing: 'Sincronizando...',
    importPending: 'Pendientes',
    importApproved: 'Aprobadas',
    importRejected: 'Rechazadas',
    importUnparsed: 'Sin clasificar',
    approveAll: 'Aprobar todas',
    rejectAll: 'Rechazar todas',
    noPendingTransactions: 'No hay transacciones pendientes por revisar',
    importStats: 'Estadísticas de importación',
    transactionsImported: 'Transacciones importadas',
    lastSync: 'Última sincronización',
    never: 'Nunca',
    importAccount: 'Cuenta',
    importDescriptionLabel: 'Descripción',
    importAmount: 'Monto',
    importDate: 'Fecha',
    importSource: 'Origen',
    importEdit: 'Editar',
    importApprove: 'Aprobar',
    importReject: 'Rechazar',
    importEditTitle: 'Editar transacción',
    importSaveChanges: 'Guardar cambios',
    importOriginal: 'Original',
    selectTargetAccount: 'Selecciona cuenta destino',
    gmailNotConnected: 'Gmail no conectado',
    gmailConnectDescription: 'Conecta tu cuenta de Gmail para importar transacciones bancarias automáticamente.',
    gmailConnected: 'Gmail conectado',
    gmailConnectedDescription: 'Tu cuenta de Gmail está conectada y lista para sincronizar.',
    importNoEmails: 'No se encontraron correos',
    importNoEmailsDescription: 'No se encontraron correos de transacciones bancarias en el período seleccionado.',
    importApprovedToast: 'Transacción aprobada',
    importApprovedDescription: 'La transacción se agregó a tus cuentas.',
    importRejectedToast: 'Transacción rechazada',
    importRejectedDescription: 'La transacción fue descartada.',
    importEditedToast: 'Transacción actualizada',
    importEditedDescription: 'Los detalles de la transacción fueron actualizados.',
    importEditModalDescription: 'Revisa y edita la transacción antes de aprobarla',
    importSyncNow: 'Sincronizar ahora',
    importBackToBudget: 'Volver al presupuesto',

    // New import keys
    gmailReconnect: 'Reconectar',
    importActive: 'Activa',
    importExpired: 'Expirada',
    sessionExpiredReconnect: 'Sesión expirada. Reconecta para continuar.',
    processingEmails: 'Procesando {current} de {total} correos...',
    searchingEmails: 'Buscando notificaciones bancarias...',
    importNoNewTransactions: 'No hay nuevas transacciones',
    importUpToDate: 'Todo está al día',
    importNoTransactions: 'Aún no hay transacciones importadas',
    importSyncPrompt: 'Haz clic en "Sincronizar ahora" para obtener tus notificaciones bancarias.',
    allBanks: 'Todos los bancos',
    unknown: 'Desconocido',
    importCouldNotParse: 'No se pudo clasificar',
    importConfidence: 'Confianza',
    importEditBeforeApprove: 'Editar antes de aprobar',
    importEditAndApprove: 'Editar y aprobar',
    importRawEmail: 'Correo original',
    importAmountInCents: 'Monto (en centavos)',
    importCentsHint: 'Ingresa el monto en centavos (ej., 1500 = $15.00)',
    importSaveAndApprove: 'Guardar y aprobar',
    importNoApprovedTransactions: 'No hay transacciones aprobadas',
    importNoRejectedTransactions: 'No hay transacciones rechazadas',
    importNoUnparsedTransactions: 'No hay transacciones sin clasificar',

    // Date picker
    pickDate: 'Selecciona una fecha'
  }
}

// Create the context
type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Create the provider
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Get initial language from localStorage or browser language
  const getInitialLanguage = (): Language => {
    if (typeof window === 'undefined') return 'es' // SSR default

    // Check localStorage first
    const stored = localStorage.getItem('language')
    if (stored === 'en' || stored === 'es') return stored as Language

    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0].toLowerCase()
    if (browserLang === 'en' || browserLang === 'es') return browserLang as Language

    return 'es' // Final fallback
  }

  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  // Effect to save language changes to localStorage
  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  // Function to get translation
  const t = (key: string, params?: Record<string, string | number>) => {
    const translation = translations[language][key as keyof typeof translations[Language]] || key

    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
        return acc.replace(`{${paramKey}}`, String(paramValue))
      }, translation)
    }

    return translation
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// Custom hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
