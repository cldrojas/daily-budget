"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

// Define available languages
export type Language = "en" | "es"

// Define translations
export const translations = {
  en: {
    // General
    appName: "Daily Budget",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",

    // Setup
    setupTitle: "Set Up Your Budget",
    setupDescription: "Enter your starting amount and end date to calculate your daily budget.",
    startingAmount: "Starting Amount",
    endDate: "End Date",
    startTracking: "Start Tracking",

    // Dashboard
    dailyBudget: "Daily Budget",
    budgetForToday: "Your budget for today",
    dailyAllowance: "Daily Allowance",
    remainingToday: "Remaining Today",
    progress: "Progress",
    totalBudget: "Total Budget",
    remainingDays: "Remaining Days",
    days: "days",

    // Config
    budgetConfiguration: "Budget Configuration",
    updateBudgetSettings: "Update Budget Settings",
    modifyBudgetConfig: "Modify your budget configuration",
    updateSettings: "Update Settings",
    cancel: "Cancel",

    // Tabs
    expenses: "Expenses",
    transfer: "Transfer",
    accounts: "Accounts",
    history: "History",

    // Expense Form
    addExpense: "Add Expense",
    addExpenseDescription: "Add a new expense to your budget",
    amount: "Amount",
    description: "Description",
    account: "Account",
    selectAccount: "Select account",
    expenseExceedsWarning: "This expense exceeds your remaining daily budget.",
    whatExpenseFor: "What's this expense for?",
    unnamedExpense: "Unnamed Expense",
    recentExpenses: "Recent Expenses",
    recentExpensesDescription: "Your most recent expenses",
    noExpenses: "No expenses yet",

    // Transfer Form
    transferFunds: "Transfer Funds",
    transferDescription: "Move money between your accounts",
    fromAccount: "From Account",
    toAccount: "To Account",
    selectSourceAccount: "Select source account",
    selectDestinationAccount: "Select destination account",
    whatTransferFor: "What's this transfer for?",

    // Accounts
    addNewAccount: "Add New Account",
    createNewAccount: "Create a new account to track different funds",
    accountName: "Account Name",
    accountType: "Account Type",
    selectAccountType: "Select account type",
    createAccount: "Create Account",
    editAccount: "Edit Account",
    editAccountDescription: "Modify account name and icon",
    accountIcon: "Account Icon",
    accountNamePlaceholder: "Enter account name",
    saveChanges: "Save Changes",
    accountUpdated: "Account updated",
    accountUpdatedDescription: "The account {name} has been updated.",
    deleteAccount: "Delete Account",
    deleteAccountConfirmation: "Are you sure you want to delete the account '{name}'? This action cannot be undone.",
    deleteAccountBalance: "The balance of {balance} will be transferred to your {savings} account.",
    delete: "Delete",
    accountDeleted: "Account deleted",
    accountDeletedDescription: "The account {name} has been deleted.",

    // Account Types
    daily: "Daily Budget",
    savings: "Savings",
    investment: "Investment",
    expense: "Expense",

    // Transaction History
    transactionHistory: "Transaction History",
    transactionDescription: "A list of all your recent transactions",
    date: "Date",
    noTransactions: "No transactions yet",

    // Toasts
    expenseAdded: "Expense added",
    expenseAddedDescription: "{amount} has been added to your expenses.",
    invalidAmount: "Invalid amount",
    invalidAmountDescription: "Please enter a valid amount",
    accountAdded: "Account added",
    accountAddedDescription: "{name} account has been created.",
    invalidAccountName: "Invalid account name",
    invalidAccountNameDescription: "Please enter a valid account name",
    missingAccounts: "Missing accounts",
    missingAccountsDescription: "Please select both from and to accounts",
    invalidTransfer: "Invalid transfer",
    invalidTransferDescription: "Cannot transfer to the same account",
    insufficientFunds: "Insufficient funds",
    insufficientFundsDescription: "Not enough balance in {account}",
    transferComplete: "Transfer complete",
    transferCompleteDescription: "{amount} has been transferred successfully.",
    missingInformation: "Missing information",
    missingInformationDescription: "Please fill in all required fields",
    configUpdated: "Configuration updated",
    configUpdatedDescription: "Your budget settings have been updated.",

    // Date picker
    pickDate: "Pick a date",
  },
  es: {
    // General
    appName: "Presupuesto Diario",
    darkMode: "Modo Oscuro",
    lightMode: "Modo Claro",

    // Setup
    setupTitle: "Configura tu Presupuesto",
    setupDescription: "Ingresa tu monto inicial y fecha final para calcular tu presupuesto diario.",
    startingAmount: "Monto Inicial",
    endDate: "Fecha Final",
    startTracking: "Comenzar Seguimiento",

    // Dashboard
    dailyBudget: "Presupuesto Diario",
    budgetForToday: "Tu presupuesto para hoy",
    dailyAllowance: "Asignación Diaria",
    remainingToday: "Restante Hoy",
    progress: "Progreso",
    totalBudget: "Presupuesto Total",
    remainingDays: "Días Restantes",
    days: "días",

    // Config
    budgetConfiguration: "Configuración de Presupuesto",
    updateBudgetSettings: "Actualizar Configuración",
    modifyBudgetConfig: "Modifica la configuración de tu presupuesto",
    updateSettings: "Actualizar Configuración",
    cancel: "Cancelar",

    // Tabs
    expenses: "Gastos",
    transfer: "Transferir",
    accounts: "Cuentas",
    history: "Historial",

    // Expense Form
    addExpense: "Agregar Gasto",
    addExpenseDescription: "Agrega un nuevo gasto a tu presupuesto",
    amount: "Monto",
    description: "Descripción",
    account: "Cuenta",
    selectAccount: "Seleccionar cuenta",
    expenseExceedsWarning: "Este gasto excede tu presupuesto diario restante.",
    whatExpenseFor: "¿Para qué es este gasto?",
    unnamedExpense: "Gasto sin nombre",
    recentExpenses: "Gastos Recientes",
    recentExpensesDescription: "Tus gastos más recientes",
    noExpenses: "Aún no hay gastos",

    // Transfer Form
    transferFunds: "Transferir Fondos",
    transferDescription: "Mueve dinero entre tus cuentas",
    fromAccount: "Desde Cuenta",
    toAccount: "A Cuenta",
    selectSourceAccount: "Seleccionar cuenta origen",
    selectDestinationAccount: "Seleccionar cuenta destino",
    whatTransferFor: "¿Para qué es esta transferencia?",

    // Accounts
    addNewAccount: "Agregar Nueva Cuenta",
    createNewAccount: "Crea una nueva cuenta para seguir diferentes fondos",
    accountName: "Nombre de Cuenta",
    accountType: "Tipo de Cuenta",
    selectAccountType: "Seleccionar tipo de cuenta",
    createAccount: "Crear Cuenta",
    editAccount: "Editar Cuenta",
    editAccountDescription: "Modificar nombre e icono de la cuenta",
    accountIcon: "Icono de Cuenta",
    accountNamePlaceholder: "Ingresa nombre de cuenta",
    saveChanges: "Guardar Cambios",
    accountUpdated: "Cuenta actualizada",
    accountUpdatedDescription: "La cuenta {name} ha sido actualizada.",
    deleteAccount: "Eliminar Cuenta",
    deleteAccountConfirmation:
      "¿Estás seguro de que deseas eliminar la cuenta '{name}'? Esta acción no se puede deshacer.",
    deleteAccountBalance: "El saldo de {balance} será transferido a tu cuenta de {savings}.",
    delete: "Eliminar",
    accountDeleted: "Cuenta eliminada",
    accountDeletedDescription: "La cuenta {name} ha sido eliminada.",

    // Account Types
    daily: "Presupuesto Diario",
    savings: "Ahorros",
    investment: "Inversión",
    expense: "Gasto",

    // Transaction History
    transactionHistory: "Historial de Transacciones",
    transactionDescription: "Una lista de todas tus transacciones recientes",
    date: "Fecha",
    noTransactions: "Aún no hay transacciones",

    // Toasts
    expenseAdded: "Gasto agregado",
    expenseAddedDescription: "{amount} ha sido agregado a tus gastos.",
    invalidAmount: "Monto inválido",
    invalidAmountDescription: "Por favor ingresa un monto válido",
    accountAdded: "Cuenta agregada",
    accountAddedDescription: "La cuenta {name} ha sido creada.",
    invalidAccountName: "Nombre de cuenta inválido",
    invalidAccountNameDescription: "Por favor ingresa un nombre de cuenta válido",
    missingAccounts: "Faltan cuentas",
    missingAccountsDescription: "Por favor selecciona ambas cuentas origen y destino",
    invalidTransfer: "Transferencia inválida",
    invalidTransferDescription: "No se puede transferir a la misma cuenta",
    insufficientFunds: "Fondos insuficientes",
    insufficientFundsDescription: "No hay suficiente saldo en {account}",
    transferComplete: "Transferencia completa",
    transferCompleteDescription: "{amount} ha sido transferido exitosamente.",
    missingInformation: "Falta información",
    missingInformationDescription: "Por favor completa todos los campos requeridos",
    configUpdated: "Configuración actualizada",
    configUpdatedDescription: "La configuración de tu presupuesto ha sido actualizada.",

    // Date picker
    pickDate: "Seleccionar fecha",
  },
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
  const [language, setLanguage] = useState<Language>("es") // Default to Spanish initially

  // Effect to detect browser language on client side
  useEffect(() => {
    // Get browser language
    const browserLang = navigator.language.split("-")[0].toLowerCase()
    // Check if browser language is supported
    if (browserLang === "en" || browserLang === "es") {
      setLanguage(browserLang as Language)
    }
  }, [])

  // Function to get translation
  const t = (key: string, params?: Record<string, string | number>) => {
    const translation = translations[language][key] || key

    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
        return acc.replace(`{${paramKey}}`, String(paramValue))
      }, translation)
    }

    return translation
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

// Custom hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
