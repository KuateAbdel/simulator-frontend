// src/data/mockData.ts
import type { Client, Loan, Transaction, LenderProgram, ChartDataPoint } from '../types'

export const MOCK_CLIENTS: Client[] = [
  { id: 'CLI-001', name: 'Aminata Diallo', gender: 'F', age: 34, phone: '+221 77 123 4567', segment: 4, score: 82, branch: 'Dakar Centre', activeSince: '2021-03-15', loanEligible: true, status: 'active', category: 'Retail', operator: 'Orange' },
  { id: 'CLI-002', name: 'Moussa Koné', gender: 'M', age: 42, phone: '+221 76 234 5678', segment: 3, score: 65, branch: 'Thiès', activeSince: '2020-07-20', loanEligible: true, status: 'active', category: 'SME', operator: 'MTN' },
  { id: 'CLI-003', name: 'Fatou Mbaye', gender: 'F', age: 28, phone: '+221 78 345 6789', segment: 5, score: 91, branch: 'Saint-Louis', activeSince: '2022-01-10', loanEligible: true, status: 'active', category: 'Retail', operator: 'Free' },
  { id: 'CLI-004', name: 'Ibrahima Sow', gender: 'M', age: 55, phone: '+221 77 456 7890', segment: 2, score: 48, branch: 'Ziguinchor', activeSince: '2019-11-05', loanEligible: false, status: 'inactive', category: 'Agriculture', operator: 'Orange' },
  { id: 'CLI-005', name: 'Rokhaya Ndiaye', gender: 'F', age: 31, phone: '+221 76 567 8901', segment: 4, score: 78, branch: 'Dakar Nord', activeSince: '2021-09-22', loanEligible: true, status: 'active', category: 'SME', operator: 'MTN' },
  { id: 'CLI-006', name: 'Cheikh Faye', gender: 'M', age: 47, phone: '+221 78 678 9012', segment: 1, score: 31, branch: 'Kaolack', activeSince: '2018-04-03', loanEligible: false, status: 'inactive', category: 'Agriculture', operator: 'Expresso' },
  { id: 'CLI-007', name: 'Mariama Balde', gender: 'F', age: 25, phone: '+221 77 789 0123', segment: 5, score: 95, branch: 'Dakar Centre', activeSince: '2023-02-14', loanEligible: true, status: 'pending', category: 'Retail', operator: 'Orange' },
  { id: 'CLI-008', name: 'Ousmane Diop', gender: 'M', age: 39, phone: '+221 76 890 1234', segment: 3, score: 61, branch: 'Thiès', activeSince: '2020-12-01', loanEligible: true, status: 'active', category: 'SME', operator: 'Free' },
]

export const MOCK_LOANS: Loan[] = [
  { id: 'LN-0001', clientId: 'CLI-001', amount: 5000, outstanding: 2100, disbursementDate: '2024-01-15', maturityDate: '2025-01-15', status: 'active', installment: 450, cycle: 3, par: 0 },
  { id: 'LN-0002', clientId: 'CLI-002', amount: 12000, outstanding: 9800, disbursementDate: '2024-03-01', maturityDate: '2025-09-01', status: 'overdue', installment: 800, cycle: 2, par: 60 },
  { id: 'LN-0003', clientId: 'CLI-003', amount: 3500, outstanding: 350, disbursementDate: '2023-11-10', maturityDate: '2024-11-10', status: 'active', installment: 310, cycle: 1, par: 0 },
  { id: 'LN-0004', clientId: 'CLI-005', amount: 8000, outstanding: 6500, disbursementDate: '2024-02-20', maturityDate: '2025-08-20', status: 'overdue', installment: 650, cycle: 2, par: 90 },
  { id: 'LN-0005', clientId: 'CLI-007', amount: 2000, outstanding: 2000, disbursementDate: '2024-04-01', maturityDate: '2025-04-01', status: 'active', installment: 180, cycle: 1, par: 0 },
  { id: 'LN-0006', clientId: 'CLI-008', amount: 15000, outstanding: 12000, disbursementDate: '2024-01-05', maturityDate: '2026-01-05', status: 'active', installment: 700, cycle: 4, par: 0 },
]

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TXN-001', clientId: 'CLI-001', date: '2024-04-10', cashIn: 1200, cashOut: 0, description: 'Loan repayment', status: 'completed' },
  { id: 'TXN-002', clientId: 'CLI-001', date: '2024-04-05', cashIn: 0, cashOut: 500, description: 'Cash withdrawal', status: 'completed' },
  { id: 'TXN-003', clientId: 'CLI-002', date: '2024-04-08', cashIn: 800, cashOut: 0, description: 'Monthly installment', status: 'completed' },
  { id: 'TXN-004', clientId: 'CLI-003', date: '2024-04-12', cashIn: 3500, cashOut: 0, description: 'Disbursement', status: 'completed' },
  { id: 'TXN-005', clientId: 'CLI-005', date: '2024-04-01', cashIn: 0, cashOut: 8000, description: 'Loan disbursement', status: 'completed' },
]

export const MOCK_LENDER_PROGRAMS: LenderProgram[] = [
  { id: 'LP-001', name: 'Programme Agriculture', productType: 'Micro-Finance', participants: 145, disbursed: 320000, outstanding: 187000, segment: 3, volatility: 'medium', activeSince: '2022-01-01', maturityDate: '2025-12-31', status: 'active' },
  { id: 'LP-002', name: 'Women Empowerment Fund', productType: 'Social Impact', participants: 280, disbursed: 560000, outstanding: 342000, segment: 4, volatility: 'low', activeSince: '2021-06-01', maturityDate: '2026-06-30', status: 'active' },
  { id: 'LP-003', name: 'SME Growth Program', productType: 'Business Loan', participants: 62, disbursed: 1240000, outstanding: 890000, segment: 5, volatility: 'high', activeSince: '2023-03-15', maturityDate: '2027-03-14', status: 'active' },
]

export const CHART_DATA: ChartDataPoint[] = [
  { month: 'Jan', disbursed: 48000, outstanding: 220000, collected: 32000, defaults: 4200 },
  { month: 'Fév', disbursed: 55000, outstanding: 235000, collected: 38000, defaults: 3800 },
  { month: 'Mar', disbursed: 42000, outstanding: 241000, collected: 41000, defaults: 5100 },
  { month: 'Avr', disbursed: 61000, outstanding: 255000, collected: 44000, defaults: 4600 },
  { month: 'Mai', disbursed: 73000, outstanding: 270000, collected: 52000, defaults: 3200 },
  { month: 'Jun', disbursed: 68000, outstanding: 278000, collected: 59000, defaults: 2900 },
  { month: 'Jul', disbursed: 79000, outstanding: 285000, collected: 63000, defaults: 3400 },
  { month: 'Aoû', disbursed: 85000, outstanding: 295000, collected: 71000, defaults: 2700 },
  { month: 'Sep', disbursed: 91000, outstanding: 307000, collected: 78000, defaults: 3100 },
  { month: 'Oct', disbursed: 88000, outstanding: 312000, collected: 82000, defaults: 2500 },
  { month: 'Nov', disbursed: 95000, outstanding: 325000, collected: 88000, defaults: 2200 },
  { month: 'Déc', disbursed: 102000, outstanding: 338000, collected: 94000, defaults: 1900 },
]

export const SEGMENT_DISTRIBUTION = [
  { name: 'Segment 1', value: 8, color: '#f87171' },
  { name: 'Segment 2', value: 14, color: '#fb923c' },
  { name: 'Segment 3', value: 28, color: '#fbbf24' },
  { name: 'Segment 4', value: 32, color: '#a78bfa' },
  { name: 'Segment 5', value: 18, color: '#19af58' },
]

export const PAR_DATA = [
  { label: 'PAR 0', count: 312, amount: 890000, pct: 68.2 },
  { label: 'PAR 60', count: 87, amount: 245000, pct: 18.9 },
  { label: 'PAR 90', count: 58, amount: 163000, pct: 12.6 },
  { label: 'Défaut', count: 3, amount: 8200, pct: 0.3 },
]
