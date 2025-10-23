import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Play, CheckCircle, XCircle, Clock, FileVideo } from 'lucide-react';

interface UploadJob {
  id: string;
  filename: string;
  status: string;
  progress_percent: number;
  target_formats: string[];
  file_size_mb: number;
  created_at: string;
}

interface TranscodeLog {
  log_level: string;
  message: string;
  created_at: string;
}

export function AdminUpload() {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [logs, setLogs] = useState<TranscodeLog[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadJobs();
    loadLogs();
  }, []);

  async function loadJobs() {
    const { data } = await supabase
      .from('upload_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setJobs(data);
    }
  }

  async function loadLogs() {
    const { data } = await supabase
      .from('transcode_logs')
      .select('*')
      .order('created_at', { ascending: false})
      .limit(20);

    if (data) {
      setLogs(data);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const statusIcons = {
    queued: Clock,
    uploading: Upload,
    transcoding: Play,
    completed: CheckCircle,
    failed: XCircle
  };

  const statusColors = {
    queued: 'text-slate-400',
    uploading: 'text-blue-400',
    transcoding: 'text-amber-400',
    completed: 'text-green-400',
    failed: 'text-red-400'
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="mb-8">
        <nav className="text-sm text-slate-400 mb-2">
          Admin / <span className="text-white">Upload & Ingest</span>
        </nav>
        <h1 className="text-3xl font-bold text-white">Upload & Ingest Portal</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Upload Files</h2>

            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
            >
              <div className="flex flex-col items-center">
                <div className="p-4 bg-slate-800 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-white font-medium mb-2">
                  Drag and drop video files here
                </p>
                <p className="text-sm text-slate-400 mb-4">
                  or click to browse (MP4, MOV, AVI up to 10GB)
                </p>
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Browse Files
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg">
                Start Upload
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Transcode Queue</h2>

            <div className="space-y-3">
              {jobs.map((job) => {
                const StatusIcon = statusIcons[job.status as keyof typeof statusIcons] || FileVideo;
                const statusColor = statusColors[job.status as keyof typeof statusColors] || 'text-slate-400';

                return (
                  <div key={job.id} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{job.filename}</div>
                        <div className="text-sm text-slate-400">
                          {job.file_size_mb}MB • {job.target_formats.join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium capitalize ${statusColor}`}>
                          {job.status}
                        </div>
                        <div className="text-xs text-slate-400">
                          {job.progress_percent}%
                        </div>
                      </div>
                    </div>

                    {job.status === 'transcoding' || job.status === 'uploading' ? (
                      <div className="mt-3">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                            style={{ width: `${job.progress_percent}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : null}

                    {job.target_formats.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {job.target_formats.map((format, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                          >
                            {format}
                          </span>
                        ))}
                        <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                          Thumbnails
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {jobs.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <FileVideo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upload jobs in queue</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Ingest Log</h2>

            <div className="space-y-2 max-h-[800px] overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="font-mono text-xs">
                  <span
                    className={`inline-block px-2 py-0.5 rounded mr-2 ${
                      log.log_level === 'error'
                        ? 'bg-red-500/20 text-red-400'
                        : log.log_level === 'warning'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {log.log_level.toUpperCase()}
                  </span>
                  <span className="text-slate-400">
                    {log.message}
                  </span>
                  {log.message.includes('✓') && (
                    <CheckCircle className="inline w-3 h-3 ml-2 text-green-400" />
                  )}
                </div>
              ))}

              {logs.length === 0 && (
                <>
                  <div className="font-mono text-xs text-slate-400">
                    <span className="text-green-400">✓</span> Video probe: 1920x1080, 23.98fps, H.264
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    <span className="text-green-400">✓</span> Transcode ladder: 1080p, 720p, 480p, 360p
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    <span className="text-green-400">✓</span> HLS manifests generated
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    <span className="text-green-400">✓</span> DASH manifests generated
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    <span className="text-green-400">✓</span> Thumbnails: 10 keyframes extracted
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    <span className="text-green-400">✓</span> QC checks passed (no black frames, no silence)
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    <span className="text-green-400">✓</span> Published to CDN
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
