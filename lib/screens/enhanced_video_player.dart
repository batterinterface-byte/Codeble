import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:file_picker/file_picker.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../models/models.dart';
import 'subtitle_model.dart';
import 'video_editor_screen.dart';

class EnhancedVideoPlayerScreen extends StatefulWidget {
  final MediaItem video;
  final List<MediaItem>? queue;
  final int startIndex;

  const EnhancedVideoPlayerScreen({
    super.key,
    required this.video,
    this.queue,
    this.startIndex = 0,
  });

  @override
  State<EnhancedVideoPlayerScreen> createState() =>
      _EnhancedVideoPlayerScreenState();
}

class _EnhancedVideoPlayerScreenState extends State<EnhancedVideoPlayerScreen> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;
  bool _showControls = true;
  bool _isLocked = false;
  bool _isOneHandMode = false;
  bool _isPiPMode = false;
  double _playbackSpeed = 1.0;
  double _volume = 1.0;
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  Timer? _hideControlsTimer;
  int _currentQueueIndex = 0;
  RepeatMode _repeatMode = RepeatMode.off;
  bool _isShuffled = false;
  bool _isBackgroundPlay = false;

  // Gesture state
  double _startDragX = 0;
  double _startDragY = 0;
  double _startVolume = 0;
  double _startBrightness = 0;
  Duration _startPosition = Duration.zero;
  bool _isSeekingHorizontal = false;
  bool _isDragging = false;
  double _seekAmount = 0;
  double _volumeChange = 0;
  double _brightnessChange = 0;

  // Subtitle state
  List<SubtitleEntry> _subtitles = [];
  SubtitleEntry? _currentSubtitle;
  double _subtitleFontSize = 18;
  Color _subtitleColor = Colors.white;
  int _subtitleDelay = 0;
  bool _showSubtitles = true;

  // PiP state
  final double _pipWidth = 200;
  final double _pipHeight = 150;
  Offset _pipPosition = const Offset(100, 100);
  bool _isDraggingPiP = false;

  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
      DeviceOrientation.portraitUp,
    ]);
    WakelockPlus.enable();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    _controller = VideoPlayerController.file(
      File(widget.video.path),
    );

    try {
      await _controller.initialize();
      _controller.addListener(_onVideoChanged);
      _controller.setVolume(_volume);
      setState(() {
        _isInitialized = true;
        _duration = _controller.value.duration;
        _currentQueueIndex = widget.startIndex;
      });
      await _controller.play();
      _startHideTimer();
    } catch (e) {
      print('Error initializing video: $e');
    }
  }

  void _onVideoChanged() {
    if (mounted) {
      setState(() {
        _position = _controller.value.position;
        _duration = _controller.value.duration;
        _updateCurrentSubtitle();
      });

      if (_controller.value.position >= _controller.value.duration) {
        _handleVideoComplete();
      }
    }
  }

  void _handleVideoComplete() {
    switch (_repeatMode) {
      case RepeatMode.off:
        if (_currentQueueIndex < (widget.queue?.length ?? 1) - 1) {
          _playNext();
        }
        break;
      case RepeatMode.all:
        _playNext();
        break;
      case RepeatMode.one:
        _controller.seekTo(Duration.zero);
        _controller.play();
        break;
    }
  }

  void _playNext() {
    if (widget.queue != null && widget.queue!.isNotEmpty) {
      if (_isShuffled) {
        _currentQueueIndex = DateTime.now().millisecondsSinceEpoch % widget.queue!.length;
      } else {
        _currentQueueIndex = (_currentQueueIndex + 1) % widget.queue!.length;
      }
      _controller.pause();
      _controller = VideoPlayerController.file(
        File(widget.queue![_currentQueueIndex].path),
      );
      _controller.initialize().then((_) {
        _controller.addListener(_onVideoChanged);
        _controller.play();
        setState(() {
          _isInitialized = true;
          _duration = _controller.value.duration;
        });
      });
    }
  }

  void _playPrevious() {
    if (widget.queue != null && widget.queue!.isNotEmpty) {
      if (_isShuffled) {
        _currentQueueIndex = DateTime.now().millisecondsSinceEpoch % widget.queue!.length;
      } else {
        _currentQueueIndex = (_currentQueueIndex - 1 + widget.queue!.length) % widget.queue!.length;
      }
      _controller.pause();
      _controller = VideoPlayerController.file(
        File(widget.queue![_currentQueueIndex].path),
      );
      _controller.initialize().then((_) {
        _controller.addListener(_onVideoChanged);
        _controller.play();
        setState(() {
          _isInitialized = true;
          _duration = _controller.value.duration;
        });
      });
    }
  }

  void _startHideTimer() {
    _hideControlsTimer?.cancel();
    _hideControlsTimer = Timer(const Duration(seconds: 5), () {
      if (mounted && _controller.value.isPlaying) {
        setState(() => _showControls = false);
      }
    });
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
      if (_showControls) {
        _startHideTimer();
      }
    });
  }

  void _togglePlayPause() {
    if (_controller.value.isPlaying) {
      _controller.pause();
      _hideControlsTimer?.cancel();
      setState(() => _showControls = true);
    } else {
      _controller.play();
      _startHideTimer();
    }
  }

  void _seekForward() {
    _controller.seekTo(_controller.value.position + const Duration(seconds: 10));
  }

  void _seekBackward() {
    _controller.seekTo(_controller.value.position - const Duration(seconds: 10));
  }

  void _setPlaybackSpeed(double speed) {
    setState(() => _playbackSpeed = speed);
    _controller.setPlaybackSpeed(speed);
  }

  void _setVolume(double volume) {
    setState(() => _volume = volume);
    _controller.setVolume(volume);
  }

  void _toggleLock() {
    setState(() {
      _isLocked = !_isLocked;
      if (_isLocked) {
        _showControls = false;
        _hideControlsTimer?.cancel();
      } else {
        _showControls = true;
        _startHideTimer();
      }
    });
  }

  void _toggleOneHandMode() {
    setState(() => _isOneHandMode = !_isOneHandMode);
  }

  Future<void> _addSubtitleFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['srt', 'vtt', 'ass'],
    );

    if (result != null && result.files.single.path != null) {
      final content = await File(result.files.single.path!).readAsString();
      setState(() {
        _subtitles = SubtitleParser.parse(content);
        _showSubtitles = true;
      });
    }
  }

  void _updateCurrentSubtitle() {
    if (!_showSubtitles || _subtitles.isEmpty) {
      setState(() => _currentSubtitle = null);
      return;
    }

    final adjustedPosition = _position + Duration(milliseconds: _subtitleDelay);
    for (final subtitle in _subtitles) {
      if (adjustedPosition >= subtitle.start && adjustedPosition <= subtitle.end) {
        setState(() => _currentSubtitle = subtitle);
        return;
      }
    }
    setState(() => _currentSubtitle = null);
  }

  void _showSubtitleSettings() {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Subtitle Settings',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  SwitchListTile(
                    title: const Text('Show Subtitles'),
                    value: _showSubtitles,
                    onChanged: (value) {
                      setModalState(() => _showSubtitles = value);
                      setState(() => _showSubtitles = value);
                    },
                  ),
                  ListTile(
                    title: const Text('Subtitle Font Size'),
                    subtitle: Slider(
                      value: _subtitleFontSize,
                      min: 12,
                      max: 32,
                      divisions: 10,
                      label: _subtitleFontSize.toStringAsFixed(0),
                      onChanged: (value) {
                        setModalState(() => _subtitleFontSize = value);
                        setState(() => _subtitleFontSize = value);
                      },
                    ),
                  ),
                  ListTile(
                    title: const Text('Subtitle Color'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _colorButton(Colors.white, setModalState),
                        _colorButton(Colors.yellow, setModalState),
                        _colorButton(Colors.green, setModalState),
                        _colorButton(Colors.cyan, setModalState),
                      ],
                    ),
                  ),
                  ListTile(
                    title: const Text('Subtitle Delay'),
                    subtitle: Slider(
                      value: _subtitleDelay.toDouble(),
                      min: -5000,
                      max: 5000,
                      divisions: 20,
                      label: '${(_subtitleDelay / 1000).toStringAsFixed(1)}s',
                      onChanged: (value) {
                        setModalState(() => _subtitleDelay = value.toInt());
                        setState(() => _subtitleDelay = value.toInt());
                      },
                    ),
                  ),
                  ListTile(
                    leading: const Icon(Icons.folder),
                    title: const Text('Load Subtitle File'),
                    onTap: () {
                      Navigator.pop(context);
                      _addSubtitleFile();
                    },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _colorButton(Color color, StateSetter setModalState) {
    return GestureDetector(
      onTap: () {
        setModalState(() => _subtitleColor = color);
        setState(() => _subtitleColor = color);
      },
      child: Container(
        width: 32,
        height: 32,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(
            color: _subtitleColor == color ? Colors.blue : Colors.grey,
            width: 2,
          ),
        ),
      ),
    );
  }

  void _showVideoEditor() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VideoEditorScreen(video: widget.video),
      ),
    );
  }

  void _enterPiPMode() {
    setState(() {
      _isPiPMode = true;
      _showControls = false;
    });
  }

  void _exitPiPMode() {
    setState(() {
      _isPiPMode = false;
      _showControls = true;
      _startHideTimer();
    });
  }

  void _toggleBackgroundPlay() {
    setState(() => _isBackgroundPlay = !_isBackgroundPlay);
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _hideControlsTimer?.cancel();
    _controller.removeListener(_onVideoChanged);
    _controller.dispose();
    WakelockPlus.disable();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isPiPMode) {
      return _buildPiPPlayer();
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: _isLocked ? null : _toggleControls,
        onDoubleTap: _isLocked ? null : _seekForward,
        onHorizontalDragStart: _isLocked ? null : _onHorizontalDragStart,
        onHorizontalDragUpdate: _isLocked ? null : _onHorizontalDragUpdate,
        onHorizontalDragEnd: _isLocked ? null : _onHorizontalDragEnd,
        onVerticalDragStart: _isLocked ? null : _onVerticalDragStart,
        onVerticalDragUpdate: _isLocked ? null : _onVerticalDragUpdate,
        onVerticalDragEnd: _isLocked ? null : _onVerticalDragEnd,
        child: Stack(
          children: [
            Center(
              child: AspectRatio(
                aspectRatio: _controller.value.aspectRatio,
                child: VideoPlayer(_controller),
              ),
            ),
            if (!_isInitialized)
              const Center(child: CircularProgressIndicator()),
            if (_currentSubtitle != null && _showSubtitles)
              Positioned(
                bottom: _isOneHandMode ? 150 : 80,
                left: 20,
                right: 20,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _currentSubtitle!.text,
                      style: TextStyle(
                        fontSize: _subtitleFontSize,
                        color: _subtitleColor,
                        fontWeight: FontWeight.bold,
                        shadows: [
                          const Shadow(
                            color: Colors.black,
                            blurRadius: 4,
                            offset: Offset(1, 1),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            if (_isDragging && _seekAmount != 0)
              Center(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${_seekAmount > 0 ? '+' : ''}${_seekAmount.toStringAsFixed(1)}s',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            if (_isDragging && _volumeChange != 0)
              Positioned(
                right: 20,
                top: MediaQuery.of(context).size.height / 2 - 50,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        _volume > 0.5 ? Icons.volume_up : Icons.volume_down,
                        color: Colors.white,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${(_volume * 100).toInt()}%',
                        style: const TextStyle(color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
            if (_isLocked)
              Positioned(
                top: 50,
                right: 20,
                child: IconButton(
                  icon: const Icon(Icons.lock, color: Colors.white),
                  onPressed: _toggleLock,
                ),
              ),
            if (_showControls && !_isLocked)
              _buildControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildControls() {
    final bottomPadding = _isOneHandMode ? 100.0 : 16.0;

    return AnimatedOpacity(
      opacity: _showControls ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 300),
      child: Stack(
        children: [
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black54, Colors.transparent],
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Expanded(
                    child: Text(
                      widget.video.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      _isBackgroundPlay ? Icons.headset : Icons.headset_outlined,
                      color: _isBackgroundPlay ? Colors.blue : Colors.white,
                    ),
                    onPressed: _toggleBackgroundPlay,
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit, color: Colors.white),
                    onPressed: _showVideoEditor,
                  ),
                  IconButton(
                    icon: const Icon(Icons.picture_in_picture, color: Colors.white),
                    onPressed: _enterPiPMode,
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: bottomPadding,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [Colors.black54, Colors.transparent],
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SliderTheme(
                    data: SliderThemeData(
                      trackHeight: 3,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                      overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
                      activeTrackColor: Colors.blue,
                      inactiveTrackColor: Colors.grey,
                      thumbColor: Colors.blue,
                      overlayColor: Colors.blue.withOpacity(0.2),
                    ),
                    child: Slider(
                      value: _position.inMilliseconds.toDouble(),
                      max: _duration.inMilliseconds.toDouble().clamp(1, double.infinity),
                      onChanged: (value) {
                        _controller.seekTo(Duration(milliseconds: value.toInt()));
                      },
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _formatDuration(_position),
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        Text(
                          _formatDuration(_duration),
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.replay_10, color: Colors.white, size: 30),
                        onPressed: _seekBackward,
                      ),
                      if (widget.queue != null && widget.queue!.length > 1)
                        IconButton(
                          icon: const Icon(Icons.skip_previous, color: Colors.white, size: 30),
                          onPressed: _playPrevious,
                        ),
                      IconButton(
                        icon: Icon(
                          _controller.value.isPlaying
                              ? Icons.pause_circle_filled
                              : Icons.play_circle_filled,
                          color: Colors.white,
                          size: 50,
                        ),
                        onPressed: _togglePlayPause,
                      ),
                      if (widget.queue != null && widget.queue!.length > 1)
                        IconButton(
                          icon: const Icon(Icons.skip_next, color: Colors.white, size: 30),
                          onPressed: _playNext,
                        ),
                      IconButton(
                        icon: const Icon(Icons.forward_10, color: Colors.white, size: 30),
                        onPressed: _seekForward,
                      ),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      IconButton(
                        icon: Icon(
                          _isShuffled ? Icons.shuffle_on : Icons.shuffle,
                          color: _isShuffled ? Colors.blue : Colors.white,
                        ),
                        onPressed: () => setState(() => _isShuffled = !_isShuffled),
                      ),
                      IconButton(
                        icon: Icon(
                          _repeatMode == RepeatMode.off
                              ? Icons.repeat
                              : _repeatMode == RepeatMode.all
                                  ? Icons.repeat
                                  : Icons.repeat_one,
                          color: _repeatMode != RepeatMode.off ? Colors.blue : Colors.white,
                        ),
                        onPressed: () {
                          setState(() {
                            switch (_repeatMode) {
                              case RepeatMode.off:
                                _repeatMode = RepeatMode.all;
                                break;
                              case RepeatMode.all:
                                _repeatMode = RepeatMode.one;
                                break;
                              case RepeatMode.one:
                                _repeatMode = RepeatMode.off;
                                break;
                            }
                          });
                        },
                      ),
                      PopupMenuButton<double>(
                        icon: const Icon(Icons.speed, color: Colors.white),
                        itemBuilder: (context) => [
                          _buildSpeedItem(0.25),
                          _buildSpeedItem(0.5),
                          _buildSpeedItem(0.75),
                          _buildSpeedItem(1.0),
                          _buildSpeedItem(1.25),
                          _buildSpeedItem(1.5),
                          _buildSpeedItem(1.75),
                          _buildSpeedItem(2.0),
                        ],
                        onSelected: _setPlaybackSpeed,
                      ),
                      IconButton(
                        icon: Icon(
                          _subtitleColor == Colors.white
                              ? Icons.closed_caption
                              : Icons.closed_caption,
                          color: _subtitles.isNotEmpty ? Colors.blue : Colors.white,
                        ),
                        onPressed: _showSubtitleSettings,
                      ),
                      IconButton(
                        icon: Icon(
                          _isLocked ? Icons.lock : Icons.lock_open,
                          color: Colors.white,
                        ),
                        onPressed: _toggleLock,
                      ),
                      IconButton(
                        icon: Icon(
                          _isOneHandMode ? Icons.pan_tool : Icons.pan_tool_outlined,
                          color: _isOneHandMode ? Colors.blue : Colors.white,
                        ),
                        onPressed: _toggleOneHandMode,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPiPPlayer() {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          Positioned(
            left: _pipPosition.dx,
            top: _pipPosition.dy,
            child: GestureDetector(
              onTap: _exitPiPMode,
              onPanStart: (details) {
                setState(() => _isDraggingPiP = true);
              },
              onPanUpdate: (details) {
                setState(() {
                  _pipPosition = Offset(
                    _pipPosition.dx + details.delta.dx,
                    _pipPosition.dy + details.delta.dy,
                  );
                });
              },
              onPanEnd: (details) {
                setState(() => _isDraggingPiP = false);
              },
              child: Container(
                width: _pipWidth,
                height: _pipHeight,
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.5),
                      blurRadius: 10,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(
                    children: [
                      AspectRatio(
                        aspectRatio: _controller.value.aspectRatio,
                        child: VideoPlayer(_controller),
                      ),
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          color: Colors.black54,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              IconButton(
                                icon: Icon(
                                  _controller.value.isPlaying
                                      ? Icons.pause
                                      : Icons.play_arrow,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                onPressed: _togglePlayPause,
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                              ),
                              IconButton(
                                icon: const Icon(Icons.close, color: Colors.white, size: 20),
                                onPressed: () {
                                  _controller.pause();
                                  Navigator.pop(context);
                                },
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  PopupMenuItem<double> _buildSpeedItem(double speed) {
    return PopupMenuItem(
      value: speed,
      child: Row(
        children: [
          if (_playbackSpeed == speed)
            const Icon(Icons.check, color: Colors.blue, size: 20),
          const SizedBox(width: 8),
          Text('${speed}x'),
        ],
      ),
    );
  }

  void _onHorizontalDragStart(DragStartDetails details) {
    _startDragX = details.globalPosition.dx;
    _startPosition = _controller.value.position;
    _isSeekingHorizontal = true;
    _isDragging = true;
    _seekAmount = 0;
  }

  void _onHorizontalDragUpdate(DragUpdateDetails details) {
    if (!_isSeekingHorizontal) return;
    final dx = details.globalPosition.dx - _startDragX;
    setState(() {
      _seekAmount = dx / 10;
    });
  }

  void _onHorizontalDragEnd(DragEndDetails details) {
    if (_isSeekingHorizontal) {
      _controller.seekTo(_startPosition + Duration(milliseconds: (_seekAmount * 1000).toInt()));
    }
    setState(() {
      _isSeekingHorizontal = false;
      _isDragging = false;
      _seekAmount = 0;
    });
  }

  void _onVerticalDragStart(DragStartDetails details) {
    final screenWidth = MediaQuery.of(context).size.width;
    if (details.globalPosition.dx > screenWidth / 2) {
      _startVolume = _volume;
      _isSeekingHorizontal = false;
    } else {
      _startBrightness = 1.0;
      _isSeekingHorizontal = false;
    }
    _startDragY = details.globalPosition.dy;
    _isDragging = true;
    _volumeChange = 0;
    _brightnessChange = 0;
  }

  void _onVerticalDragUpdate(DragUpdateDetails details) {
    final dy = details.globalPosition.dy - _startDragY;
    final screenWidth = MediaQuery.of(context).size.width;

    if (details.globalPosition.dx > screenWidth / 2) {
      setState(() {
        _volumeChange = -dy / 200;
        _volume = (_startVolume + _volumeChange).clamp(0.0, 1.0);
        _controller.setVolume(_volume);
      });
    } else {
      setState(() {
        _brightnessChange = -dy / 200;
      });
    }
  }

  void _onVerticalDragEnd(DragEndDetails details) {
    setState(() {
      _isDragging = false;
      _volumeChange = 0;
      _brightnessChange = 0;
    });
  }
}

enum RepeatMode { off, all, one }
