// src/types/index.ts

export type Page =
  | 'overview'
  | 'onboarding'
  | 'bulk'
  | 'clients'
  | 'lender'
  | 'analytics'
  | 'backoffice'

export interface StaffProfile {
  id: string
  name: string
  role: string
  branch: string
  enrollmentDate: string
  phone: string
  photo?: string
  email: string
}

export interface Alert {
  id: string
  type: 'info' | 'warning' | 'danger' | 'success'
  message: string
  time: string
  read: boolean
}

export interface StatCard {
  label: string
  nbClients: number
  faceValue: number
  changePercent: number
  icon: string
}

export interface Client {
  id: string
  name: string
  gender: 'M' | 'F'
  age: number
  phone: string
  segment: 1 | 2 | 3 | 4 | 5
  score: number
  branch: string
  activeSince: string
  loanEligible: boolean
  status: 'active' | 'inactive' | 'pending'
  category: string
  operator: string
}

export interface Loan {
  id: string
  clientId: string
  amount: number
  outstanding: number
  disbursementDate: string
  maturityDate: string
  status: 'active' | 'overdue' | 'closed' | 'default'
  installment: number
  cycle: number
  par: 0 | 60 | 90
}

export interface Transaction {
  id: string
  clientId: string
  date: string
  cashIn: number
  cashOut: number
  description: string
  status: 'completed' | 'pending' | 'failed'
}

export interface LenderProgram {
  id: string
  name: string
  productType: string
  participants: number
  disbursed: number
  outstanding: number
  segment: number
  volatility: 'low' | 'medium' | 'high'
  activeSince: string
  maturityDate: string
  status: 'active' | 'closed'
}

export type FilterState = {
  clientId: string
  score: string
  segment: string
  category: string
  branch: string
  phone: string
  operator: string
}

export interface ChartDataPoint {
  month: string
  disbursed: number
  outstanding: number
  collected: number
  defaults: number
}
