import React, { useState, useEffect, useCallback } from 'react'

const AUDIO_EXTS = ['mp3', 'm4a', 'wav', 'flac', 'aac', 'ogg', 'aiff']

const s = {
  app: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#1c1c1e' },
  titleBar: { height: 38, WebkitAppRegion: 'drag', flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 80, paddingRight: 16, borderBottom: '1px solid #2c2c2e' },
  titleText: { fontSize: 13, fontWeight: 500, color: '#8e8e93', letterSpacing: 0.2 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: 200, background: '#141416', borderRight: '1px solid #2c2c2e', display: 'flex', flexDirection: 'column', padding: '12px 0' },
  sideSection: { padding: '0 12px', marginBottom: 20 },
  sideLabel: { fontSize: 10, fontWeight: 600, color: '#48484a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, paddingLeft: 4 },
  navItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: active ? 500 : 400, color: active ? '#f2f2f7' : '#8e8e93', background: active ? '#2c2c2e' : 'transparent', marginBottom: 2, transition: 'all 0.1s' }),
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar: { padding: '12px 16px', borderBottom: '1px solid #2c2c2e', display: 'flex', alignItems: 'center', gap: 10 },
  folderBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#2c2c2e', border: '1px solid #3a3a3c', borderRadius: 8, color: '#f2f2f7', fontSize: 12, fontWeight: 500 },
  folderPath: { flex: 1, fontSize: 12, color: '#8e8e93', fontFamily: 'SF Mono, Menlo, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  extSelect: { display: 'flex', alignItems: 'center', gap: 6 },
  extLabel: { fontSize: 12, color: '#636366' },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  splitPane: { flex: 1, display: 'flex', overflow: 'hidden' },
  optionsPane: { width: 260, borderRight: '1px solid #2c2c2e', overflow: 'auto', padding: 16 },
  previewPane: { flex: 1, overflow: 'auto', padding: 16 },
  sectionHead: { fontSize: 11, fontWeight: 600, color: '#48484a', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, marginTop: 16 },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  toggleLabel: { fontSize: 12, color: '#ebebf5cc' },
  inputRow: { marginBottom: 8 },
  inputLabel: { fontSize: 11, color: '#636366', marginBottom: 4 },
  textInput: { width: '100%' },
  fileList: { display: 'flex', flexDirection: 'column', gap: 1 },
  fileRow: (status) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 5, background: status === 'changed' ? '#0a84ff15' : status === 'ok' ? '#30d15815' : status === 'error' ? '#ff453a15' : 'transparent' }),
  fileName: (changed) => ({ flex: 1, fontSize: 12, fontFamily: 'SF Mono, Menlo, monospace', color: changed ? '#8e8e93' : '#f2f2f7', textDecoration: changed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
  newName: { flex: 1, fontSize: 12, fontFamily: 'SF Mono, Menlo, monospace', color: '#30d158', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  arrow: { color: '#48484a', flexShrink: 0 },
  bottomBar: { padding: '10px 16px', borderTop: '1px solid #2c2c2e', display: 'flex', alignItems: 'center', gap: 10 },
  runBtn: (disabled) => ({ padding: '8px 20px', background: disabled ? '#2c2c2e' : '#0a84ff', color: disabled ? '#48484a' : '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }),
  statusText: { fontSize: 12, color: '#8e8e93', flex: 1 },
  openBtn: { padding: '7px 14px', background: '#2c2c2e', border: '1px solid #3a3a3c', borderRadius: 7, color: '#8e8e93', fontSize: 12 },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#48484a', gap: 8 },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 14, fontWeight: 500, color: '#636366' },
  emptySubtitle: { fontSize: 12, color: '#48484a', textAlign: 'center', maxWidth: 260 },
  progressBar: { height: 3, background: '#2c2c2e', borderRadius: 2, overflow: 'hidden', flex: 1 },
  progressFill: (pct) => ({ height: '100%', width: `${pct}%`, background: '#0a84ff', borderRadius: 2, transition: 'width 0.2s' }),
  badge: (color) => ({ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: color === 'blue' ? '#0a84ff22' : color === 'green' ? '#30d15822' : '#ff453a22', color: color === 'blue' ? '#0a84ff' : color === 'green' ? '#30d158' : '#ff453a', flexShrink: 0 }),
  convertRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  warning: { background: '#ff9f0a15', border: '1px solid #ff9f0a30', borderRadius: 7, padding: '8px 12px', fontSize: 12, color: '#ff9f0a', marginBottom: 12 }
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: 32, height: 18, borderRadius: 9, background: checked ? '#0a84ff' : '#3a3a3c', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: checked ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('rename')
  const [folder, setFolder] = useState('')
  const [ext, setExt] = useState('mp3')
  const [files, setFiles] = useState([])
  const [ffmpegOk, setFfmpegOk] = useState(null)

  // Rename options
  const [opts, setOpts] = useState({ doubleExt: false, brackets: false, leadingSpace: false, trailingSpace: false, prefix: '', suffix: '', find: '', replace: '' })
  const [previews, setPreviews] = useState([])
  const [renameResults, setRenameResults] = useState([])
  const [renameRunning, setRenameRunning] = useState(false)

  // Convert options
  const [toExt, setToExt] = useState('m4a')
  const [bitrate, setBitrate] = useState('192k')
  const [outputFolder, setOutputFolder] = useState('')
  const [deleteOriginals, setDeleteOriginals] = useState(false)
  const [convertProgress, setConvertProgress] = useState(null)
  const [convertResults, setConvertResults] = useState([])
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    window.api?.checkFfmpeg().then(setFfmpegOk)
    window.api?.onConvertProgress(({ file, done, total }) => {
      setConvertProgress({ file, done, total })
    })
    return () => window.api?.removeConvertProgress()
  }, [])

  const loadFiles = useCallback(async (f, e) => {
    if (!f) return
    const list = await window.api?.listFiles(f, e)
    setFiles(list || [])
    setPreviews([])
    setRenameResults([])
    setConvertResults([])
    setConvertProgress(null)
  }, [])

  useEffect(() => { loadFiles(folder, ext) }, [folder, ext, loadFiles])

  useEffect(() => {
    if (!files.length) { setPreviews([]); return }
    window.api?.previewRenames({ files, options: opts }).then(setPreviews)
  }, [files, opts])

  const setOpt = (k, v) => setOpts(o => ({ ...o, [k]: v }))

  const selectFolder = async () => {
    const f = await window.api?.selectFolder()
    if (f) { setFolder(f); setRenameResults([]); setConvertResults([]) }
  }

  const runRename = async () => {
    setRenameRunning(true)
    const pairs = previews.filter(p => p.original !== p.renamed)
    const results = await window.api?.runRenames({ folderPath: folder, pairs })
    setRenameResults(results || [])
    setRenameRunning(false)
    loadFiles(folder, ext)
  }

  const runConvert = async () => {
    setConverting(true)
    setConvertResults([])
    setConvertProgress({ file: '', done: 0, total: files.length })
    const results = await window.api?.convertFiles({ folderPath: folder, files, fromExt: ext, toExt, bitrate, outputFolder: outputFolder || null, deleteOriginals })
    setConvertResults(results || [])
    setConverting(false)
    setConvertProgress(null)
    loadFiles(folder, ext)
  }

  const changedCount = previews.filter(p => p.original !== p.renamed).length
  const hasFolder = !!folder
  const hasFiles = files.length > 0

  return (
    <div style={s.app}>
      <div style={s.titleBar}>
        <span style={s.titleText}>AudioBatch</span>
      </div>
      <div style={s.body}>
        <div style={s.sidebar}>
          <div style={s.sideSection}>
            <div style={s.sideLabel}>Tools</div>
            {[['rename', '✏️', 'Rename files'], ['convert', '🔄', 'Convert format'], ['both', '⚡', 'Rename + convert']].map(([id, icon, label]) => (
              <div key={id} style={s.navItem(tab === id)} onClick={() => { setTab(id); setRenameResults([]); setConvertResults([]) }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ ...s.sideSection, marginTop: 'auto' }}>
            <div style={s.sideLabel}>Source format</div>
            <select value={ext} onChange={e => setExt(e.target.value)} style={{ width: '100%' }}>
              {AUDIO_EXTS.map(e => <option key={e} value={e}>.{e}</option>)}
            </select>
          </div>
        </div>

        <div style={s.main}>
          <div style={s.topBar}>
            <button style={s.folderBtn} onClick={selectFolder}>
              📁 Choose folder
            </button>
            <span style={s.folderPath}>{folder || 'No folder selected'}</span>
            {hasFolder && <button style={s.openBtn} onClick={() => window.api?.openFolder(folder)}>Open in Finder</button>}
          </div>

          {!hasFolder ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>🎵</div>
              <div style={s.emptyTitle}>Choose a folder to get started</div>
              <div style={s.emptySubtitle}>Select a folder containing your audio files using the button above</div>
            </div>
          ) : !hasFiles ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>🔍</div>
              <div style={s.emptyTitle}>No .{ext} files found</div>
              <div style={s.emptySubtitle}>Try changing the source format in the sidebar</div>
            </div>
          ) : (
            <div style={s.content}>
              {tab === 'rename' && <RenameTab opts={opts} setOpt={setOpt} previews={previews} results={renameResults} />}
              {tab === 'convert' && <ConvertTab toExt={toExt} setToExt={setToExt} bitrate={bitrate} setBitrate={setBitrate} outputFolder={outputFolder} setOutputFolder={setOutputFolder} deleteOriginals={deleteOriginals} setDeleteOriginals={setDeleteOriginals} ffmpegOk={ffmpegOk} files={files} results={convertResults} progress={convertProgress} ext={ext} />}
              {tab === 'both' && <BothTab opts={opts} setOpt={setOpt} previews={previews} toExt={toExt} setToExt={setToExt} bitrate={bitrate} setBitrate={setBitrate} ffmpegOk={ffmpegOk} files={files} ext={ext} />}

              <div style={s.bottomBar}>
                {tab === 'rename' && <>
                  <span style={s.statusText}>{renameResults.length ? `${renameResults.filter(r => r.status === 'ok').length} renamed` : `${changedCount} of ${files.length} files will be renamed`}</span>
                  <button style={s.runBtn(!changedCount || renameRunning)} onClick={runRename} disabled={!changedCount || renameRunning}>{renameRunning ? 'Renaming…' : 'Rename files'}</button>
                </>}
                {tab === 'convert' && <>
                  {convertProgress && <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11, color: '#636366' }}>{convertProgress.file || 'Starting…'} ({convertProgress.done}/{convertProgress.total})</div>
                    <div style={s.progressBar}><div style={s.progressFill(convertProgress.total ? (convertProgress.done / convertProgress.total) * 100 : 0)} /></div>
                  </div>}
                  {!convertProgress && <span style={s.statusText}>{convertResults.length ? `${convertResults.filter(r => r.status === 'ok').length}/${convertResults.length} converted` : `${files.length} files ready to convert`}</span>}
                  <button style={s.runBtn(!ffmpegOk || converting)} onClick={runConvert} disabled={!ffmpegOk || converting}>{converting ? 'Converting…' : 'Convert files'}</button>
                </>}
                {tab === 'both' && <>
                  <span style={s.statusText}>{files.length} files — convert then rename</span>
                  <button style={s.runBtn(!ffmpegOk)} onClick={async () => { await runConvert(); await loadFiles(folder, toExt); await runRename() }} disabled={!ffmpegOk}>Run both</button>
                </>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RenameTab({ opts, setOpt, previews, results }) {
  const resultMap = Object.fromEntries((results || []).map(r => [r.file, r]))
  return (
    <div style={s.splitPane}>
      <div style={s.optionsPane}>
        <div style={{ ...s.sectionHead, marginTop: 0 }}>Strip from name</div>
        {[['leadingSpace', 'Leading spaces'], ['trailingSpace', 'Trailing spaces'], ['brackets', 'Date brackets  [2024-01-01]'], ['doubleExt', 'Duplicate extension  .m4a.m4a']].map(([k, label]) => (
          <div key={k} style={s.toggleRow}>
            <Toggle checked={opts[k]} onChange={v => setOpt(k, v)} />
            <span style={s.toggleLabel}>{label}</span>
          </div>
        ))}
        <div style={s.sectionHead}>Find &amp; replace</div>
        {[['prefix', 'Remove prefix', 'e.g. Untitled'], ['suffix', 'Remove suffix', 'e.g. _final'], ['find', 'Find text', 'text to find'], ['replace', 'Replace with', 'leave blank to delete']].map(([k, label, ph]) => (
          <div key={k} style={s.inputRow}>
            <div style={s.inputLabel}>{label}</div>
            <input type="text" placeholder={ph} value={opts[k]} onChange={e => setOpt(k, e.target.value)} style={s.textInput} />
          </div>
        ))}
      </div>
      <div style={s.previewPane}>
        <div style={{ ...s.sectionHead, marginTop: 0 }}>Preview</div>
        <div style={s.fileList}>
          {previews.map(({ original, renamed }) => {
            const r = resultMap[original]
            const changed = original !== renamed
            return (
              <div key={original} style={s.fileRow(r ? r.status : changed ? 'changed' : '')}>
                <span style={s.fileName(changed)}>{original}</span>
                {changed && <><span style={s.arrow}>→</span><span style={s.newName}>{renamed}</span></>}
                {r && <span style={s.badge(r.status === 'ok' ? 'green' : 'red')}>{r.status === 'ok' ? 'done' : 'error'}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ConvertTab({ toExt, setToExt, bitrate, setBitrate, outputFolder, setOutputFolder, deleteOriginals, setDeleteOriginals, ffmpegOk, files, results, progress, ext }) {
  return (
    <div style={s.splitPane}>
      <div style={s.optionsPane}>
        {ffmpegOk === false && <div style={s.warning}>⚠️ ffmpeg not found. Install it with: <code>brew install ffmpeg</code></div>}
        <div style={{ ...s.sectionHead, marginTop: 0 }}>Output format</div>
        <div style={s.inputRow}>
          <div style={s.inputLabel}>Convert to</div>
          <select value={toExt} onChange={e => setToExt(e.target.value)} style={{ width: '100%' }}>
            {['mp3', 'm4a', 'wav', 'flac', 'aac', 'ogg', 'aiff'].filter(e => e !== ext).map(e => <option key={e} value={e}>.{e}</option>)}
          </select>
        </div>
        <div style={s.inputRow}>
          <div style={s.inputLabel}>Bitrate</div>
          <select value={bitrate} onChange={e => setBitrate(e.target.value)} style={{ width: '100%' }}>
            <option value="128k">128k — smaller files</option>
            <option value="192k">192k — balanced</option>
            <option value="256k">256k — high quality</option>
            <option value="320k">320k — maximum</option>
          </select>
        </div>
        <div style={s.sectionHead}>Output location</div>
        <div style={s.inputRow}>
          <div style={s.inputLabel}>Save to folder (blank = same folder)</div>
          <input type="text" placeholder="e.g. /Users/you/converted" value={outputFolder} onChange={e => setOutputFolder(e.target.value)} style={s.textInput} />
        </div>
        <div style={{ ...s.toggleRow, marginTop: 8 }}>
          <Toggle checked={deleteOriginals} onChange={setDeleteOriginals} />
          <span style={s.toggleLabel}>Delete originals after converting</span>
        </div>
      </div>
      <div style={s.previewPane}>
        <div style={{ ...s.sectionHead, marginTop: 0 }}>Files to convert ({files.length})</div>
        <div style={s.fileList}>
          {files.map(f => {
            const r = (results || []).find(r => r.file === f)
            return (
              <div key={f} style={s.fileRow(r?.status)}>
                <span style={{ ...s.fileName(false), color: progress?.file === f ? '#0a84ff' : '#f2f2f7' }}>{f}</span>
                <span style={s.arrow}>→</span>
                <span style={{ fontSize: 12, fontFamily: 'SF Mono, Menlo, monospace', color: '#636366' }}>{f.slice(0, f.lastIndexOf('.'))}.{toExt}</span>
                {r && <span style={s.badge(r.status === 'ok' ? 'green' : 'red')}>{r.status === 'ok' ? 'done' : 'error'}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BothTab({ opts, setOpt, previews, toExt, setToExt, bitrate, setBitrate, ffmpegOk, files, ext }) {
  const changedCount = previews.filter(p => p.original !== p.renamed).length
  return (
    <div style={s.splitPane}>
      <div style={s.optionsPane}>
        {ffmpegOk === false && <div style={s.warning}>⚠️ ffmpeg not found. Install it with: <code>brew install ffmpeg</code></div>}
        <div style={{ ...s.sectionHead, marginTop: 0 }}>Step 1 — Convert</div>
        <div style={s.inputRow}>
          <div style={s.inputLabel}>Convert to</div>
          <select value={toExt} onChange={e => setToExt(e.target.value)} style={{ width: '100%' }}>
            {['mp3', 'm4a', 'wav', 'flac', 'aac', 'ogg', 'aiff'].filter(e => e !== ext).map(e => <option key={e} value={e}>.{e}</option>)}
          </select>
        </div>
        <div style={s.inputRow}>
          <div style={s.inputLabel}>Bitrate</div>
          <select value={bitrate} onChange={e => setBitrate(e.target.value)} style={{ width: '100%' }}>
            <option value="128k">128k</option>
            <option value="192k">192k</option>
            <option value="256k">256k</option>
            <option value="320k">320k</option>
          </select>
        </div>
        <div style={s.sectionHead}>Step 2 — Rename</div>
        {[['leadingSpace', 'Leading spaces'], ['trailingSpace', 'Trailing spaces'], ['brackets', 'Date brackets'], ['doubleExt', 'Duplicate extension']].map(([k, label]) => (
          <div key={k} style={s.toggleRow}>
            <Toggle checked={opts[k]} onChange={v => setOpt(k, v)} />
            <span style={s.toggleLabel}>{label}</span>
          </div>
        ))}
        <div style={s.inputRow} style={{ marginTop: 8 }}>
          <div style={s.inputLabel}>Remove prefix</div>
          <input type="text" placeholder="e.g. Untitled" value={opts.prefix} onChange={e => setOpt('prefix', e.target.value)} style={s.textInput} />
        </div>
      </div>
      <div style={s.previewPane}>
        <div style={{ ...s.sectionHead, marginTop: 0 }}>Plan</div>
        <div style={{ fontSize: 12, color: '#636366', lineHeight: 1.7, marginBottom: 16 }}>
          <div>1. Convert <strong style={{ color: '#f2f2f7' }}>{files.length} .{ext} files</strong> → .{toExt} at {bitrate}</div>
          <div>2. Apply rename rules to the new .{toExt} files</div>
          {changedCount > 0 && <div style={{ color: '#30d158', marginTop: 4 }}>✓ {changedCount} files will be renamed after conversion</div>}
        </div>
        <div style={{ ...s.sectionHead }}>Rename preview (on converted names)</div>
        <div style={s.fileList}>
          {previews.slice(0, 30).map(({ original, renamed }) => {
            const changed = original !== renamed
            const newOrig = original.slice(0, original.lastIndexOf('.')) + '.' + toExt
            const newRenamed = renamed.slice(0, renamed.lastIndexOf('.')) + '.' + toExt
            return (
              <div key={original} style={s.fileRow(changed ? 'changed' : '')}>
                <span style={s.fileName(changed)}>{newOrig}</span>
                {changed && <><span style={s.arrow}>→</span><span style={s.newName}>{newRenamed}</span></>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
