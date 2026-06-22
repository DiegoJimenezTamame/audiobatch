const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { exec, execFile } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 820,
    height: 700,
    minWidth: 700,
    minHeight: 560,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:3000')
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Open folder dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})

// List audio files in folder
ipcMain.handle('list-files', async (_, folderPath, ext) => {
  try {
    const files = fs.readdirSync(folderPath)
    return files.filter(f => f.toLowerCase().endsWith(`.${ext.toLowerCase()}`)).sort()
  } catch {
    return []
  }
})

// Preview renames
ipcMain.handle('preview-renames', async (_, { files, options }) => {
  return files.map(f => ({ original: f, renamed: applyRenameOptions(f, options) }))
})

function applyRenameOptions(filename, opts) {
  let name = filename
  const lastDot = name.lastIndexOf('.')
  const ext = lastDot >= 0 ? name.slice(lastDot) : ''
  let base = lastDot >= 0 ? name.slice(0, lastDot) : name

  // Remove double extension
  if (opts.doubleExt && base.toLowerCase().endsWith(ext.toLowerCase())) {
    base = base.slice(0, base.length - ext.length)
  }

  // Remove brackets [...]
  if (opts.brackets) {
    base = base.replace(/\s*\[[^\]]*\]\s*$/, '').trimEnd()
  }

  // Remove prefix
  if (opts.prefix && base.startsWith(opts.prefix)) {
    base = base.slice(opts.prefix.length)
  }

  // Remove suffix
  if (opts.suffix && base.endsWith(opts.suffix)) {
    base = base.slice(0, base.length - opts.suffix.length)
  }

  // Find & replace
  if (opts.find) {
    base = base.split(opts.find).join(opts.replace || '')
  }

  // Leading space
  if (opts.leadingSpace) base = base.replace(/^ +/, '')

  // Trailing space
  if (opts.trailingSpace) base = base.replace(/ +$/, '')

  return base + ext
}

// Execute renames
ipcMain.handle('run-renames', async (_, { folderPath, pairs }) => {
  const results = []
  for (const { original, renamed } of pairs) {
    if (original === renamed) { results.push({ file: original, status: 'skipped' }); continue }
    try {
      fs.renameSync(path.join(folderPath, original), path.join(folderPath, renamed))
      results.push({ file: original, renamed, status: 'ok' })
    } catch (e) {
      results.push({ file: original, status: 'error', error: e.message })
    }
  }
  return results
})

// Check ffmpeg
ipcMain.handle('check-ffmpeg', async () => {
  try {
    await execAsync('which ffmpeg')
    return true
  } catch {
    return false
  }
})

// Convert files
ipcMain.handle('convert-files', async (event, { folderPath, files, fromExt, toExt, bitrate, outputFolder, deleteOriginals }) => {
  const outDir = outputFolder || folderPath
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const results = []
  for (const file of files) {
    const inPath = path.join(folderPath, file)
    const baseName = file.slice(0, file.lastIndexOf('.'))
    const outPath = path.join(outDir, `${baseName}.${toExt}`)
    try {
      await execAsync(`ffmpeg -y -i "${inPath}" -c:a aac -b:a ${bitrate} "${outPath}"`)
      if (deleteOriginals) fs.unlinkSync(inPath)
      results.push({ file, status: 'ok', output: `${baseName}.${toExt}` })
    } catch (e) {
      results.push({ file, status: 'error', error: e.message })
    }
    event.sender.send('convert-progress', { file, done: results.length, total: files.length })
  }
  return results
})

// Open folder in Finder
ipcMain.handle('open-folder', async (_, folderPath) => {
  shell.openPath(folderPath)
})
