import BackupSettings from '../components/settings/BackupSettings'

export default function BackupPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Cloud Backup</h1>
      <BackupSettings />
    </div>
  )
}