import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CloseIcon from '@mui/icons-material/Close'
import Drawer from '@mui/material/Drawer'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { type ChangeEvent, type FC, type FormEvent, useEffect, useState } from 'react'
import { toast } from '@/components/toast'
import { completeTestPayment, createAdminBookstoreItem, createBookstoreChapaCheckout, deleteAdminBookstoreItem, getAdminBookstoreItems, getAuthenticatedUser, getBookstoreItems, getBookstorePurchases, type BookstoreItem, type BookstoreItemPayload, type BookstorePurchase, updateAdminBookstoreItem } from '@/services/api'
import { navigateTo } from '@/lib/navigation'

const emptyForm = (): BookstoreItemPayload => ({ title: '', description: '', category: '', price: 0, coverData: '', published: false })
const formatAmount = (amount: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the selected file.'))
  reader.onerror = () => reject(new Error('Could not read the selected file.'))
  reader.readAsDataURL(file)
})

const BookstoreItemDialog: FC<{ item: BookstoreItem | null; onClose: () => void; onSaved: (item: BookstoreItem) => void }> = ({ item, onClose, onSaved }) => {
  const [form, setForm] = useState<BookstoreItemPayload>(() => item ? { title: item.title, description: item.description, category: item.category, price: item.price, coverData: item.coverData, published: item.published } : emptyForm())
  const [fileName, setFileName] = useState(item?.fileName ?? '')
  const [coverFileName, setCoverFileName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const update = <K extends keyof BookstoreItemPayload>(key: K, value: BookstoreItemPayload[K]) => setForm((current) => ({ ...current, [key]: value }))
  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      update('fileData', await fileToDataUrl(file))
      update('fileName', file.name)
      setFileName(file.name)
    } catch (error) {
      toast.add({ title: 'Unable to read file', description: error instanceof Error ? error.message : 'Choose another file.', type: 'error' })
    }
  }
  const chooseCoverImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.add({ title: 'Image required', description: 'Choose an image file for the cover.', type: 'error' })
    try {
      update('coverData', await fileToDataUrl(file))
      setCoverFileName(file.name)
    } catch (error) {
      toast.add({ title: 'Unable to read image', description: error instanceof Error ? error.message : 'Choose another image.', type: 'error' })
    }
  }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!item && !form.fileData) return toast.add({ title: 'Download file required', description: 'Attach a PDF, EPUB, document, spreadsheet, ZIP, or text file.', type: 'error' })
    setIsSaving(true)
    try {
      const saved = item ? await updateAdminBookstoreItem(item.id, form) : await createAdminBookstoreItem(form)
      onSaved(saved)
      toast.add({ title: item ? 'Item updated' : 'Item created', description: `${saved.title} is ready for bookstore management.`, type: 'success' })
      onClose()
    } catch (error) {
      toast.add({ title: 'Unable to save item', description: error instanceof Error ? error.message : 'Please review the item details.', type: 'error' })
    } finally { setIsSaving(false) }
  }

  return <Dialog open onClose={onClose} fullWidth maxWidth="sm"><Box component="form" onSubmit={(event) => void save(event)}><DialogTitle>{item ? 'Edit bookstore item' : 'Add bookstore item'}</DialogTitle><DialogContent><Stack spacing={2.25} sx={{ pt: 1 }}><TextField required label="Title" value={form.title} onChange={(event) => update('title', event.target.value)} inputProps={{ maxLength: 200 }} /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}><TextField required label="Category" value={form.category} onChange={(event) => update('category', event.target.value)} /><TextField required label="Price (ETB)" type="number" value={form.price} onChange={(event) => update('price', Number(event.target.value))} inputProps={{ min: 0, step: 1 }} /></Box><Button component="label" variant="outlined">{coverFileName ? `Cover image: ${coverFileName}` : form.coverData ? 'Replace cover image' : 'Browse cover image'}<input hidden type="file" accept="image/*" onChange={(event) => void chooseCoverImage(event)} /></Button><TextField required multiline minRows={4} label="Description" value={form.description} onChange={(event) => update('description', event.target.value)} inputProps={{ maxLength: 5000 }} /><Button component="label" variant="outlined" startIcon={<DownloadOutlinedIcon />}>{fileName ? `File: ${fileName}` : 'Attach download file'}<input hidden type="file" accept=".pdf,.epub,.zip,.txt,.doc,.docx,.xlsx,application/pdf,application/epub+zip,application/zip,text/plain" onChange={(event) => void chooseFile(event)} /></Button><FormControlLabel control={<Switch checked={form.published} onChange={(event) => update('published', event.target.checked)} />} label="Publish in student bookstore" /></Stack></DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={onClose}>Cancel</Button><Button variant="contained" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save item'}</Button></DialogActions></Box></Dialog>
}

export const BookstoreAdminPage: FC = () => {
  const [items, setItems] = useState<BookstoreItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editor, setEditor] = useState<BookstoreItem | 'new' | null>(null)
  const reload = () => { setIsLoading(true); void getAdminBookstoreItems().then(setItems).catch((error) => toast.add({ title: 'Unable to load bookstore', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })).finally(() => setIsLoading(false)) }
  useEffect(reload, [])
  const remove = async (item: BookstoreItem) => {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
    try { await deleteAdminBookstoreItem(item.id); setItems((current) => current.filter((entry) => entry.id !== item.id)); toast.add({ title: 'Item deleted', description: item.title, type: 'success' }) } catch (error) { toast.add({ title: 'Unable to delete item', description: error instanceof Error ? error.message : 'Unpublish the item instead.', type: 'error' }) }
  }
  const saved = (item: BookstoreItem) => setItems((current) => current.some((entry) => entry.id === item.id) ? current.map((entry) => entry.id === item.id ? item : entry) : [item, ...current])
  return <><Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, mb: 3 }}><Box><Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.1 }}>Content workspace</Typography><Typography variant="h4" sx={{ fontWeight: 800 }}>Bookstore</Typography><Typography color="text.secondary">Publish digital learning resources and manage their availability.</Typography></Box><Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditor('new')}>Add item</Button></Box>{isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box> : items.length === 0 ? <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}><MenuBookOutlinedIcon color="primary" fontSize="large" /><Typography variant="h6" sx={{ mt: 1 }}>No bookstore items yet</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>Add your first digital resource to make it available to students.</Typography><Button variant="contained" onClick={() => setEditor('new')}>Add item</Button></Paper> : <Stack spacing={1.5}>{items.map((item) => <Paper key={item.id} variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}><Box component="img" src={item.coverData} alt="" sx={{ width: 64, height: 76, objectFit: 'cover', borderRadius: 1.5, backgroundColor: 'action.hover' }} /><Box sx={{ minWidth: 0, flex: 1 }}><Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={700} noWrap>{item.title}</Typography><Chip size="small" label={item.published ? 'Published' : 'Draft'} color={item.published ? 'success' : 'default'} /></Stack><Typography variant="body2" color="text.secondary" noWrap>{item.category} · {item.fileName} · {formatSize(item.fileSizeBytes)}</Typography><Typography variant="body2" sx={{ mt: .25 }}>{formatAmount(item.price, item.currency)}</Typography></Box><IconButton aria-label={`Edit ${item.title}`} onClick={() => setEditor(item)}><EditOutlinedIcon /></IconButton><IconButton color="error" aria-label={`Delete ${item.title}`} onClick={() => void remove(item)}><DeleteOutlineIcon /></IconButton></Paper>)}</Stack>}{editor && <BookstoreItemDialog item={editor === 'new' ? null : editor} onClose={() => setEditor(null)} onSaved={saved} />}</>
}

interface BookstorePageProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

export const BookstorePage: FC<BookstorePageProps> = ({ darkMode, onToggleDarkMode }) => {
  const [items, setItems] = useState<BookstoreItem[]>([])
  const [purchases, setPurchases] = useState<BookstorePurchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [purchasingId, setPurchasingId] = useState<number | null>(null)
  const [checkoutItem, setCheckoutItem] = useState<BookstoreItem | null>(null)
  const user = getAuthenticatedUser()
  const reloadPurchases = () => user && void getBookstorePurchases().then(setPurchases).catch(() => undefined)
  useEffect(() => { void getBookstoreItems().then(setItems).catch((error) => toast.add({ title: 'Unable to load bookstore', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })).finally(() => setIsLoading(false)); reloadPurchases() }, [])
  const buy = async (item: BookstoreItem) => {
    setPurchasingId(item.id)
    try {
      const checkout = await createBookstoreChapaCheckout(item.id)
      if (checkout.mode === 'test') {
        await completeTestPayment(checkout.paymentReference, 'paid')
        reloadPurchases()
        setCheckoutItem(null)
        toast.add({ title: 'Purchase complete', description: item.title + ' is now in your library.', type: 'success' })
      } else window.location.assign(checkout.checkoutUrl)
    } catch (error) {
      toast.add({ title: 'Unable to start checkout', description: error instanceof Error ? error.message : 'Please try again.', type: 'error' })
    } finally { setPurchasingId(null) }
  }
  const owned = new Set(purchases.map((purchase) => purchase.itemId))
  const closeDrawer = () => { if (purchasingId === null) setCheckoutItem(null) }
  return <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}><Header darkMode={darkMode} onSignIn={() => navigateTo('/')} onToggleDarkMode={onToggleDarkMode} /><Box component="main" sx={{ py: { xs: 4, md: 7 } }}><Box sx={{ maxWidth: 1180, mx: 'auto', px: 3 }}><Box sx={{ mb: 4 }}><Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.1 }}>Digital resources</Typography><Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>CourseSpace Bookstore</Typography><Typography color="text.secondary">Books, workbooks, and resources to support every stage of learning.</Typography></Box>{isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box> : items.length === 0 ? <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}><Typography variant="h6">New resources are coming soon.</Typography></Paper> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>{items.map((item) => { const isOwned = owned.has(item.id); const isPurchasing = purchasingId === item.id; const actionLabel = isOwned ? 'Download ' + item.fileName : isPurchasing ? 'Opening checkout...' : 'Purchase ' + item.title; const takeAction = () => { if (isOwned) window.location.assign('/api/bookstore-items/' + item.id + '/download'); else setCheckoutItem(item) }; return <Card key={item.id} sx={{ display: 'flex', flexDirection: 'column', transition: 'transform 180ms ease, box-shadow 180ms ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}><Box component="button" type="button" onClick={takeAction} aria-label={isOwned ? 'Download ' + item.title : 'View checkout for ' + item.title} sx={{ border: 0, p: 0, width: '100%', display: 'block', cursor: 'pointer', background: 'transparent', textAlign: 'left' }}><Box component="img" src={item.coverData} alt={item.title + ' cover'} sx={{ display: 'block', width: '100%', height: 250, objectFit: 'cover', backgroundColor: 'action.hover' }} /></Box><CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}><Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}><Chip size="small" label={item.category} color="primary" variant="outlined" /><Typography variant="h6" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{formatAmount(item.price, item.currency)}</Typography></Stack><Typography variant="h5" sx={{ fontWeight: 800 }}>{item.title}</Typography><Typography color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</Typography><Button sx={{ mt: 'auto' }} variant={isOwned ? 'outlined' : 'contained'} startIcon={isOwned ? <DownloadOutlinedIcon /> : <MenuBookOutlinedIcon />} onClick={takeAction} disabled={isPurchasing}>{actionLabel}</Button></CardContent></Card> })}</Box>}</Box></Box><Drawer anchor="right" open={Boolean(checkoutItem)} onClose={closeDrawer} ModalProps={{ keepMounted: true }}><Box role="dialog" aria-labelledby="checkout-drawer-title" sx={{ width: { xs: '100vw', sm: 420 }, maxWidth: '100vw', p: 3, height: '100%', overflowY: 'auto' }}>{checkoutItem && <Stack spacing={2.25}><Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><IconButton aria-label="Close checkout" onClick={closeDrawer} disabled={purchasingId !== null}><CloseIcon /></IconButton></Box><Box component="img" src={checkoutItem.coverData} alt={checkoutItem.title + ' cover'} sx={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 2, backgroundColor: 'action.hover' }} /><Chip label={checkoutItem.category} color="primary" variant="outlined" sx={{ alignSelf: 'flex-start' }} /><Typography id="checkout-drawer-title" variant="h4" sx={{ fontWeight: 800 }}>{checkoutItem.title}</Typography><Typography color="text.secondary">{checkoutItem.description}</Typography><Divider /><Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Price</Typography><Typography variant="h6" sx={{ fontWeight: 800 }}>{formatAmount(checkoutItem.price, checkoutItem.currency)}</Typography></Stack><Stack spacing={0.5}><Typography variant="subtitle2">File details</Typography><Typography color="text.secondary">{checkoutItem.fileName} · {formatSize(checkoutItem.fileSizeBytes)}</Typography></Stack><Button fullWidth size="large" variant="contained" onClick={() => void buy(checkoutItem)} disabled={purchasingId !== null} startIcon={purchasingId === checkoutItem.id ? <CircularProgress size={18} color="inherit" /> : <MenuBookOutlinedIcon />}>{purchasingId === checkoutItem.id ? 'Processing...' : 'Checkout with Chapa'}</Button></Stack>}</Box></Drawer><Footer /></Box>
}
