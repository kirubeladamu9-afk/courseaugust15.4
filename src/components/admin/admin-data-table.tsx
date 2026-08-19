import { useMemo, useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

export interface DataColumn<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => ReactNode
}

interface Props<T extends { id: number }> {
  rows: T[]
  columns: DataColumn<T>[]
  searchPlaceholder?: string
  actions?: (row: T) => ReactNode
}

const AdminDataTable = <T extends { id: number }>({ rows, columns, searchPlaceholder = 'Search records', actions }: Props<T>) => {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [sortKey, setSortKey] = useState<keyof T>(columns[0].key)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const filteredRows = useMemo(
    () => rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(query.toLowerCase()))),
    [query, rows],
  )

  const sortedRows = useMemo(
    () => [...filteredRows].sort((first, second) => {
      const firstValue = String(first[sortKey])
      const secondValue = String(second[sortKey])
      const result = firstValue.localeCompare(secondValue, undefined, { numeric: true })
      return sortDirection === 'asc' ? result : -result
    }),
    [filteredRows, sortDirection, sortKey],
  )

  const visibleRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(0)
          }}
          size="small"
          fullWidth
          placeholder={searchPlaceholder}
          inputProps={{ 'aria-label': searchPlaceholder }}
        />
      </Box>
      <TableContainer>
        <Table sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={String(column.key)}>
                  <TableSortLabel
                    active={sortKey === column.key}
                    direction={sortKey === column.key ? sortDirection : 'asc'}
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              {actions && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length > 0 ? visibleRows.map((row) => (
              <TableRow hover key={row.id}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    {column.render ? column.render(row[column.key], row) : String(row[column.key])}
                  </TableCell>
                ))}
                {actions && <TableCell align="right">{actions(row)}</TableCell>}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No records found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sortedRows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value))
          setPage(0)
        }}
      />
    </Paper>
  )
}

export default AdminDataTable
