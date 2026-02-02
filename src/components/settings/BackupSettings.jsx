export default function BackupSettings() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Backup & Restore</h2>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Backup Data</h3>
          <p className="text-sm text-gray-600 mb-3">
            Download a backup of all your financial data.
          </p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Download Backup
          </button>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Restore Data</h3>
          <p className="text-sm text-gray-600 mb-3">
            Upload a previous backup file to restore your data.
          </p>
          <input type="file" className="mb-3" />
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Upload & Restore
          </button>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Auto Backup</h3>
          <div className="flex items-center">
            <input type="checkbox" id="autoBackup" className="mr-2" />
            <label htmlFor="autoBackup">Enable automatic weekly backups</label>
          </div>
        </div>
      </div>
    </div>
  );
}