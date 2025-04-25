export type Loan = {
  id: string
  loanDate: string
  dueDate: string
  returnDate: string | null
  status: string
  user: {
    id: string
    name: string
    lastName: string | null
    email: string
  } | null
  guestName: string | null
  guestEmail: string | null
  material: {
    id: string
    title: string
    author: string
    isbn: string | null
  }
  copy: {
    id: string
    registrationNumber: string
  } | null
}
