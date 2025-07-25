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
    cancel: 'Cancel',

    // Tabs
    expenses: 'Expenses',
    transfer: 'Transfer',
    accounts: 'Accounts',
    history: 'History',

    // Expense Form
    addIncome: 'Add Income',
    addIncomeDescription: 'Record a new income',
    addExpense: 'Add Expense',
    addExpenseDescription: 'Record a new expense',
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
    cancel: 'Cancelar',

    // Tabs
    expenses: 'Gastos',
    transfer: 'Transferencias',
    accounts: 'Cuentas',
    history: 'Historial',

    // Expense Form
    addIncome: 'Agregar ingreso',
    addIncomeDescription: 'Registra un nuevo ingreso',
    addExpense: 'Agregar gasto',
    addExpenseDescription: 'Registra un nuevo gasto',
    amount: 'Monto',
    description: 'Descripción',
    account: 'Cuenta',
    selectAccount: 'Selecciona una cuenta',
    expenseExceedsWarning: 'Este gasto excede tu presupuesto diario.',
    whatExpenseFor: '¿Para qué es este gasto?',
    unnamedExpense: 'Gasto sin nombre',
    recentExpenses: 'Gastos recientes',
    recentExpensesDescription: 'Tus gastos más recientes',
    noExpenses: 'Aún no hay gastos',

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
  // Detect browser language on client side
  const [language, setLanguage] = useState<Language>('es') // Default to Spanish initially

  // Effect to detect browser language on client side
  useEffect(() => {
    // Get browser language
    const browserLang = navigator.language.split('-')[0].toLowerCase()
    // Check if browser language is supported
    if (browserLang === 'en' || browserLang === 'es') {
      setLanguage(browserLang as Language)
    }
  }, [])

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
