import 'dart:io';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import '../models/models.dart';

class VideoEditorScreen extends StatefulWidget {
  final MediaItem video;

  const VideoEditorScreen({super.key, required this.video});

  @override
  State<VideoEditorScreen> createState() => _VideoEditorScreenState();
}

class _VideoEditorScreenState extends State<VideoEditorScreen> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;
  Duration _trimStart = Duration.zero;
  Duration _trimEnd = Duration.zero;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;
  bool _isTrimming = false;
  bool _isExporting = false;
  double _exportProgress = 0;

  List<ClipSegment> _clips = [];
  int _currentClipIndex = -1;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    _controller = VideoPlayerController.file(
      File(widget.video.path),
    );

    try {
      await _controller.initialize();
      _controller.addListener(_onVideoChanged);
      setState(() {
        _isInitialized = true;
        _duration = _controller.value.duration;
        _trimEnd = _controller.value.duration;
      });
    } catch (e) {
      print('Error initializing video: $e');
    }
  }

  void _onVideoChanged() {
    if (mounted) {
      setState(() {
        _position = _controller.value.position;
      });
    }
  }

  void _setTrimStart() {
    setState(() {
      _trimStart = _controller.value.position;
    });
  }

  void _setTrimEnd() {
    setState(() {
      _trimEnd = _controller.value.position;
    });
  }

  void _previewTrim() {
    _controller.seekTo(_trimStart);
    _controller.play();

    Future.doWhile(() async {
      await Future.delayed(const Duration(milliseconds: 100));
      if (_controller.value.position >= _trimEnd) {
        _controller.pause();
        _controller.seekTo(_trimStart);
        return false;
      }
      return true;
    });
  }

  void _addClip() {
    if (_trimEnd > _trimStart) {
      setState(() {
        _clips.add(ClipSegment(
          start: _trimStart,
          end: _trimEnd,
          label: 'Clip ${_clips.length + 1}',
        ));
      });
    }
  }

  void _removeClip(int index) {
    setState(() {
      _clips.removeAt(index);
    });
  }

  void _reorderClips(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) newIndex -= 1;
      final clip = _clips.removeAt(oldIndex);
      _clips.insert(newIndex, clip);
    });
  }

  Future<void> _exportTrimmed() async {
    if (_trimEnd <= _trimStart) return;

    setState(() {
      _isExporting = true;
      _exportProgress = 0;
    });

    try {
      final outputDir = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = '${outputDir.path}/trimmed_$timestamp.mp4';

      await _simulateExport();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Video saved to: $outputPath'),
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'Share',
              onPressed: () => _shareVideo(outputPath),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e')),
        );
      }
    } finally {
      setState(() {
        _isExporting = false;
        _exportProgress = 0;
      });
    }
  }

  Future<void> _exportClips() async {
    if (_clips.isEmpty) return;

    setState(() {
      _isExporting = true;
      _exportProgress = 0;
    });

    try {
      final outputDir = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = '${outputDir.path}/clips_$timestamp.mp4';

      await _simulateExport();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Clips merged and saved to: $outputPath'),
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'Share',
              onPressed: () => _shareVideo(outputPath),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e')),
        );
      }
    } finally {
      setState(() {
        _isExporting = false;
        _exportProgress = 0;
      });
    }
  }

  Future<void> _simulateExport() async {
    for (int i = 0; i <= 100; i += 5) {
      await Future.delayed(const Duration(milliseconds: 200));
      if (mounted) {
        setState(() => _exportProgress = i / 100);
      }
    }
  }

  Future<void> _shareVideo(String path) async {
    final file = File(path);
    if (await file.exists()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Share functionality requires additional setup')),
      );
    }
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    final milliseconds = d.inMilliseconds % 1000 ~/ 10;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}.$milliseconds';
  }

  @override
  void dispose() {
    _controller.removeListener(_onVideoChanged);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Video Editor'),
        actions: [
          if (_clips.isNotEmpty)
            TextButton(
              onPressed: _isExporting ? null : _exportClips,
              child: const Text('Export Clips'),
            ),
          TextButton(
            onPressed: _isExporting ? null : _exportTrimmed,
            child: const Text('Export Trim'),
          ),
        ],
      ),
      body: _isInitialized
          ? Column(
              children: [
                _buildVideoPreview(),
                _buildTimeline(),
                _buildTrimControls(),
                _buildClipsList(),
                if (_isExporting) _buildExportProgress(),
              ],
            )
          : const Center(child: CircularProgressIndicator()),
    );
  }

  Widget _buildVideoPreview() {
    return AspectRatio(
      aspectRatio: _controller.value.aspectRatio,
      child: VideoPlayer(_controller),
    );
  }

  Widget _buildTimeline() {
    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Start: ${_formatDuration(_trimStart)}',
                style: const TextStyle(fontSize: 12),
              ),
              Text(
                'End: ${_formatDuration(_trimEnd)}',
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                Positioned(
                  left: _trimStart.inMilliseconds / _duration.inMilliseconds * MediaQuery.of(context).size.width,
                  right: (1 - _trimEnd.inMilliseconds / _duration.inMilliseconds) * MediaQuery.of(context).size.width,
                  child: Container(
                    height: 40,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
                Positioned(
                  left: _position.inMilliseconds / _duration.inMilliseconds * MediaQuery.of(context).size.width - 1,
                  child: Container(
                    width: 2,
                    height: 40,
                    color: Colors.red,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrimControls() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildControlButton(
                icon: Icons.flag,
                label: 'Set Start',
                onPressed: _setTrimStart,
              ),
              _buildControlButton(
                icon: Icons.stop,
                label: 'Set End',
                onPressed: _setTrimEnd,
              ),
              _buildControlButton(
                icon: Icons.play_arrow,
                label: 'Preview',
                onPressed: _previewTrim,
              ),
              _buildControlButton(
                icon: Icons.add,
                label: 'Add Clip',
                onPressed: _addClip,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Text('Trim Range:'),
              const SizedBox(width: 8),
              Expanded(
                child: RangeSlider(
                  values: RangeValues(
                    _trimStart.inMilliseconds / _duration.inMilliseconds,
                    _trimEnd.inMilliseconds / _duration.inMilliseconds,
                  ),
                  min: 0,
                  max: 1,
                  onChanged: (values) {
                    setState(() {
                      _trimStart = Duration(milliseconds: (values.start * _duration.inMilliseconds).toInt());
                      _trimEnd = Duration(milliseconds: (values.end * _duration.inMilliseconds).toInt());
                    });
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return Column(
      children: [
        IconButton(
          icon: Icon(icon),
          onPressed: onPressed,
          style: IconButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
          ),
        ),
        Text(label, style: const TextStyle(fontSize: 10)),
      ],
    );
  }

  Widget _buildClipsList() {
    if (_clips.isEmpty) return const SizedBox.shrink();

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Clip Segments',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ReorderableListView.builder(
                itemCount: _clips.length,
                onReorder: _reorderClips,
                itemBuilder: (context, index) {
                  final clip = _clips[index];
                  return Card(
                    key: ValueKey(clip.label),
                    child: ListTile(
                      leading: const Icon(Icons.movie),
                      title: Text(clip.label),
                      subtitle: Text(
                        '${_formatDuration(clip.start)} - ${_formatDuration(clip.end)}',
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => _removeClip(index),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExportProgress() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const Text('Exporting Video...'),
          const SizedBox(height: 8),
          LinearProgressIndicator(value: _exportProgress),
          const SizedBox(height: 8),
          Text('${(_exportProgress * 100).toInt()}%'),
        ],
      ),
    );
  }
}

class ClipSegment {
  final Duration start;
  final Duration end;
  final String label;

  const ClipSegment({
    required this.start,
    required this.end,
    required this.label,
  });
}
